# Requirements Document - 前后端分离改造

## Introduction

将现有的 AI-PPT 架构图生成器从纯前端项目改造成前后端分离架构，实现用户管理、次数限制、图库管理等完整功能。

## Glossary

- **管理员 (Admin)**: 系统管理者，可创建用户、设置用户使用次数
- **用户 (User)**: 普通用户，可使用 AI 生成图片功能
- **使用次数 (Usage Count)**: 用户可使用 AI 生成图片的次数限制
- **图库 (Gallery)**: 用户保存的 AI 生成图片集合
- **分享 (Share)**: 用户将图片分享给其他用户的机制

## Requirements

### Requirement 1: 用户认证系统

**User Story:** 作为管理员/用户，我希望能通过用户名和密码登录系统，以便安全地访问系统功能。

#### Acceptance Criteria

1. WHEN 用户输入正确的管理员用户名和密码，THEN 系统 SHALL 允许管理员登录并进入管理后台
2. WHEN 用户输入正确的普通用户名和密码，THEN 系统 SHALL 允许用户登录并进入用户界面
3. WHEN 用户输入错误的密码，THEN 系统 SHALL 提示"用户名或密码错误"
4. WHEN 用户连续输入错误密码超过 5 次，THEN 系统 SHALL 锁定该账户 30 分钟
5. WHILE 用户已登录，THEN 系统 SHALL 在请求头中携带 JWT Token 进行身份验证

### Requirement 2: 管理员功能

**User Story:** 作为管理员，我希望能管理用户账号和使用次数，以便控制系统的使用权限。

#### Acceptance Criteria

1. WHEN 管理员登录成功，THEN 系统 SHALL 显示管理员控制面板
2. WHEN 管理员点击"新建用户"，THEN 系统 SHALL 展示用户名和初始密码输入框
3. WHEN 管理员输入用户名和密码并确认，THEN 系统 SHALL 创建新用户，初始使用次数为 0
4. WHEN 管理员选择已有用户，THEN 系统 SHALL 允许修改该用户的使用次数
5. WHEN 管理员删除用户，THEN 系统 SHALL 软删除该用户，保留其历史图片记录
6. WHEN 管理员查看用户列表，THEN 系统 SHALL 显示用户名、剩余次数、创建时间、最后登录时间

### Requirement 3: AI 图片生成与次数扣减

**User Story:** 作为用户，我希望能生成 AI 图片，且每次成功生成时扣减一次使用量，以便控制资源使用。

#### Acceptance Criteria

1. WHEN 用户点击"生成图片"按钮，THEN 系统 SHALL 检查用户剩余使用次数是否大于 0
2. IF 用户剩余次数 <= 0，THEN 系统 SHALL 提示"使用次数不足，请联系管理员"
3. WHEN 图片生成成功，THEN 系统 SHALL 扣减用户 1 次使用量
4. WHEN 图片生成失败，THEN 系统 SHALL 不扣减使用量
5. WHEN 用户查看个人中心，THEN 系统 SHALL 显示用户剩余使用次数

### Requirement 4: 图库管理

**User Story:** 作为用户，我希望能保存、查看、删除和管理我的图片，以便后续使用和整理。

#### Acceptance Criteria

1. WHEN 图片生成成功，THEN 系统 SHALL 自动保存该图片到用户的图库
2. WHEN 用户点击"图库"，THEN 系统 SHALL 显示用户所有已保存的图片，按时间倒序排列
3. WHEN 用户点击单张图片，THEN 系统 SHALL 显示图片大图和详细信息
4. WHEN 用户点击删除按钮，THEN 系统 SHALL 弹出确认框，确认后删除图片
5. IF 用户删除图片，THEN 系统 SHALL 从图库中移除，但保留记录

### Requirement 5: 图片分享

**User Story:** 作为用户，我希望能将我的图片分享给其他人，以便展示我的作品。

#### Acceptance Criteria

1. WHEN 用户点击图片的"分享"按钮，THEN 系统 SHALL 生成一个唯一的分享链接
2. WHEN 其他用户通过分享链接访问，THEN 系统 SHALL 显示图片但无需登录
3. WHEN 分享链接被访问，THEN 系统 SHALL 记录访问次数
4. WHEN 用户撤销分享，THEN 系统 SHALL 使分享链接失效

### Requirement 6: 图片下载

**User Story:** 作为用户，我希望能下载我的图片到本地，以便离线使用。

#### Acceptance Criteria

1. WHEN 用户点击"下载"按钮，THEN 系统 SHALL 触发浏览器下载图片到本地
2. WHEN 用户在图库大图模式点击"下载"，THEN 系统 SHALL 以原始文件名下载图片
3. WHEN 用户批量选择图片后点击"批量下载"，THEN 系统 SHALL 打包为 ZIP 文件供下载

### Requirement 7: API Key 安全存储

**User Story:** 作为系统，我希望能将 API Key 安全地存储在服务端，以便保护密钥安全。

#### Acceptance Criteria

1. WHEN 系统启动，THEN 后端 SHALL 从环境变量或配置文件加载 API Key
2. WHEN 前端请求图片生成，THEN 后端 SHALL 使用存储的 API Key 调用 Gemini 服务
3. WHEN API Key 变更，THEN 管理员 SHALL 可通过管理后端更新 API Key
4. WHEN API Key 达到限额，THEN 后端 SHALL 自动切换到下一个可用的 API Key（如果配置了多个）

### Requirement 8: Docker 部署

**User Story:** 作为部署人员，我希望能通过 Docker 快速部署系统，以便简化运维工作。

#### Acceptance Criteria

1. WHEN 执行 `docker-compose up`，THEN 系统 SHALL 启动前端、后端、MySQL 三个服务
2. WHEN 容器启动，THEN MySQL SHALL 自动创建所需的数据库和表结构
3. WHEN 容器重启，THEN 系统 SHALL 自动恢复数据持久化
4. WHEN 查看容器日志，THEN 运维人员 SHALL 可看到前端、后端的运行日志

## Non-Functional Requirements

### Performance

- 图片生成请求响应时间不超过 60 秒
- 图库列表加载时间不超过 3 秒（分页加载）

### Security

- 所有密码 SHALL 使用 bcrypt 加密存储
- JWT Token 有效期 SHALL 为 24 小时
- 文件上传 SHALL 限制大小为 10MB

### Scalability

- 系统 SHALL 支持横向扩展，通过增加后端实例提高并发能力
