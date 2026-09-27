const { printStep, printSection, createSpinner, c } = require('./ui');
const { runAsync, runTaskWithSpinner } = require('./runner');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitServiceHealthy(serviceName, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const res = await runAsync('docker', ['compose', 'ps', serviceName, '--format', '{{.Health}}']);
    const health = (res.stdout || '').trim();
    if (health === 'healthy') {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function startDockerInfrastructure(services = ['postgres', 'redis', 'localstack']) {
  printSection('Docker Infrastructure Bootstrap', '🐳');

  const { result, spinner } = await runTaskWithSpinner(
    'Pulling images & starting Docker containers...',
    'docker',
    ['compose', 'up', '-d', ...services]
  );

  if (!result.ok) {
    spinner.fail(`Failed to launch containers: ${result.stderr}`);
    return false;
  }

  spinner.update('Verifying container health status...');

  for (const service of services) {
    spinner.update(`Waiting for ${c.bold(service)} healthcheck...`);
    const isHealthy = await waitServiceHealthy(service, 25);
    if (!isHealthy) {
      spinner.fail(`Service '${service}' did not report healthy in time.`);
      printStep('warning', `Check container logs: docker compose logs ${service}`);
      return false;
    }
  }

  spinner.succeed('PostgreSQL, Redis & LocalStack containers are healthy and running');
  printStep('success', 'PostgreSQL (pgvector)', 'Port 5432');
  printStep('success', 'Redis In-Memory Store', 'Port 6379');
  printStep('success', 'LocalStack S3 Storage', 'Port 4566');
  return true;
}

module.exports = {
  startDockerInfrastructure,
};
