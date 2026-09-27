const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { printStep, printSection, promptInput, c } = require('./ui');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT_DIR, '.env.example');

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

async function setupEnvFile(interactive = false) {
  printSection('Environment Configuration (.env)', '⚙');

  const envExists = fs.existsSync(ENV_PATH);
  let envData = envExists ? fs.readFileSync(ENV_PATH, 'utf-8') : '';

  if (!envExists) {
    if (fs.existsSync(ENV_EXAMPLE_PATH)) {
      envData = fs.readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    }
  }

  // Ensure high-entropy secrets are present and not default placeholders
  const jwtSecret = generateSecret(32);
  const refreshSecret = generateSecret(32);
  const internalSecret = generateSecret(32);

  if (!envExists || envData.includes('replace_with_a_secure_jwt_secret')) {
    envData = envData.replace(/JWT_SECRET=.*/g, `JWT_SECRET=${jwtSecret}`);
    envData = envData.replace(/REFRESH_TOKEN_SECRET=.*/g, `REFRESH_TOKEN_SECRET=${refreshSecret}`);
    envData = envData.replace(/INTERNAL_SERVICE_SECRET=.*/g, `INTERNAL_SERVICE_SECRET=${internalSecret}`);
  }

  if (interactive && !envExists) {
    process.stdout.write(`\n  ${c.dim('Configure AI Provider Keys (Optional — Press Enter to skip):')}\n`);
    const geminiKey = await promptInput('Gemini API Key', '');
    if (geminiKey) {
      envData = envData.replace(/GEMINI_API_KEY=.*/g, `GEMINI_API_KEY=${geminiKey}`);
    }
    const groqKey = await promptInput('Groq API Key (Optional STT/Whisper)', '');
    if (groqKey) {
      envData = envData.replace(/GROQ_API_KEY=.*/g, `GROQ_API_KEY=${groqKey}`);
    }
  }

  fs.writeFileSync(ENV_PATH, envData, 'utf-8');
  printStep('success', `.env file ready ${envExists ? '(verified)' : '(generated with secure secrets)'}`);
  return true;
}

module.exports = {
  setupEnvFile,
  parseEnv,
  ENV_PATH,
  ROOT_DIR,
};
