// Wayvo AI module — suporta OpenAI e Anthropic (Claude).
// Prioridade: ANTHROPIC_API_KEY → OPENAI_API_KEY → erro.

const OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || '';
const OPENAI_BASE      = process.env.OPENAI_BASE_URL   || 'https://api.openai.com/v1';
const OPENAI_MODEL     = process.env.OPENAI_MODEL      || 'gpt-4o-mini';
const ANTHROPIC_KEY    = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL  = process.env.ANTHROPIC_MODEL   || 'claude-haiku-4-5';
const AI_TIMEOUT_MS    = 20000;

async function callOpenAI(systemPrompt, userPrompt, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: opts.maxTokens ?? 350,
        temperature: opts.temperature ?? 0.7,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `OpenAI HTTP ${res.status}`);
    }
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  } catch (e) { clearTimeout(timer); throw e; }
}

async function callAnthropic(systemPrompt, userPrompt, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: opts.maxTokens ?? 350,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Anthropic HTTP ${res.status}`);
    }
    const data = await res.json();
    return (data.content?.[0]?.text || '').trim();
  } catch (e) { clearTimeout(timer); throw e; }
}

/**
 * Chama o modelo de chat e retorna a resposta como string.
 * Usa Anthropic se ANTHROPIC_API_KEY disponível, senão OpenAI.
 */
async function callAI(systemPrompt, userPrompt, opts = {}) {
  if (ANTHROPIC_KEY) return callAnthropic(systemPrompt, userPrompt, opts);
  if (OPENAI_API_KEY) return callOpenAI(systemPrompt, userPrompt, opts);
  throw new Error('Nenhuma chave de IA configurada (ANTHROPIC_API_KEY ou OPENAI_API_KEY)');
}

module.exports = { callAI };
