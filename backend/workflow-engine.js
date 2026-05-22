// Wayvo workflow execution engine.
// Traverses a saved flow (nodes + edges) from the trigger node and
// executes each block. Used by the manual "Testar fluxo" run for now;
// the real incoming-message trigger is a separate future phase.
//
// Schema-aware: lê os campos estruturados dos blocos (text, prompt,
// url, options, amount/unit...). Suporta o bloco "goto" (Ir para fluxo).

const wpp = require('./whatsapp');

const MAX_STEPS = 80;          // total de blocos executados (anti-loop global)
const MAX_FLOW_JUMPS = 5;      // quantos "Ir para fluxo" encadeados
const TEST_DELAY_CAP_MS = 1500;

function applyVars(text, vars) {
  return String(text || '')
    .replace(/\{nome\}/gi, vars.name || '')
    .replace(/\{name\}/gi, vars.name || '')
    .replace(/\{numero\}/gi, vars.phone || '');
}

function outgoing(edges, nodeId) {
  return (edges || []).filter((e) => e.source === nodeId).map((e) => e.target);
}

function findStart(nodes) {
  return nodes.find((n) => n.data?.kind === 'trigger') || nodes[0];
}

function delayMs(d) {
  const amount = Math.max(0, Number(d.amount) || 1);
  const mult = { minutes: 60000, hours: 3600000, days: 86400000 }[d.unit || 'minutes'] || 60000;
  return amount * mult;
}
const LIVE_INLINE_MAX_MS = 10000; // delays curtos rodam inline; acima disso agenda

async function runFlow(workflow, { phone, name, sendText, loadFlow, onDelay, applyTag, startNodeIds }) {
  const vars = { name: name || '', phone };
  const log = [];
  const ctx = { steps: 0, jumps: 0, visitedFlows: new Set() };

  async function walk(flow, flowId, startIds) {
    if (!flow) return;
    if (flowId) {
      if (ctx.visitedFlows.has(flowId)) {
        log.push({ kind: 'goto', status: 'skipped', info: 'fluxo já visitado (loop evitado)' });
        return;
      }
      ctx.visitedFlows.add(flowId);
    }
    const nodes = flow.nodes || [];
    const edges = flow.edges || [];
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const seedIds = (startIds && startIds.length)
      ? startIds.filter((x) => byId.has(x))
      : (findStart(nodes) ? [findStart(nodes).id] : []);
    if (!seedIds.length) { log.push({ kind: 'flow', status: 'error', info: 'Fluxo sem nó inicial' }); return; }

    const visited = new Set();
    const queue = [...seedIds];

    while (queue.length && ctx.steps < MAX_STEPS) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      ctx.steps++;

      const node = byId.get(id);
      if (!node) continue;
      const d = node.data || {};
      const kind = d.kind;

      try {
        switch (kind) {
          case 'trigger':
            log.push({ node: id, kind, status: 'ok', info: 'Fluxo iniciado' });
            break;

          case 'message': {
            const t = applyVars(d.text ?? d.body, vars);
            if (t.trim()) { await sendText(phone, t); log.push({ node: id, kind, status: 'sent', info: t.slice(0, 60) }); }
            else log.push({ node: id, kind, status: 'skipped', info: 'sem texto' });
            break;
          }

          case 'ia': {
            const t = applyVars(d.prompt ?? d.body, vars);
            if (t.trim()) { await sendText(phone, t); log.push({ node: id, kind, status: 'sent', info: 'resposta IA (simulada)' }); }
            else log.push({ node: id, kind, status: 'skipped', info: 'sem instrução' });
            break;
          }

          case 'image':
          case 'video': {
            const cap = applyVars(d.caption, vars);
            const tag = kind === 'image' ? '[Imagem]' : '[Vídeo]';
            await sendText(phone, `${tag}${d.url ? ' ' + d.url : ''}${cap ? ' — ' + cap : ''}`.trim());
            log.push({ node: id, kind, status: 'sent', info: tag });
            break;
          }

          case 'audio':
            await sendText(phone, `[Áudio]${d.url ? ' ' + d.url : ''}`.trim());
            log.push({ node: id, kind, status: 'sent', info: '[Áudio]' });
            break;

          case 'choice': {
            const q = applyVars(d.question ?? d.body, vars);
            const opts = (d.options || []).filter((o) => String(o).trim());
            const txt = [q, ...opts.map((o, i) => `${i + 1}. ${o}`)].filter(Boolean).join('\n');
            if (txt.trim()) await sendText(phone, txt);
            log.push({ node: id, kind, status: 'ok', info: `${opts.length} opções` });
            break;
          }

          case 'delay': {
            const ms = delayMs(d);
            if (onDelay && ms > LIVE_INLINE_MAX_MS) {
              const targets = outgoing(edges, id).filter((t) => !visited.has(t));
              await onDelay({ flowId, resumeNodeIds: targets, delayMs: ms });
              log.push({ node: id, kind, status: 'scheduled', info: `agendado: +${d.amount || 1} ${d.unit || 'minutes'}` });
              continue; // pausa este ramo; será retomado pelo job
            }
            await new Promise((r) => setTimeout(r, onDelay ? Math.min(ms, LIVE_INLINE_MAX_MS) : Math.min(ms, TEST_DELAY_CAP_MS)));
            log.push({ node: id, kind, status: 'ok', info: `aguardou ${d.amount || 1} ${d.unit || 'minutes'}` });
            break;
          }

          case 'condition':
            log.push({ node: id, kind, status: 'ok', info: 'condição avaliada (ramo padrão)' });
            break;

          case 'goto': {
            if (!loadFlow || !d.targetFlowId) {
              log.push({ node: id, kind, status: 'skipped', info: 'fluxo de destino não configurado' });
              break;
            }
            if (ctx.jumps >= MAX_FLOW_JUMPS) {
              log.push({ node: id, kind, status: 'skipped', info: 'limite de saltos entre fluxos atingido' });
              break;
            }
            ctx.jumps++;
            const target = await loadFlow(d.targetFlowId);
            if (!target) { log.push({ node: id, kind, status: 'error', info: 'fluxo de destino não encontrado' }); break; }
            log.push({ node: id, kind, status: 'ok', info: `→ ${target.name || 'fluxo'}` });
            await walk(target, target.id || d.targetFlowId);
            break; // o fluxo destino assume a continuação
          }

          case 'tag': {
            const tags = Array.isArray(d.tags) ? d.tags.filter(Boolean) : (d.tag ? [d.tag] : []);
            if (!tags.length) {
              log.push({ node: id, kind, status: 'skipped', info: 'nenhuma tag configurada' });
            } else if (applyTag) {
              await applyTag(phone, tags);
              log.push({ node: id, kind, status: 'ok', info: `tags aplicadas: ${tags.join(', ')}` });
            } else {
              log.push({ node: id, kind, status: 'ok', info: `tag (sem callback): ${tags.join(', ')}` });
            }
            break;
          }

          case 'webhook': {
            const url = d.url?.trim();
            if (!url) { log.push({ node: id, kind, status: 'skipped', info: 'URL não configurada' }); break; }
            const method = (d.method || 'POST').toUpperCase();
            // Aplica variáveis no body template
            let body = undefined;
            if (d.bodyTemplate?.trim()) {
              const rendered = applyVars(d.bodyTemplate, vars);
              try { body = JSON.parse(rendered); }
              catch { body = { raw: rendered }; }
            } else if (method !== 'GET') {
              body = { phone, name: vars.name, numero: phone };
            }
            // Headers extras
            let extraHeaders = {};
            if (d.headers?.trim()) {
              try { extraHeaders = JSON.parse(d.headers); } catch { /* ignora headers inválidos */ }
            }
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 10000);
            try {
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...extraHeaders },
                body: body != null ? JSON.stringify(body) : undefined,
                signal: ctrl.signal,
              });
              clearTimeout(timeout);
              log.push({ node: id, kind, status: res.ok ? 'ok' : 'warn', info: `HTTP ${res.status} ${method} ${url.slice(0, 50)}` });
            } catch (fetchErr) {
              clearTimeout(timeout);
              log.push({ node: id, kind, status: 'error', info: `Webhook falhou: ${fetchErr.message}` });
            }
            break;
          }

          case 'api':
          case 'redirect':
            log.push({ node: id, kind, status: 'ok', info: `${kind} (simulado no teste)` });
            break;

          default:
            log.push({ node: id, kind: kind || 'unknown', status: 'skipped', info: 'tipo desconhecido' });
        }
      } catch (e) {
        log.push({ node: id, kind, status: 'error', info: e.message });
      }

      for (const next of outgoing(edges, id)) {
        if (!visited.has(next)) queue.push(next);
      }
    }
  }

  await walk(workflow, workflow.id || null, startNodeIds);
  return { ok: true, steps: ctx.steps, log };
}

// Manual test run: envia pela sessão WhatsApp conectada.
async function testRun(workflow, sessionKey, phone, name, loadFlow, applyTag) {
  const sendText = (to, text) => wpp.sendMessage(sessionKey, to, text);
  return runFlow(
    { id: workflow.id, nodes: workflow.nodes || [], edges: workflow.edges || [] },
    { phone, name, sendText, loadFlow, applyTag }
  );
}

module.exports = { runFlow, testRun };
