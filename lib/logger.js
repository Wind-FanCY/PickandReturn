// pino 日志单例。开发环境用 pino-pretty 美化，生产输出结构化 JSON。
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  // 敏感字段一律脱敏，永不进日志
  redact: {
    paths: ['password', 'passwordHash', 'password_hash', '*.password', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
});

export default logger;
