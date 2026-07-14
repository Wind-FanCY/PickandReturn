import request from 'supertest';

// 注册一个测试用户，返回 supertest 响应
export async function createUser(app, { username, password }) {
    return request(app).post('/api/v1/users').send({ username, password });
}

// 登录并返回一个携带 sid cookie 的 supertest agent（后续请求自动带 cookie）
export async function login(app, { username, password }) {
    const agent = request.agent(app);
    const res = await agent.post('/api/v1/session').send({ username, password });
    return { agent, res };
}

// 注册 + 登录的组合，最常见的测试前置动作
export async function registerAndLogin(app, { username, password }) {
    await createUser(app, { username, password });
    return login(app, { username, password });
}
