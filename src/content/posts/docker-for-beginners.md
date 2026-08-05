---
slug: "docker-for-beginners"
title: "Docker 入门笔记：容器化部署的第一次亲密接触"
date: "2025-04-20"
tags: ["Docker", "DevOps", "技术笔记"]
summary: "记录第一次使用 Docker 部署项目的经历，从安装到编写 Dockerfile，再到使用 docker-compose 编排多容器应用。"
cover: ""
word_count: 0
---

# Docker 入门笔记：容器化部署的第一次亲密接触

之前一直听说 Docker 很强大，但总觉得那是运维的事情，和我一个前端开发关系不大。直到有一次需要在本地跑一个依赖 MySQL 和 Redis 的项目，环境配置搞了一下午，才决定认真学一下 Docker。

## 什么是 Docker

通俗地理解：Docker 就像一个"应用打包工具"。它把应用和它需要的所有依赖（系统库、环境变量、配置文件等）打包成一个标准化的"集装箱"，在任何地方都能运行。

不再需要说"在我电脑上能跑啊"——Docker 容器在任何机器上运行环境都是一致的。

## 核心概念

- **镜像（Image）**：应用的模板，类似于"安装包"
- **容器（Container）**：镜像的运行实例，类似于"正在运行的程序"
- **Dockerfile**：用来构建镜像的"配方"
- **docker-compose**：编排多个容器的工具

## 实战：部署一个 Node.js 应用

### 编写 Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

关键点：
- 使用 `alpine` 版本减小镜像体积
- 先 `COPY package*.json` 再 `npm install`，利用 Docker 的缓存层
- `npm ci` 比 `npm install` 更快且确定性更强

### 构建和运行

```bash
docker build -t my-app .
docker run -p 3000:3000 my-app
```

## 使用 docker-compose

当项目需要多个服务时（比如 Node.js + MySQL + Redis），docker-compose 可以一键启动所有服务：

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: secret
  redis:
    image: redis:alpine
```

启动：
```bash
docker-compose up -d
```

## 常用命令速查

```bash
docker ps                    # 查看运行中的容器
docker images                # 查看本地镜像
docker logs <容器名>         # 查看日志
docker exec -it <容器名> sh  # 进入容器内部
docker-compose down          # 停止并删除所有容器
docker system prune -a       # 清理所有无用资源
```

## 体会

Docker 的学习曲线比我想象的平缓。基本概念搞清楚后，跟着官方文档一步步来，很快就能上手。对于现代 Web 开发，Docker 已经不是"可选项"，而是"必备技能"了。