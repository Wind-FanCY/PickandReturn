// Express app：只负责中间件挂载 + 路由注册。不调用 listen()，不启动定时任务，
// 这样 supertest 可以直接 import 这个 app 做集成测试，而不会意外触发午夜提醒任务。
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import prisma from './lib/prisma.js';
import logger from './lib/logger.js';
import requireAuth from './server/middleware/require-auth.js';
import { createLoginLimiter, createRegisterLimiter } from './server/middleware/login-rate-limit.js';
import sessionController from './server/controllers/session-controller.js';
import itemController from './server/controllers/item-controller.js';
import userController from './server/controllers/user-controller.js';
import notificationController from './server/controllers/notification-controller.js';

const app = express();

// 生产部署在 Nginx 反代后（单跳）。不设置的话 req.ip 恒为 127.0.0.1，
// 会让 express-rate-limit 退化成全站共享一个限流桶（任何人可锁死所有人登录）。
app.set('trust proxy', 1);

// 备案前用 http://IP 临时访问时（COOKIE_SECURE=false），去掉 CSP 的
// upgrade-insecure-requests——否则浏览器会把所有资源请求升级到 https，
// 而临时入口没有证书，导致静态资源全部加载失败（白屏）。上 HTTPS 后自动恢复默认。
const httpInterim = process.env.COOKIE_SECURE === 'false';
app.use(
  helmet(
    httpInterim
      ? { contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }
      : undefined
  )
);
app.use(pinoHttp({ logger }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json());
app.use(express.static('./dist'));

// 集成测试里每个用例都要反复登录，会在几个用例内就跑满配额；
// 限流本身在独立的 mini app 上单独测试（见 tests/auth.test.js），这里测试环境直接跳过。
const loginLimiter = createLoginLimiter({
    skip: () => process.env.NODE_ENV === 'test'
});
const registerLimiter = createRegisterLimiter({
    skip: () => process.env.NODE_ENV === 'test'
});

app.get('/api/v1/healthz', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', db: 'ok' });
    } catch (err) {
        req.log.error({ err }, 'healthz db check failed');
        res.status(503).json({ status: 'error', db: 'down' });
    }
});

app.post('/api/v1/users', registerLimiter, userController.register);

app.get('/api/v1/session', requireAuth, sessionController.getSession);
app.post('/api/v1/session', loginLimiter, sessionController.login);
app.patch('/api/v1/session', requireAuth, sessionController.patchSession);
app.delete('/api/v1/session', requireAuth, sessionController.logout);

app.get('/api/v1/items', requireAuth, itemController.getItemsList);
app.post('/api/v1/items', requireAuth, itemController.addItem);
app.post('/api/v1/items/:id/remind', requireAuth, itemController.sendNotice);
app.post('/api/v1/items/:id/request-return', requireAuth, itemController.requestReturn);
app.post('/api/v1/items/:id/confirm-return', requireAuth, itemController.confirmReturn);
app.put('/api/v1/items/:id', requireAuth, itemController.editItem);
app.delete('/api/v1/items/:id', requireAuth, itemController.deleteItem);
app.patch('/api/v1/items/:id/duedate', requireAuth, itemController.modifyDueDate);
app.patch('/api/v1/items/:id/modifylimit', requireAuth, itemController.updateModifyLimit);

// NOTE: /notifications/read must be registered before /notifications/:id
// to prevent Express treating "read" as an :id parameter
app.get('/api/v1/notifications', requireAuth, notificationController.getNotifications);
app.patch('/api/v1/notifications/read', requireAuth, notificationController.markAllRead);
app.delete('/api/v1/notifications/:id', requireAuth, notificationController.deleteNotification);

// SPA fallback：非 /api 的 GET 请求一律回退到前端 index.html，
// 让 react-router 的 BrowserRouter 在深链/刷新时也能工作（如直接访问 /login、/items）。
app.get(/^\/(?!api\/).*/, (req, res, next) => {
    res.sendFile(path.resolve('./dist/index.html'), (err) => {
        if (err) next();
    });
});

// 全局错误处理：不暴露 stack，只返回 { error: code }
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const log = req.log || logger;
    log.error({ err }, 'unhandled error');
    const status = err.status || 500;
    res.status(status).json({ error: err.code || 'server-error' });
});

export default app;
