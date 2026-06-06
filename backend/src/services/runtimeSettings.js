const fs = require('fs/promises');
const path = require('path');

const SETTINGS_PATH = path.resolve(process.cwd(), '.runtime-settings.json');

const DEFAULT_SETTINGS = {
  aiProvider: 'ollama',
  updatedAt: null,
};

function normalizeProvider(value) {
  const provider = String(value || '').trim().toLowerCase();
  if (provider === 'openrouter' || provider === 'openai') return 'openrouter';
  return 'ollama';
}

function normalizeSettings(settings = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    aiProvider: normalizeProvider(settings.aiProvider ?? settings.provider),
    updatedAt: settings.updatedAt || new Date().toISOString(),
  };
}

async function readSettings() {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, 'utf-8');
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function writeSettings(nextSettings) {
  const current = await readSettings();
  const merged = normalizeSettings({ ...current, ...nextSettings });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

module.exports = {
  SETTINGS_PATH,
  DEFAULT_SETTINGS,
  normalizeProvider,
  normalizeSettings,
  readSettings,
  writeSettings,
};