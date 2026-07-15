#!/usr/bin/env bash
# 每日备份 pnr_prod 数据库到本地磁盘，保留 7 天。
# 由 cron 每日凌晨 3 点触发（见 deploy/README 或 crontab）。
# 用 postgres 超级用户走 peer 认证，无需密码。
set -euo pipefail

BACKUP_DIR=/var/backups/pnr
DB=pnr_prod
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/pnr-$TS.sql.gz"

sudo -u postgres pg_dump "$DB" | gzip > "$OUT"
echo "$(date '+%F %T') backup written: $OUT ($(du -h "$OUT" | cut -f1))"

# 清理超过保留期的旧备份
find "$BACKUP_DIR" -name 'pnr-*.sql.gz' -mtime +"$RETAIN_DAYS" -delete
echo "$(date '+%F %T') pruned backups older than ${RETAIN_DAYS}d"
