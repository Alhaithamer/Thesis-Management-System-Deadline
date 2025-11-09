# 论文跟踪系统 API 文档

## 项目概述

本项目提供了一个基于Node.js和Express的API服务器，用于管理用户的论文项目。系统使用Prisma ORM进行数据库操作，支持论文与用户的关联以及进度历史记录的版本化存储。实现了基于JWT的用户认证系统，支持用户注册、登录功能，并包含用户角色管理（USER/ADMIN）。

## API 接口说明

### 1. 用户认证 API

#### 1.1 用户注册

**请求信息：**
- **方法：** POST
- **路径：** `/api/auth/register`
- **内容类型：** application/json
- **描述：** 创建新用户账号，支持指定角色（默认为USER）

**请求体参数：**

| 参数名 | 类型 | 必填 | 描述 | 验证规则 |
|--------|------|------|------|----------|
| username | String | 是 | 用户名 | 长度3-50字符 |
| email | String | 是 | 邮箱地址 | 有效的邮箱格式 |
| password | String | 是 | 密码 | 至少6个字符 |
| role | String | 否 | 用户角色 | 可选值：USER或ADMIN，默认为USER |

**请求体示例：**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "role": "USER"
}
```

**成功响应示例：**
```json
{
  "success": true,
  "message": "用户注册成功",
  "data": {
    "userId": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "metadata": {
    "registeredAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### 1.2 用户登录

**请求信息：**
- **方法：** POST
- **路径：** `/api/auth/login`
- **内容类型：** application/json
- **描述：** 用户登录获取访问令牌

**请求体参数：**

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| email | String | 是 | 邮箱地址 |
| password | String | 是 | 密码 |

**请求体示例：**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**成功响应示例：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "userId": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "USER",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "metadata": {
    "lastLogin": "2024-01-01T12:30:00.000Z",
    "tokenExpiresIn": "24h"
  }
}
```

#### 1.3 获取当前用户信息

**请求信息：**
- **方法：** GET
- **路径：** `/api/auth/me`
- **认证：** 需要在请求头中提供 `Authorization: Bearer {token}`
- **描述：** 获取当前已认证用户的详细信息

**成功响应示例：**
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "userId": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "USER",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 论文管理 API

#### 2.1 获取用户所有论文

**请求信息：**
- **方法：** GET
- **路径：** `/api/papers`
- **认证：** 需要在请求头中提供 `Authorization: Bearer {token}`
- **描述：** 获取当前用户的所有论文列表，包含最新进度信息

**响应示例：**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "深度学习在自然语言处理中的应用研究",
      "description": "本研究探讨了深度学习模型在文本分类、情感分析等任务中的应用",
      "deadline": "2024-12-31T23:59:59.000Z",
      "progress": 65,
      "dailyTarget": 2000,
      "createdAt": "2024-01-15T08:00:00.000Z",
      "updatedAt": "2024-01-15T08:00:00.000Z"
    },
    {
      "id": 2,
      "title": "区块链技术在供应链管理中的实践",
      "description": "分析区块链如何提高供应链透明度和效率的案例研究",
      "deadline": "2024-11-15T23:59:59.000Z",
      "progress": 42,
      "dailyTarget": 1500,
      "createdAt": "2024-02-20T14:30:00.000Z",
      "updatedAt": "2024-02-20T14:30:00.000Z"
    },
    {
      "id": 3,
      "title": "可持续发展战略对企业绩效的影响",
      "description": "研究环境、社会和治理(ESG)因素与企业长期盈利能力的关系",
      "deadline": "2024-10-31T23:59:59.000Z",
      "progress": 87,
      "dailyTarget": 1000,
      "createdAt": "2024-01-10T09:15:00.000Z",
      "updatedAt": "2024-01-10T09:15:00.000Z"
    }
  ],
  "message": "获取论文列表成功",
  "metadata": {
    "totalCount": 3,
    "currentPage": 1,
    "timestamp": "2024-05-20T14:30:00.000Z",
    "userId": 1
  }
}
```

#### 2.2 创建新论文

**请求信息：**
- **方法：** POST
- **路径：** `/api/papers`
- **内容类型：** application/json
- **认证：** 需要在请求头中提供 `Authorization: Bearer {token}`
- **描述：** 创建新论文并生成初始进度记录，使用数据库事务确保数据一致性

**请求体参数：**

| 参数名 | 类型 | 必填 | 描述 | 验证规则 |
|--------|------|------|------|----------|
| title | String | 是 | 论文标题 | 长度5-200字符，不能与现有论文重复 |
| description | String | 否 | 论文描述 | 长度不超过1000字符 |
| deadline | String | 是 | 截止日期 | ISO格式(YYYY-MM-DDTHH:MM:SS)，必须是未来日期 |
| progress | Number | 否 | 完成进度 | 0-100之间的整数，默认为0 |
| dailyTarget | Number | 否 | 每日目标字数 | 正整数，不超过10000，未提供时根据截止日期自动计算 |

**请求体示例：**
```json
{
  "title": "人工智能在医疗健康领域的应用研究",
  "description": "本研究探讨了AI技术如何提升医疗诊断准确率和优化健康管理流程",
  "deadline": "2024-12-31T23:59:59",
  "progress": 0,
  "dailyTarget": 1500
}
```

**成功响应示例：**
```json
{
  "success": true,
  "message": "论文创建成功",
  "data": {
    "id": 4,
    "title": "人工智能在医疗健康领域的应用研究",
    "description": "本研究探讨了AI技术如何提升医疗诊断准确率和优化健康管理流程",
    "deadline": "2024-12-31T23:59:59.000Z",
    "progress": 0,
    "dailyTarget": 1500,
    "createdAt": "2024-05-20T14:30:25.876Z",
    "updatedAt": "2024-05-20T14:30:25.876Z"
  },
  "metadata": {
    "createdTime": "2024-05-20T14:30:25.876Z",
    "userId": 1
  }
}
```

**失败响应示例 - 输入验证错误：**
```json
{
  "success": false,
  "message": "输入验证失败",
  "errors": [
    "论文标题长度至少需要5个字符",
    "截止日期必须是未来的日期"
  ]
}
```

**失败响应示例 - JSON格式错误：**
```json
{
  "success": false,
  "message": "请求体格式错误，请提供有效的JSON数据",
  "error": "Invalid JSON format"
}

**失败响应示例 - 服务器错误：**
```json
{
  "success": false,
  "message": "服务器内部错误，创建论文失败",
  "error": "Internal server error"
}

**业务特性：**
- **智能每日目标计算**：如果未指定每日目标，系统会根据剩余天数自动设置合理的目标
  - 7天内截止：每天3000字
  - 30天内截止：每天2000字
  - 90天内截止：每天1500字
  - 90天以上：每天1000字
- **重复标题检测**：系统会检查是否已存在相同标题的论文（不区分大小写）
- **唯一ID生成**：每个新论文都会获得一个唯一的ID
- **数据标准化**：标题和描述会自动去除首尾空格，日期会标准化为ISO格式

#### 2.3 更新论文进度

**请求信息：**
- **方法：** PUT
- **路径：** `/api/papers/:id`
- **内容类型：** application/json
- **认证：** 需要在请求头中提供 `Authorization: Bearer {token}`
- **描述：** 更新论文信息，创建新的进度记录，使用数据库事务确保数据一致性

**路径参数：**
- `id`：论文的唯一标识符（必须是正整数）

**请求体参数：**

| 参数名 | 类型 | 必填 | 描述 | 验证规则 |
|--------|------|------|------|----------|
| progress | Number | 否 | 完成进度 | 0-100之间的整数 |
| dailyTarget | Number | 否 | 每日目标字数 | 1-10000之间的正整数 |
| description | String | 否 | 论文描述 | 长度不超过1000字符 |
| deadline | String | 否 | 截止日期 | ISO格式(YYYY-MM-DDTHH:MM:SS)，必须是未来日期 |
| note | String | 否 | 进度更新备注 | 可选字段，用于记录进度更新说明 |

> 注意：至少需要提供一个参数来更新，否则会返回验证错误

**请求体示例 - 仅更新进度：**
```json
{
  "progress": 75
}
```

**请求体示例 - 更新多个字段：**
```json
{
  "progress": 80,
  "dailyTarget": 1800,
  "description": "更新后的研究描述，包含更多细节",
  "note": "完成了文献综述部分的写作"
}
```

**成功响应示例：**
```json
{
  "success": true,
  "message": "论文进度更新成功",
  "data": {
    "id": 1,
    "title": "深度学习在自然语言处理中的应用研究",
    "description": "更新后的研究描述，包含更多细节",
    "deadline": "2024-12-31T23:59:59.000Z",
    "progress": 80,
    "dailyTarget": 1800,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-05-20T15:45:30.123Z"
  },
  "metadata": {
      "progressChange": 15,
      "progressMessage": "进度提升了15%",
      "updatedTime": "2024-05-20T15:45:30.123Z",
      "userId": 1
    }
}
```

**失败响应示例 - 论文不存在：**
```json
{
  "success": false,
  "message": "论文不存在"
}
```

**失败响应示例 - 验证错误：**
```json
{
  "success": false,
  "message": "输入验证失败",
  "errors": [
    "进度必须是0-100之间的整数"
  ]
}

#### 2.4 删除论文

**请求信息：**
- **方法：** DELETE
- **路径：** `/api/papers/:id`
- **认证：** 需要在请求头中提供 `Authorization: Bearer {token}`
- **描述：** 删除指定论文及其所有关联的进度记录，使用数据库事务确保数据一致性

**路径参数：**
- `id`：论文的唯一标识符（必须是正整数）

**成功响应示例：**
```json
{
  "success": true,
  "message": "论文删除成功",
  "data": {
    "id": 1,
    "title": "深度学习在自然语言处理中的应用研究",
    "description": "本研究探讨了深度学习模型在文本分类、情感分析等任务中的应用",
    "deadline": "2024-12-31T23:59:59.000Z",
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  },
  "metadata": {
    "deletedTime": "2024-05-20T16:20:35.456Z",
    "remainingCount": 2,
    "userId": 1
  }
}
```

**失败响应示例 - 无效ID：**
```json
{
  "success": false,
  "message": "无效的论文ID，请提供正整数ID"
}
```

**失败响应示例 - 论文不存在或无权限：**
```json
{
  "success": false,
  "message": "论文不存在或无权限删除"
}
```

**失败响应示例 - 服务器错误：**
```json
{
  "success": false,
  "message": "服务器内部错误，删除论文失败",
  "error": "Internal server error"
}

#### 2.5 获取单个论文详情

**请求信息：**
- **方法：** GET
- **路径：** `/api/papers/:id`
- **认证：** 需要在请求头中提供 `Authorization: Bearer {token}`
- **描述：** 获取指定论文的详细信息，包含最新进度记录
- **路径参数：**
  - `id`：论文的唯一标识符（必须是正整数）

**成功响应示例：**
```json
{
  "success": true,
  "message": "获取论文详情成功",
  "data": {
    "id": 1,
    "title": "深度学习在自然语言处理中的应用研究",
    "description": "本研究探讨了深度学习模型在文本分类、情感分析等任务中的应用",
    "deadline": "2024-12-31T23:59:59.000Z",
    "progress": 65,
    "dailyTarget": 2000,
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  },
  "metadata": {
    "retrievedTime": "2024-05-20T14:30:00.000Z",
    "userId": 1
  }
}
```

**失败响应示例 - 论文不存在或无权限：**
```json
{
  "success": false,
  "message": "论文不存在或无权限访问",
  "error": "Paper not found or access denied"
}

**失败响应示例 - 无效ID：**
```json
{
  "success": false,
  "message": "无效的论文ID"
}

## 如何启动服务器

### 前提条件

- Node.js 已安装（推荐 v14+）
- npm 或 yarn 已安装

### 安装依赖

```bash
# 安装项目依赖
npm install
```

### 启动服务器

```bash
# 仅启动API服务器
npm run server

# 构建前端并启动完整应用
npm run start
```

### 访问API

服务器启动后，API将在以下地址可用：
- API基础地址：`http://localhost:3001`
- 获取论文列表：`http://localhost:3001/api/papers`

## 项目结构

- `server.js` - Express服务器和API路由定义
- `package.json` - 项目配置和依赖管理
- 前端代码位于`src/`目录（React应用）

## 注意事项

1. 系统已实现JWT认证，所有论文管理API都需要在请求头中提供有效的认证令牌
2. 错误处理已基本实现，但在生产环境中可能需要更详细的错误日志
3. 为避免端口冲突，可以在启动前设置PORT环境变量
4. 生产环境中必须设置复杂的JWT_SECRET密钥

## 数据库设计

系统使用Prisma ORM，包含以下数据表结构：

### Users 表
- `id`: 用户ID（主键，自增整数）
- `username`: 用户名（唯一，非空）
- `email`: 电子邮件（唯一，非空）
- `passwordHash`: 密码哈希（非空，使用bcrypt加密）
- `role`: 用户角色（默认USER，可选值：USER或ADMIN）
- `createdAt`: 创建时间（自动生成）
- `updatedAt`: 更新时间（自动更新）

### Papers 表
- `id`: 论文ID（主键，自增整数）
- `title`: 论文标题（唯一，非空，长度≤200）
- `description`: 论文描述（可选，长度≤1000）
- `deadline`: 截止日期（非空，日期时间类型）
- `userId`: 用户ID（外键，关联Users表）
- `createdAt`: 创建时间（自动生成）
- `updatedAt`: 更新时间（自动更新）

### Progresses 表
- `id`: 进度记录ID（主键，自增整数）
- `paperId`: 论文ID（外键，关联Papers表）
- `progressPercentage`: 进度百分比（0-100整数）
- `dailyTarget`: 每日目标（可选，1-10000整数）
- `note`: 备注（可选）
- `createdAt`: 创建时间（自动生成）

## 系统特性

1. **用户认证**：基于JWT的身份验证系统，支持用户注册和登录
2. **角色管理**：支持USER和ADMIN两种角色，便于权限控制
3. **用户权限验证**：确保用户只能访问和修改自己的论文
4. **进度版本化存储**：每次更新进度都会创建新的记录，保留完整的历史数据
5. **事务处理**：关键操作使用数据库事务确保数据一致性
6. **数据完整性**：通过外键约束保证关系数据的完整性
7. **自动时间戳**：创建和更新操作自动处理时间戳
8. **安全性**：密码使用bcrypt加密存储，JWT令牌认证保护API

## 开发说明

### 扩展API功能

如需添加新的API接口，可以在`server.js`文件中的API路由部分继续添加。例如，实现进度历史查询、用户认证等功能。

### 数据库管理

系统使用PostgreSQL数据库和Prisma ORM。管理数据库的命令：

```bash
# 安装依赖
npm install

# 生成Prisma客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev

# 打开Prisma Studio（可视化数据库管理）
npx prisma studio
```

### 环境配置

项目使用`.env`文件进行环境配置：
- `DATABASE_URL`: PostgreSQL数据库连接字符串
- `PORT`: 服务器端口号（默认3001）
- `NODE_ENV`: 运行环境（development/production）
- `JWT_SECRET`: JWT签名密钥（安全的随机字符串，生产环境必填）
- `JWT_EXPIRES_IN`: JWT令牌过期时间（默认24h）