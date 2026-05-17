// ZapFlow workflow execution engine.
// Traverses a saved flow (nodes + edges) from the trigger node and
// executes each node. Used by the manual "Testar fluxo" run for now;
// the real incoming-message trigger is a separate future phase.

const wpp = require('./whatsapp');

const MAX_STEPS = 60;
const TEST_DELAY_CAP_MS = 1500; // delays are capped during a manual test run

function applyVars(text, vars) {
  return String(text || '')
    .replace(/\{nome\}/gi, vars.name || '')
    .replace(/\{name\}/gi, vars.name || '')
    .replace(/\{numero\}/gi, vars.phone || '');
}

function outgoing(edges, nodeId) {
  return edges.filter((e) => e.source === nodeId).map((e) => e.target);
}

// Runs the flow for a single contact. `sendText` is injected so tests/real
// runs can share the traversal logic. Returns a step log.
async function runFlow({ nodes, edges }, { phone, name, sendText }) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const start =
    nodes.find((n) => n.data?.kind === 'trigger') || nodes[0];
  if (!start) return { ok: false, error: 'Fluxo sem nó inicial', log: [] };

  const vars = { name: name || '', phone };
  const log = [];
  const visited = new Set();
  const queue = [start.id];
  let steps = 0;

  while (queue.length && steps < MAX_STEPS) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    steps++;

    const node = byId.get(id);
    if (!node) continue;
    const kind = node.data?.kind;
    const body = applyVars(node.data?.body, vars);
    const title = node.data?.title || kind;

    try {
      switch (kind) {
        case 'trigger':
          log.push({ node: id, kind, status: 'ok', info: 'Fluxo iniciado' });
          break;

        case 'message':
        case 'ia':
          if (body.trim()) {
            await sendText(phone, body);
            log.push({ node: id, kind, status: 'sent', info: body.slice(0, 60) });
          } else {
            log.push({ node: id, kind, status: 'skipped', info: 'sem conteúdo' });
          }
          break;

        case 'image':
        case 'audio':
        case 'video': {
          const tag = { image: '[Imagem]', audio: '[Áudio]', video: '[Vídeo]' }[kind];
          await sendText(phone, `${tag} ${body}`.trim());
          log.push({ node: id, kind, status: 'sent', info: tag });
          break;
        }

        case 'choice':
          if (body.trim()) await sendText(phone, body);
          log.push({ node: id, kind, status: 'ok', info: 'opções enviadas' });
          break;

        case 'delay': {
          await new Promise((r) => setTimeout(r, TEST_DELAY_CAP_MS));
          log.push({ node: id, kind, status: 'ok', info: `aguardou (${title})` });
          break;
        }

        case 'condition':
          log.push({ node: id, kind, status: 'ok', info: 'condição avaliada (ramo padrão)' });
          break;

        case 'tag':
        case 'webhook':
        case 'api':
        case 'redirect':
          log.push({ node: id, kind, status: 'ok', info: `${title} (simulado no teste)` });
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

  return { ok: true, steps, log };
}

// Manual test run: sends through the user's connected WhatsApp session.
async function testRun(workflow, userId, phone, name) {
  const sendText = (to, text) => wpp.sendMessage(userId, to, text);
  return runFlow(
    { nodes: workflow.nodes || [], edges: workflow.edges || [] },
    { phone, name, sendText }
  );
}

module.exports = { runFlow, testRun };
