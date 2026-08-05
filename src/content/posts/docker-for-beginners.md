---
slug: "docker-for-beginners"
title: "Docker 入门笔记：从 Dockerfile 到多阶段构建的实战演进"
date: "2025-04-20"
tags: ["Docker", "DevOps", "容器化"]
summary: "记录从零学习 Docker 的完整过程，包括 Dockerfile 最佳实践、多阶段构建减小镜像体积、docker-compose 编排多服务，以及常见的生产环境配置陷阱。"
cover: ""
word_count: 0
---

# Docker 入门笔记：从 Dockerfile 到多阶段构建的实战演进

Docker 的核心价值不是"轻量级虚拟机"，而是**环境一致性**。不再有"在我电脑上能跑"的问题——Docker 镜像在任何支持 Docker 的环境中行为完全一致，因为镜像包含了应用运行所需的全部依赖，从操作系统库到语言运行时。

## Dockerfile 的层缓存机制

理解 Docker 的层缓存是写出高效 Dockerfile 的关键。每条指令（`FROM`、`RUN`、`COPY`）都会创建一个层，如果该层的输入没有变化，Docker 会复用缓存。这意味着**指令顺序直接影响构建速度**：

```dockerfile
# 好的做法：先复制依赖文件，利用缓存
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./    # 如果 package.json 没变，这层使用缓存
RUN npm ci --only=production  # 依赖安装也使用缓存
COPY . .                 # 源代码变化时才重新复制

# 不好的做法：先复制所有文件，每次改代码都重新安装依赖
COPY . .
RUN npm install
```

`npm ci` 比 `npm install` 更适合 Docker 构建：它严格按 `package-lock.json` 安装，速度更快，且如果 lock 文件没变，这层一定能命中缓存。

## 多阶段构建：分离构建环境和运行环境

初学者常见的 Dockerfile 把构建工具和运行时依赖混在一起，导致镜像体积巨大：

```dockerfile
# 单阶段（镜像体积大，包含 devDependencies 和构建工具）
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["node", "dist/server.js"]
# 镜像体积：~1.2GB
```

多阶段构建将构建和运行分离：

```dockerfile
# 阶段 1：构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2：运行（只复制构建产物和生产依赖）
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
CMD ["node", "dist/server.js"]
# 镜像体积：~180MB，减小了 85%
```

## docker-compose 的正确使用姿势

当项目依赖多个服务（应用 + 数据库 + 缓存），docker-compose 是必不可少的编排工具。一个常见但容易被忽略的配置：

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy  # 等待 MySQL 真正就绪，而不仅仅是容器启动
    environment:
      - DATABASE_URL=mysql://user:pass@mysql:3306/db

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: secret
    healthcheck:  # 健康检查确保服务真正可用
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10
```

`depends_on` 的默认行为只等待容器启动，不等待服务就绪。加上 `condition: service_healthy` 和健康检查后，应用容器会在 MySQL 真正接受连接后才启动，避免启动时的连接拒绝错误。

## 生产环境注意事项

- **不要以 root 用户运行容器**：在 Dockerfile 中添加 `USER node` 切换到非特权用户
- **使用 `.dockerignore`**：排除 `node_modules`、`.git`、`*.log` 等文件，减少构建上下文大小
- **固定基础镜像版本**：`FROM node:20-alpine` 比 `FROM node:latest` 更可预测，避免某天构建突然失败
- **敏感信息不要写入镜像层**：数据库密码、API key 通过环境变量或 Docker secrets 注入，不要在 Dockerfile 中写 `ENV PASSWORD=xxx`

Docker 的学习曲线在理解了分层和缓存机制后迅速平缓。建议从单容器应用开始，逐步过渡到 docker-compose 编排，最后再接触 Kubernetes 这样的容器编排平台。