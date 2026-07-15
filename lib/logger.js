// pino 日志单例。开发环境用 pino-pretty 美化，生产输出结构化 JSON。
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : isDev ? 'debug' : 'info'),
  // 敏感字段一律脱敏，永不进日志
  redact: {
    // 敏感字段一律脱敏：密码、请求 cookie、以及登录响应里的 Set-Cookie（含 sid，否则每次登录都把 session token 明文落日志）
    paths: [
      'password',
      'passwordHash',
      'password_hash',
      '*.password',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  transport: isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
    : undefined,
});

export default logger;
