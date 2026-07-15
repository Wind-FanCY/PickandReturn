# 部署手册（PickandReturn）

生产环境部署到阿里云 ECS，Nginx 反代 + PM2 托管 Node + 本机 PostgreSQL 16。

## 环境

| 项 | 值 |
|----|----|
| 服务器 | 阿里云 ECS `47.95.179.176`（Ubuntu 22.04，2C2G） |
| 域名 | `pnr.windfcy.fun`（备案通过后启用） |
| 部署目录 | `/var/www/pickandreturn` |
| 运行时 | Node 20（nvm）+ PM2（进程名 `pnr`，端口 3001） |
| 数据库 | PostgreSQL 16（apt/PGDG），库 `pnr_prod`，用户 `pnr` |
| 反代 | Nginx：`/` 托管 `dist/` 静态（SPA 回退），`/api/` → `127.0.0.1:3001` |

## 一次性初始化（已完成）

1. **PostgreSQL 16**：PGDG 阿里云镜像源安装；建库建用户
   ```bash
   sudo -u postgres psql -c "CREATE USER pnr WITH PASSWORD '<强密码>';"
   sudo -u postgres psql -c "CREATE DATABASE pnr_prod OWNER pnr;"
   ```
2. **Node 20 + PM2**：`nvm alias default 20 && npm i -g pm2`
3. **代码 + .env**：`git clone` 到 `/var/www/pickandreturn`；建 `.env`（不进 Git）：
   ```
   DATABASE_URL="postgresql://pnr:<密码>@127.0.0.1:5432/pnr_prod?schema=public"
   SESSION_SECRET="<openssl rand -hex 32>"
   NODE_ENV="production"
   PORT="3001"
   ```
4. **Nginx**：`deploy/nginx/pnr.windfcy.fun.conf` → `/etc/nginx/sites-available/`，软链到 `sites-enabled/`，`nginx -t && systemctl reload nginx`
5. **备份 cron**：`deploy/backup.sh`，crontab 每日 3 点

## 部署 / 更新（手动）

在 `/var/www/pickandreturn`：
```bash
# 获取新代码（git pull 若因国内网络失败，可用 rsync/scp 从本地推）
npm ci
npx prisma generate
npx prisma migrate deploy   # 应用新迁移
npm run build               # 构建前端
pm2 reload pnr              # 平滑重启
curl -s http://127.0.0.1:3001/api/v1/healthz   # 确认存活
```

## 待办：备案通过后上线（E7）

备案完成后执行，即可公网 HTTPS 访问：
```bash
# 1. 阿里云 DNS 加 A 记录：主机记录 pnr → 47.95.179.176
#    验证：dig +short pnr.windfcy.fun  应返回 47.95.179.176
# 2. 申请证书（自动改 Nginx 加 443 + 跳转）
sudo certbot --nginx -d pnr.windfcy.fun
# 3. 验证
curl -sI https://pnr.windfcy.fun/
curl -s https://pnr.windfcy.fun/api/v1/healthz
# 4. UptimeRobot 添加监控：每 5 分钟 ping https://pnr.windfcy.fun/api/v1/healthz
```

## 待办：CI/CD（可选，推送式部署）

国内 ECS 连 GitHub 不稳，采用**推送式**：GitHub Actions runner 构建后 rsync 推到 ECS，
服务器不主动连 GitHub。需配 GitHub Secrets（`ECS_HOST`/`ECS_USER`/`ECS_SSH_KEY`，
用专用部署密钥），workflow 触发于 push `main`。当前保持手动部署，暂未启用。

## 回滚

旧版本 `pnr-legacy`（或按需从 `/var/backups/pnr/` 恢复数据库）：
```bash
gunzip -c /var/backups/pnr/pnr-<TS>.sql.gz | sudo -u postgres psql pnr_prod
```
