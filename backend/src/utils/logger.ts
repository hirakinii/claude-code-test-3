import winston from 'winston';

/* istanbul ignore next -- @preserve: Environment variable fallback only used when env var is missing */
const logLevel = process.env.LOG_LEVEL || 'info';
/* istanbul ignore next -- @preserve: Environment variable fallback only used when env var is missing */
const logFormat = process.env.LOG_FORMAT || 'json';

/**
 * テキストフォーマット用のprintf関数を作成する
 * @returns winston.Logform.Format
 */
export function createTextFormat(): winston.Logform.Format {
  return winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${String(timestamp)} [${String(level)}]: ${String(message)} ${metaStr}`;
  });
}

const formats = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
];

/* istanbul ignore else -- @preserve: LOG_FORMAT branch depends on env var at module load time */
if (logFormat === 'json') {
  formats.push(winston.format.json());
} else {
  formats.push(createTextFormat());
}

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(...formats),
  defaultMeta: { service: 'spec-manager-backend' },
  transports: [
    new winston.transports.Console({
      /* istanbul ignore next -- @preserve: Development format branch depends on NODE_ENV at runtime */
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

/**
 * Morgan HTTP logger用のストリーム
 */
export const stream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
