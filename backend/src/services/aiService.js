const axios = require('axios');
const { readSettings } = require('./runtimeSettings');

class AIService {
  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
    this.openaiApiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  }

  calculateComplexity(message) {
    if (!message) return 0.0;
    const COMPLEXITY_KEYWORDS = [
      'kenapa', 'analisis', 'bandingkan', 'rekomendasi',
      'jelaskan secara detail', 'apa penyebab'
    ];
    const lower = message.toLowerCase();
    const keywordHits = COMPLEXITY_KEYWORDS.filter(k => lower.includes(k)).length;
    const lengthScore = Math.min(message.length / 300, 1);
    return Math.min((keywordHits * 0.25) + (lengthScore * 0.5), 1.0);
  }

  async processChat(userId, sessionId, message, imageBase64 = null, chatHistory = null) {
    const complexity = this.calculateComplexity(message);
    const runtimeSettings = await readSettings();
    const aiProvider = runtimeSettings.aiProvider || 'ollama';
    const engine = aiProvider === 'openrouter' ? 'openrouter-api' : 'ollama-local';

    try {
      // Call AI Engine (FastAPI/Python service)
      const payload = {
        userId: String(userId),
        sessionId: String(sessionId),
        message: String(message),
        imageBase64: imageBase64 || null,
        chatHistory: Array.isArray(chatHistory) ? chatHistory : null,
        engine: String(engine),
        provider: String(aiProvider),
        complexity: Number(complexity)
      };

      const response = await axios.post(`${this.aiEngineUrl}/chat`, payload);

      return response.data;
    } catch (err) {
      console.error('AI Engine Error:', err.message);
      // Fallback to basic response if AI Engine is down
      return {
        reply: "Maaf, sistem AI kami sedang mengalami gangguan. Mohon coba beberapa saat lagi atau hubungi IT Support.",
        confidence: 0,
        escalated: true
      };
    }
  }

  // Add alias selectAndGenerate to match how it's required in chatService.js
  async selectAndGenerate(userId, sessionId, message, imageBase64 = null, chatHistory = null) {
    return this.processChat(userId, sessionId, message, imageBase64, chatHistory);
  }
}

const aiServiceInstance = new AIService();
module.exports = {
  AIService,
  selectAndGenerate: aiServiceInstance.selectAndGenerate.bind(aiServiceInstance),
  default: aiServiceInstance
};
