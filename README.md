# AI-PPT 架构图生成器

前后端分离架构的用户权限管理和图片生成系统。

## 功能特性

- **用户管理**: 管理员创建用户、设置使用次数
- **用户认证**: JWT Token 登录认证
- **AI 图片生成**: 基于 Gemini API 生成设计图
- **次数限制**: 用户生成图片扣减使用量
- **图库管理**: 查看、删除、分享、下载图片
- **分享功能**: 生成分享链接，无需登录即可查看

## 技术栈

| 前端 | 后端 | 数据库 | 其他 |
|------|------|--------|------|
| React 19 | Node.js | MySQL 8.0 | Docker |
| Vite 6 | Express 4 | Prisma ORM | Nginx |
| React Router | TypeScript | | |

## 快速开始

### 开发环境

1. 复制环境变量文件:
```bash
cp .env.example .env
```

2. 启动 MySQL:
```bash
docker compose up -d mysql
```

3. 安装依赖:
```bash
cd frontend && npm install
cd ../backend && npm install
```

4. 初始化数据库:
```bash
cd backend
npx prisma generate
npx prisma db push
```

5. 启动服务:
```bash
# 终端1: 启动后端
cd backend && npm run dev

# 终端2: 启动前端
cd frontend && npm run dev
```

6. 访问 http://localhost:5173

### Docker 部署

```bash
docker compose up -d
```

访问 http://localhost

## 默认账户

首次部署需要手动创建管理员账户:

1. 通过数据库或 Adminer 创建用户
2. 设置 role 为 `admin`
3. 登录后创建普通用户

## API 接口

### 认证
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 用户管理 (管理员)
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户

### 图片 (用户)
- `POST /api/images/generate` - 生成图片
- `GET /api/images` - 获取图库
- `DELETE /api/images/:id` - 删除图片

### 分享
- `POST /api/images/:id/share` - 创建分享
- `GET /api/share/:code` - 访问分享

## 目录结构

```
.
├── frontend/           # 前端项目
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── services/  # API 服务
│   │   └── App.tsx
│   └── vite.config.ts
├── backend/            # 后端项目
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── prisma/
│   └── uploads/        # 图片存储
├── docker-compose.yml
└── nginx.conf
```
