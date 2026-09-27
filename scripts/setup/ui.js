const readline = require('node:readline');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgDark: '\x1b[48;5;234m',
};

const c = {
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  red: (text) => `${colors.red}${text}${colors.reset}`,
  magenta: (text) => `${colors.magenta}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  white: (text) => `${colors.white}${text}${colors.reset}`,
  bold: (text) => `${colors.bold}${text}${colors.reset}`,
  dim: (text) => `${colors.dim}${text}${colors.reset}`,
};

const icons = {
  success: c.green('✔'),
  error: c.red('✖'),
  warning: c.yellow('▲'),
  info: c.cyan('ℹ'),
  arrow: c.magenta('➜'),
  sparkle: c.yellow('✦'),
  box: c.gray('■'),
};

function printBanner() {
  process.stdout.write('\x1Bc');
  const banner = `
${c.cyan('  ╭───────────────────────────────────────────────────────────╮')}
${c.cyan('  │')}  ${c.bold(c.white('NextRound / HireOS'))} ${c.gray('— Complete Workspace Setup CLI')}   ${c.cyan('│')}
${c.cyan('  │')}  ${c.dim('Zero-Human-Step AI Recruitment & Assessment Platform')}     ${c.cyan('│')}
${c.cyan('  ╰───────────────────────────────────────────────────────────╯')}
`;
  process.stdout.write(`${banner}\n`);
}

function printSection(title, icon = '✦') {
  const line = '─'.repeat(Math.max(10, 56 - title.length));
  process.stdout.write(`\n${c.cyan(icon)} ${c.bold(title)} ${c.gray(line)}\n`);
}

function printStep(status, message, detail = '') {
  const icon = icons[status] || icons.info;
  const detailStr = detail ? ` ${c.gray(`(${detail})`)}` : '';
  process.stdout.write(`  ${icon}  ${message}${detailStr}\n`);
}

function printBox(content, borderColor = 'gray') {
  const colorFn = c[borderColor] || c.gray;
  const lines = content.split('\n');
  const width = Math.max(...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, '').length), 40) + 4;
  const top = colorFn(`┌${'─'.repeat(width)}┐`);
  const bot = colorFn(`└${'─'.repeat(width)}┘`);
  process.stdout.write(`\n  ${top}\n`);
  for (const line of lines) {
    const rawLen = line.replace(/\x1b\[[0-9;]*m/g, '').length;
    const padding = ' '.repeat(Math.max(0, width - rawLen - 2));
    process.stdout.write(`  ${colorFn('│')} ${line}${padding} ${colorFn('│')}\n`);
  }
  process.stdout.write(`  ${bot}\n\n`);
}

function createSpinner(text) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  let timer = null;
  let currentText = text;

  function start() {
    process.stdout.write('\x1B[?25l');
    timer = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      process.stdout.write(`\r  ${c.cyan(frames[frameIndex])} ${currentText} `);
    }, 80);
  }

  function update(newText) {
    currentText = newText;
  }

  function succeed(successText) {
    clearInterval(timer);
    process.stdout.write(`\r  ${icons.success}  ${successText || currentText}\x1B[K\n`);
    process.stdout.write('\x1B[?25h');
  }

  function fail(failText) {
    clearInterval(timer);
    process.stdout.write(`\r  ${icons.error}  ${failText || currentText}\x1B[K\n`);
    process.stdout.write('\x1B[?25h');
  }

  function stop() {
    if (timer) clearInterval(timer);
    process.stdout.write('\r\x1B[K\x1B[?25h');
  }

  return { start, update, succeed, fail, stop };
}

async function promptInput(questionText, defaultValue = '') {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const defaultHint = defaultValue ? c.gray(` [${defaultValue}]`) : '';
  return new Promise((resolve) => {
    rl.question(`  ${c.magenta('?')} ${c.bold(questionText)}${defaultHint}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function promptSelect(questionText, choices) {
  process.stdout.write(`\n  ${c.magenta('?')} ${c.bold(questionText)}\n`);
  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];
    process.stdout.write(`    ${c.cyan(`${index + 1})`)} ${choice.label} ${c.gray(`— ${choice.hint}`)}\n`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`  ${c.gray('Enter choice [1-' + choices.length + ']: ')}`, (answer) => {
      rl.close();
      const num = parseInt(answer.trim(), 10);
      if (num >= 1 && num <= choices.length) {
        resolve(choices[num - 1].value);
        return;
      }
      resolve(choices[0].value);
    });
  });
}

module.exports = {
  c,
  icons,
  printBanner,
  printSection,
  printStep,
  printBox,
  createSpinner,
  promptInput,
  promptSelect,
};
