const { spawnSync } = require('node:child_process');
const { printStep, printSection, createSpinner } = require('./ui');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'nextroundbucket';

async function setupLocalStorage() {
  printSection('Local S3 Storage (LocalStack)', '📦');

  const spinner = createSpinner(`Ensuring S3 bucket '${BUCKET_NAME}' exists...`);
  spinner.start();

  try {
    const res = spawnSync('docker', [
      'exec',
      'nextround-localstack',
      'awslocal',
      's3',
      'mb',
      `s3://${BUCKET_NAME}`,
    ], {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // BucketAlreadyExists or make_bucket success is ok
    if (res.status === 0 || (res.stderr && res.stderr.includes('BucketAlreadyOwnedByYou'))) {
      spinner.succeed(`S3 bucket '${BUCKET_NAME}' is ready on LocalStack`);
      printStep('success', 'Endpoint', 'http://localhost:4566');
      return true;
    }

    spinner.succeed(`S3 bucket verified: ${BUCKET_NAME}`);
    return true;
  } catch (err) {
    spinner.fail(`LocalStack S3 bucket check error: ${err.message}`);
    return false;
  }
}

module.exports = {
  setupLocalStorage,
  BUCKET_NAME,
};
