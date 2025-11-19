import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const formats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
];

if (logFormat === 'json') {
  formats.push(winston.format.json());
} else {
  formats.push(
    winston.format.printf(({ level, message, timestamp, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }),
  );
}

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(...formats),
  defaultMeta: { service: 'spec-manager-backend' },
  transports: [
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === 'development'
          ? winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            )
          : winston.format.json(),
    }),
  ],
});

// Create stream for Morgan HTTP logger
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
