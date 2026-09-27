const { execSync, spawnSync } = require('node:child_process');
const { printStep, printSection, createSpinner, c } = require('./ui');

function isContainerRunning(containerName) {
  try {
    const out = execSync(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function waitServiceHealthy(serviceName, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const out = execSync(`docker compose ps ${serviceName} --format "{{.Health}}"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();
      if (out === 'healthy') {
        return true;
      }
    } catch {
      // Ignore intermediate poll failures
    }
    const end = Date.now() + 1000;
    while (Date.now() < end) {
      // Synchronous sleep 1s
    }
  }
  return false;
}

async function startDockerInfrastructure(services = ['postgres', 'redis', 'localstack']) {
  printSection('Docker Infrastructure Bootstrap', '🐳');

  const spinner = createSpinner('Starting PostgreSQL, Redis & LocalStack containers...');
  spinner.start();

  try {
    const result = spawnSync('docker', ['compose', 'up', '-d', ...services], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
      spinner.fail(`Failed to launch containers: ${result.stderr}`);
      return false;
    }

    spinner.update('Waiting for PostgreSQL (pgvector), Redis & LocalStack to become healthy...');

    for (const service of services) {
      spinner.update(`Verifying health of ${c.bold(service)}...`);
      const isHealthy = waitServiceHealthy(service, 25);
      if (!isHealthy) {
        spinner.fail(`Service ${service} did not become healthy in time.`);
        printStep('warning', `Check container logs: docker compose logs ${service}`);
        return false;
      }
    }

    spinner.succeed('PostgreSQL, Redis & LocalStack containers are healthy and running');
    printStep('success', 'PostgreSQL (pgvector)', 'Port 5432');
    printStep('success', 'Redis In-Memory Store', 'Port 6379');
    printStep('success', 'LocalStack S3 Storage', 'Port 4566');
    return true;
  } catch (err) {
    spinner.fail(`Docker setup encountered an error: ${err.message}`);
    return false;
  }
}

module.exports = {
  startDockerInfrastructure,
  isContainerRunning,
};
