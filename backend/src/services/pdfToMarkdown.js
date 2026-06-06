const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function getPythonCandidates() {
  const candidates = [];

  if (process.env.AI_ENGINE_PYTHON) {
    candidates.push(process.env.AI_ENGINE_PYTHON);
  }

  if (process.env.PYTHON) {
    candidates.push(process.env.PYTHON);
  }

  candidates.push(
    path.resolve(__dirname, '../../../.venv/Scripts/python.exe'),
    path.resolve(__dirname, '../../../ai-engine/.venv/Scripts/python.exe'),
    'python'
  );

  return candidates;
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `Python helper exited with code ${code}`));
    });
  });
}

async function convertPdfBufferToMarkdown(buffer, originalName = 'uploaded.pdf') {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'kb-pdf-'));
  const safeName = originalName.toLowerCase().endsWith('.pdf') ? originalName : `${originalName}.pdf`;
  const tempFilePath = path.join(tempDir, safeName.replace(/[^a-z0-9._-]/gi, '_'));
  const helperScript = path.resolve(__dirname, '../../../ai-engine/src/pdf_to_markdown.py');

  try {
    await fs.promises.writeFile(tempFilePath, buffer);

    let lastError = null;
    for (const python of getPythonCandidates()) {
      try {
        const markdown = await runProcess(python, [helperScript, tempFilePath]);
        const trimmed = markdown.trim();
        if (!trimmed) {
          throw new Error('PDF conversion returned empty markdown.');
        }
        return trimmed;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Unable to locate a Python interpreter for MarkItDown.');
  } finally {
    await fs.promises.rm(tempDir, { recursive: true, force: true });
  }
}

module.exports = { convertPdfBufferToMarkdown };