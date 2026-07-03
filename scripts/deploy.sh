#!/bin/bash
# 部署到腾讯云服务器
# 用法: ./scripts/deploy.sh <服务器IP或host>

set -e

SERVER=${1:?请指定服务器地址，如: ./scripts/deploy.sh root@1.2.3.4}
REMOTE_DIR=/opt/football-news

echo "📦 构建前端..."
npm run build

echo "📤 上传到 $SERVER..."
ssh "$SERVER" "mkdir -p $REMOTE_DIR"
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'data' \
  --exclude '.git' \
  --exclude 'logs' \
  ./ "$SERVER:$REMOTE_DIR/"

echo "📥 服务器安装依赖..."
ssh "$SERVER" "cd $REMOTE_DIR && npm install --production"

echo "🔄 重启服务..."
ssh "$SERVER" "cd $REMOTE_DIR && mkdir -p data logs && pm2 startOrReload ecosystem.config.cjs && pm2 save"

echo "✅ 部署完成！"
echo "   访问: http://$SERVER:3001"
