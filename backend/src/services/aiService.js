const fetch = require('node-fetch');

const OLLAMA_URL    = process.env.OLLAMA_URL || 'http://localhost:11434';
const OPENAI_KEY    = process.env.OPENAI_API_KEY;
const AI_TIMEOUT_MS = 30000;

const COMPLEXITY_KEYWORDS = [
  'kenapa', 'analisis', 'bandingkan', 'rekomendasi',
  'jelaskan secara detail', 'apa penyebab'
];

function calcComplexity(msg) {
  const lower = msg.toLowerCase();
  const hits  = COMPLEXITY_KEYWORDS.filter(k => lower.includes(k)).length;
  const len   = Math.min(msg.length / 300, 1);
  return Math.min((hits * 0.25) + (len * 0.5), 1.0);
}

async function fetchWithTimeout(url, opts, ms = AI_TIMEOUT_MS) {
  const ctrl  = new (require('abort-controller'))();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function generateOllama(systemPrompt, userMessage) {
  const res = await fetchWithTimeout(`${OLLAMA_URL}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:    'llama3.2',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage }
      ],
      stream: false
    })
  });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json();
  return data.message.content;
}

async function generateOpenAI(systemPrompt, userMessage, imageBase64 = null, model = 'gpt-4o-mini') {
  const userContent = imageBase64
    ? [
        { type: 'text',      text: userMessage },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    : userMessage;

  const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent }
      ],
      max_tokens: 1000
    })
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function selectAndGenerate(systemPrompt, userMessage, imageBase64 = null) {
  const complexity = calcComplexity(userMessage);
  const hasImage   = !!imageBase64;
  let engineUsed   = '';

  try {
    if (hasImage) {
      engineUsed = 'openai-gpt4o';
      return { reply: await generateOpenAI(systemPrompt, userMessage, imageBase64, 'gpt-4o'), engineUsed };
    } else if (complexity >= 0.5 && OPENAI_KEY) {
      engineUsed = 'openai-gpt4o-mini';
      return { reply: await generateOpenAI(systemPrompt, userMessage, null, 'gpt-4o-mini'), engineUsed };
    } else {
      engineUsed = 'ollama-local';
      return { reply: await generateOllama(systemPrompt, userMessage), engineUsed };
    }
  } catch (err) {
    console.warn(`[AI] Engine ${engineUsed} failed → fallback Ollama:`, err.message);
    engineUsed = 'ollama-local-fallback';
    return { reply: await generateOllama(systemPrompt, userMessage), engineUsed };
  }
}

module.exports = { selectAndGenerate };
