# 部署手册（PickandReturn）

生产环境部署到阿里云 ECS，Nginx 反代 + PM2 托管 Node + 本机 PostgreSQL 16。

## 环境

| 项 | 值 |
|----|----|
| 服务器 | 阿里云 ECS `<SERVER_IP>`（Ubuntu 22.04，2C2G，实际 IP 见私有部署笔记，不入库） |
| 域名 | `pnr.windfcy.fun`（已备案，HTTPS 已上线） |
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
6. **日志轮转 + 留存 ≥6 个月**（合规，《网络安全法》第 21 条）：见 `deploy/LOGGING.md`

## 部署 / 更新（自动，主方式）

**push 到 `main` 即自动部署**，由 GitHub Actions（`.github/workflows/deploy.yml`）执行：
lint + 集成测试（runner 内起 Postgres）→ 全绿后构建前端 → rsync 推到 ECS →
在服务器 `npm ci` + `prisma migrate deploy` + `pm2 reload pnr` → 健康检查
`https://pnr.windfcy.fun/api/v1/healthz`。

推送式：runner 主动 SSH/rsync 到 ECS（服务器不连 GitHub）。依赖 GitHub Secrets：
`ECS_HOST` / `ECS_USER` / `ECS_SSH_KEY`（专用部署密钥）。

**日常发布**：合并 PR 到 `main` → 等 Actions 跑完（约 2 分钟）→ Actions 绿灯即上线。
可用 `gh run list` 或 GitHub 页面查看部署状态。

> ⚠️ **不要手动在服务器 `git pull` / `npm run build` / 改文件**。自动部署以 `ECS_USER`
> 身份 rsync，手动用 root 生成的文件会造成属主冲突，导致下次自动部署覆盖失败。

### 应急手动部署（仅当 Actions 不可用时）

必须用**部署目录的属主用户**操作（非 root，否则破坏后续自动部署）：
```bash
cd /var/www/pickandreturn
npm ci
npx prisma generate
npx prisma migrate deploy   # 应用新迁移
npm run build               # 构建前端
pm2 reload pnr              # 平滑重启
curl -s http://127.0.0.1:3001/api/v1/healthz   # 确认存活
```

## 备案与 HTTPS（已完成）

ICP + 公安联网备案均已通过，公网 HTTPS 已上线（`https://pnr.windfcy.fun`）。
以下为当初上线时执行的步骤，留作参考：
```bash
# 1. 阿里云 DNS 加 A 记录：主机记录 pnr → <SERVER_IP>
#    验证：dig +short pnr.windfcy.fun  应返回 <SERVER_IP>
# 2. 申请证书（自动改 Nginx 加 443 + 跳转）
sudo certbot --nginx -d pnr.windfcy.fun
# 3. 验证
curl -sI https://pnr.windfcy.fun/
curl -s https://pnr.windfcy.fun/api/v1/healthz
# 4. UptimeRobot 添加监控：每 5 分钟 ping https://pnr.windfcy.fun/api/v1/healthz
```

## 回滚

旧版本 `pnr-legacy`（或按需从 `/var/backups/pnr/` 恢复数据库）：
```bash
gunzip -c /var/backups/pnr/pnr-<TS>.sql.gz | sudo -u postgres psql pnr_prod
```
