import rateLimit from 'express-rate-limit';

// 登录接口限流：15 分钟内最多 10 次。抽成工厂函数，方便集成测试单独实例化
// （而不用共享 app 上会被所有测试跑满配额的那一个限流器）。
export function createLoginLimiter({ skip } = {}) {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: true,
        legacyHeaders: false,
        skip,
        handler(req, res) {
            res.status(429).json({ error: 'rate-limited' });
        }
    });
}
