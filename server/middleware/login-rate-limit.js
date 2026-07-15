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

// 注册接口限流：比登录宽松，1 小时内最多 20 次。防批量建号与用户名枚举滥用。
export function createRegisterLimiter({ skip } = {}) {
    return rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: 20,
        standardHeaders: true,
        legacyHeaders: false,
        skip,
        handler(req, res) {
            res.status(429).json({ error: 'rate-limited' });
        }
    });
}
