#!/bin/sh

# 產生 Prisma client（保險）
npx prisma generate

# 部署 migration（正式上線）
npx prisma migrate deploy

# 啟動後端
node dist/server.js