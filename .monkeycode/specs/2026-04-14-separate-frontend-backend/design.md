# Technical Design Document - 前后端分离改造

Feature Name: 2026-04-14-separate-frontend-backend
Updated: 2026-04-14

## Description

将现有的 AI-PPT 架构图生成器从纯前端项目改造成前后端分离架构。采用 Node.js + Express 作为后端框架，MySQL 作为数据库，React + Vite 保持为前端框架，Docker Compose 进行容器化部署。

## Architecture

```mermaid
graph TB
    subgraph Client["前端 (Frontend)"]
        UI["React + Vite"]
    end
    
    subgraph Server["后端 (Backend)"]
        API["Express API Server"]
        AUTH["JWT Authentication"]
        IMG["Image Generation Service"]
    end
    
    subgraph Storage["存储 (Storage)"]
        DB["MySQL Database"]
        FS["File System /uploads"]
    end
    
    subgraph External["外部服务"]
        GEMINI["Google Gemini API"]
    end
    
    UI -->|"HTTPS"| API
    API -->|"Query"| DB
    API -->|"Read/Write"| FS
    API -->|"HTTP"| GEMINI
    
    ADMIN["Admin Panel"] -->|"Manage"| API
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite 6 + TypeScript |
| Backend | Node.js + Express 4 + TypeScript |
| Database | MySQL 8.0 |
| ORM | Prisma |
| Authentication | JWT (jsonwebtoken) + bcrypt |
| File Storage | Local File System |
| Container | Docker + Docker Compose |

## Project Structure

```
/workspace
├── frontend/                 # 前端项目 (原项目改造)
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API 调用
│   │   ├── stores/          # 状态管理
│   │   ├── types/           # 类型定义
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── routes/          # 路由
│   │   ├── middleware/      # 中间件
│   │   ├── prisma/          # 数据库模型
│   │   └── app.ts           # 应用入口
│   ├── uploads/             # 图片存储目录
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml        # Docker 编排
├── .env.example              # 环境变量示例
└── README.md
```

## Data Models

### User

| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | 用户ID |
| username | String | 用户名 (唯一) |
| password | String | 密码 (bcrypt加密) |
| role | Enum | admin / user |
| usageCount | Int | 剩余使用次数 |
| isDeleted | Boolean | 软删除标记 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |
| lastLoginAt | DateTime | 最后登录时间 |

### Image

| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | 图片ID |
| userId | Int (FK) | 所属用户 |
| filename | String | 存储文件名 |
| originalName | String | 原始文件名 |
| url | String | 访问URL |
| prompt | String | 生成时的提示词 |
| config | JSON | 生成配置 |
| createdAt | DateTime | 创建时间 |

### Share

| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | 分享ID |
| imageId | Int (FK) | 分享的图片 |
| shareCode | String | 分享码 (唯一) |
| isActive | Boolean | 是否有效 |
| visitCount | Int | 访问次数 |
| expiresAt | DateTime | 过期时间 |
| createdAt | DateTime | 创建时间 |

### ApiKey

| Field | Type | Description |
|-------|------|-------------|
| id | Int (PK) | Key ID |
| key | String | API Key (加密存储) |
| name | String | Key 名称/备注 |
| isActive | Boolean | 是否启用 |
| lastUsedAt | DateTime | 最后使用时间 |
| createdAt | DateTime | 创建时间 |

## API Endpoints

### 认证 (Authentication)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/login | 用户登录 | No |
| POST | /api/auth/register | 用户注册 (仅管理员) | Admin |
| GET | /api/auth/me | 获取当前用户信息 | User |

### 用户管理 (User Management)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/users | 获取用户列表 | Admin |
| POST | /api/users | 创建用户 | Admin |
| PUT | /api/users/:id | 更新用户信息/次数 | Admin |
| DELETE | /api/users/:id | 删除用户 | Admin |

### 图片生成 (Image Generation)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/images/generate | 生成图片 | User |
| GET | /api/images | 获取我的图库 | User |
| GET | /api/images/:id | 获取图片详情 | User |
| DELETE | /api/images/:id | 删除图片 | User |
| GET | /api/images/:id/download | 下载图片 | User |

### 分享 (Share)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/images/:id/share | 创建分享链接 | User |
| GET | /api/share/:code | 访问分享内容 | No |
| DELETE | /api/share/:id | 撤销分享 | User |

### 管理 (Admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/stats | 获取系统统计 | Admin |
| PUT | /api/admin/apikey | 更新 API Key | Admin |

## API Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_CREDENTIALS | 401 | 用户名或密码错误 |
| TOKEN_EXPIRED | 401 | Token 已过期 |
| UNAUTHORIZED | 403 | 无权限访问 |
| USER_NOT_FOUND | 404 | 用户不存在 |
| USAGE_EXHAUSTED | 403 | 使用次数不足 |
| IMAGE_NOT_FOUND | 404 | 图片不存在 |
| SHARE_NOT_FOUND | 404 | 分享不存在 |
| SHARE_EXPIRED | 410 | 分享已过期 |

## Authentication Flow

1. 用户登录时，后端验证用户名密码
2. 验证成功后，生成 JWT Token 返回
3. 前端存储 Token 到 localStorage
4. 后续请求在 Authorization Header 中携带 Token
5. 后端中间件验证 Token 有效性

## Image Generation Flow

1. 用户提交生成请求
2. 后端验证用户身份和剩余次数
3. 后端调用 Gemini API 生成图片
4. 成功后保存图片到文件系统
5. 记录图片信息到数据库
6. 扣减用户使用次数
7. 返回图片 URL 给前端

## Docker Configuration

### Services

1. **frontend**: React + Vite 开发服务器
2. **backend**: Node.js + Express API 服务器
3. **mysql**: MySQL 8.0 数据库
4. **nginx**: 反向代理 (生产环境)

### Volumes

- `mysql_data`: MySQL 数据持久化
- `uploads`: 图片文件持久化

### Environment Variables

```env
# Database
DATABASE_URL=mysql://user:password@mysql:3306/aippt

# JWT
JWT_SECRET=your-secret-key

# Gemini API
GEMINI_API_KEY=your-api-key
```

## Correctness Properties

1. **原子性**: 图片生成和次数扣减必须在同一事务中完成
2. **一致性**: 用户次数不能为负数
3. **隔离性**: 并发生成时次数扣减必须准确
4. **持久性**: 登录状态在 Token 有效期内有效

## Error Handling

| Scenario | Handling |
|----------|----------|
| Gemini API 超时 | 返回错误，不扣次数 |
| Gemini API Key 限额 | 切换到下一个 Key |
| 数据库连接失败 | 返回 503 Service Unavailable |
| 文件系统满 | 返回错误，提示联系管理员 |
| 用户次数为 0 | 拒绝生成，提示次数不足 |

## Security Considerations

1. 密码使用 bcrypt 加密，salt rounds = 12
2. JWT Secret 至少 32 字符
3. 登录失败锁定机制：5次失败锁30分钟
4. 文件上传限制：仅允许 jpg/png/webp，最大 10MB
5. SQL 注入防护：使用 Prisma ORM
6. CORS 配置：仅允许指定前端域名
