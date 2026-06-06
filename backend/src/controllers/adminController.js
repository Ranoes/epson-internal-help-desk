const { readSettings, writeSettings, normalizeProvider } = require('../services/runtimeSettings');

async function getAiSettings(req, res, next) {
  try {
    const settings = await readSettings();
    res.json({
      success: true,
      settings: {
        aiProvider: settings.aiProvider,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateAiSettings(req, res, next) {
  try {
    const aiProvider = normalizeProvider(req.body.aiProvider || req.body.provider);
    const settings = await writeSettings({ aiProvider });
    res.json({
      success: true,
      message: 'AI provider updated',
      settings: {
        aiProvider: settings.aiProvider,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAiSettings, updateAiSettings };