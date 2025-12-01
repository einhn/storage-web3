FROM node:24-slim

WORKDIR /app

# 1) 시스템 패키지 (sharp 등 빌드용)
RUN apt-get update && apt-get install -y \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# 2) package.json 먼저 복사 후 설치
COPY package*.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate
COPY contracts ./contracts

# 3) 소스 복사 + 빌드
COPY src ./src

RUN npm run build

# 4) 런타임 환경 변수는 k8s에서 주입
ENV NODE_ENV=production

CMD ["sh", "-c", "npm run prisma:migrate && npm start"]