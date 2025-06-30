import pino from 'pino';

const logger = pino({
  base: {
    memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
    region: process.env.AWS_REGION,
    runtime: process.env.AWS_EXECUTION_ENV,
    version: process.env.AWS_LAMBDA_FUNCTION_VERSION,
  },
  enabled: process.env.NODE_ENV !== 'test',
  name: process.env.AWS_LAMBDA_FUNCTION_NAME,
  autoLogging: false,
  level: process.env.LOG_LEVEL || 'info',
  redact: [
    'email',
    'authorization',
    'headers.authorization',
    'req.headers.authorization',
  ],
});

export default logger;
