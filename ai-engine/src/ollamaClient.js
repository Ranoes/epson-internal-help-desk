/**
 * Ollama client wrapper.
 *
 * Uses the official `ollama` npm package to communicate with a locally running
 * Ollama server.  The model and base URL can be configured via environment
 * variables so the AI Engine stays portable across dev / prod environments.
 */

const { Ollama } = require("ollama");

const ollamaClient = new Ollama({
  host: process.env.OLLAMA_HOST || "http://localhost:11434",
});

const MODEL = process.env.OLLAMA_MODEL || "llama3";

/**
 * Send a conversation to Ollama and return the assistant reply.
 *
 * @param {string} systemPrompt  - Instructions / persona for the assistant.
 * @param {{ role: string, content: string }[]} history - Previous messages.
 * @param {string} userMessage   - Latest user message.
 * @returns {Promise<string>} The assistant's reply text.
 */
async function chat(systemPrompt, history, userMessage) {
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const response = await ollamaClient.chat({ model: MODEL, messages });
  return response.message.content;
}

module.exports = { chat, MODEL };
