# 日志留存与轮转（合规）

## 为什么

《网络安全法》第 21 条要求网络运营者「采取监测、记录网络运行状态、网络安全事件的技术措施，
并按照规定留存相关的网络日志**不少于六个月**」。

现状：PM2 将 Node 日志写入 `./logs/pnr-out.log` / `./logs/pnr-error.log`（见
`ecosystem.config.cjs`）。应用层脱敏已达标（`lib/logger.js` 对密码 / cookie / set-cookie
做 `[REDACTED]`），但**日志文件默认不轮转**——会无限增长撑爆磁盘，且没有明确的
留存周期。本文给出轮转 + 留存 ≥6 个月的配置。

目标：**按天轮转、压缩归档、至少保留 ~6.5 个月（200 天）**，同时给单文件加体积上限防暴涨。

---

## 方案 A（推荐）：pm2-logrotate 模块

PM2 原生模块，无需 root，能正确处理 PM2 持有的文件句柄。

```bash
# 1. 安装模块（一次性）
pm2 install pm2-logrotate

# 2. 配置：按天轮转 + 压缩 + 保留 200 份（≈6.5 个月）+ 单文件 50M 上限
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'   # 每天 0 点轮转
pm2 set pm2-logrotate:retain 200                   # 保留 200 个归档（>180 天）
pm2 set pm2-logrotate:compress true                # gzip 压缩历史日志
pm2 set pm2-logrotate:max_size 50M                 # 单文件超 50M 也触发轮转（安全阀）
pm2 set pm2-logrotate:dateFormat 'YYYY-MM-DD_HH-mm-ss'

# 3. 确认配置
pm2 conf pm2-logrotate
```

**验证**：
```bash
ls -la logs/                       # 应看到当前日志 + 轮转后的 .gz 归档
pm2 describe pnr | grep 'log path' # 确认日志路径
```

> 说明：本应用流量很低，按天轮转下单日日志远小于 50M，`max_size` 几乎不会额外触发；
> 因此「retain 200」基本等价于「保留约 200 天」，稳妥覆盖 6 个月要求。

---

## 方案 B（备选）：系统 logrotate

若倾向 OS 级统一管理，用 `deploy/logrotate/pnr`（本仓库已提供）。因 PM2 持有文件句柄，
必须用 `copytruncate`（复制后清空原文件，无需通知进程重开）。

```bash
# 部署目录假设为 /var/www/pickandreturn
sudo cp deploy/logrotate/pnr /etc/logrotate.d/pnr
sudo sed -i 's#/var/www/pickandreturn#<你的实际部署目录>#' /etc/logrotate.d/pnr  # 路径不同才需改

# 测试（--debug 只演练不实际轮转；-f 强制执行一次）
sudo logrotate --debug /etc/logrotate.d/pnr
sudo logrotate -f /etc/logrotate.d/pnr
```

两方案二选一即可，**不要同时启用**（会重复轮转）。
