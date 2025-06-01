# server/Dockerfile
FROM node:18-alpine

WORKDIR /app


# 安裝系統依賴
# openssl: Prisma 需要用於資料庫連線加密
# ca-certificates: SSL 憑證，確保 HTTPS 連線安全
RUN apk add --no-cache openssl ca-certificates


# 複製 package.json 和 package-lock.json
# 先複製依賴檔案，利用 Docker 快取機制，避免每次都重新安裝依賴
COPY package*.json ./


# 安裝所有依賴（包含開發依賴）
# 需要開發依賴來編譯 TypeScript
RUN npm ci --include=dev


# 複製專案所有檔案
COPY . .

# 生成 Prisma Client
# 根據 schema.prisma 生成對應的客戶端程式碼
RUN npx prisma generate


# 編譯 TypeScript 為 JavaScript
# 將 src/ 目錄下的 .ts 檔案編譯到 dist/ 目錄
RUN npm run build



# 暴露 port 3000
# 告知 Docker 應用程式監聽此 port
EXPOSE 3000

# 啟動應用程式
# 使用編譯後的 JavaScript 檔案
CMD ["node", "dist/server.js"]