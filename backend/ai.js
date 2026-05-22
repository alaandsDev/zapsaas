// Wayvo AI module — chama OpenAI (ou compatível) para gerar respostas.
// Se OPENAI_API_KEY não estiver configurada, lança erro e o engine usa fallback.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE    = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL   = process.env.OPENAI_MODEL    || 'gpt-4o-mini';
const AI_TIMEOUT_MS  = 20000;

/**
 * Chama o modelo de chat e retorna a resposta como string.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ maxTokens?: number, temperature?: number }} opts
 * @returns {Promise<string>}
 */
async function callAI(systemPrompt, userPrompt, opts = {}) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);

  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens:  opts.maxTokens  ?? 350,
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
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

module.exports = { callAI };
