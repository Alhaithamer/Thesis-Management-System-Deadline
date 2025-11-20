# Prisma Schema 迁移指南

## 概述
本文档描述了如何将新的Prisma Schema应用到你的论文跟踪系统数据库。

## 新Schema特性

### 1. 扩展的User模型
- ✅ 基础认证信息（用户名、邮箱、密码哈希）
- ✅ 个人资料字段（姓名、头像、个人简介）
- ✅ 角色和状态管理（USER、ADMIN、SUPERADMIN）
- ✅ 登录记录跟踪

### 2. 完整的Paper模型  
- ✅ 论文基本信息（标题、描述、截止日期）
- ✅ 状态管理（ACTIVE、COMPLETED、PAUSED、CANCELLED、DRAFT）
- ✅ 优先级设置（LOW、MEDIUM、HIGH、URGENT）
- ✅ 字数统计和目标管理
- ✅ 论文阶段跟踪

### 3. 详细的Progress模型
- ✅ 进度百分比和完成字数跟踪
- ✅ 每日目标设置
- ✅ 写作阶段管理
- ✅ 时间记录和里程碑描述

### 4. 优化的数据库设计
- ✅ 级联删除策略
- ✅ 复合索引优化
- ✅ 数据类型优化

## 迁移步骤

### 步骤1：生成新的Prisma Client
```bash
cd server
npx prisma generate
```

### 步骤2：应用数据库迁移
如果你是第一次设置数据库：
```bash
npx prisma db push
```

如果需要迁移现有数据：
```bash
# 创建迁移文件
npx prisma migrate dev --name init

# 应用迁移
npx prisma migrate deploy
```

### 步骤3：验证迁移结果
```bash
# 查看数据库表结构
npx prisma studio
```

## 数据库关系图

```
User (1) -----> (N) Paper (1) -----> (N) Progress
  │                      │                      │
  ├── papers             ├── progresses          └── paperId
  └── id                 └── userId               └── date
```

## API更新建议

由于Schema增加了新字段，建议你更新API响应以包含这些新信息：

### 更新GET /api/papers响应示例：
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "论文标题",
      "description": "论文描述",
      "deadline": "2024-12-31T00:00:00.000Z",
      "startDate": "2024-01-01T00:00:00.000Z",
      "status": "ACTIVE",
      "priority": "HIGH",
      "totalWords": 5000,
      "targetWords": 10000,
      "progress": 50,
      "dailyTarget": 500,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-06-01T00:00:00.000Z"
    }
  ]
}
```

## 环境变量配置

确保你的 `.env` 文件包含正确的数据库连接字符串：

```env
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/thesis_tracker"

# 或者 MySQL
DATABASE_URL="mysql://username:password@localhost:3306/thesis_tracker"

# 或者 SQLite
DATABASE_URL="file:./dev.db"
```

## 常见问题解决

### 问题1：迁移失败
如果遇到迁移错误：
```bash
# 重置数据库（注意：这会删除所有数据）
npx prisma migrate reset

# 或者只创建新的迁移
npx prisma migrate dev --create-only
```

### 问题2：Prisma Client版本不匹配
```bash
# 重新生成Prisma Client
npx prisma generate

# 清理并重新安装依赖
rm -rf node_modules
npm install
```

### 问题3：外键约束错误
确保在创建数据时遵循正确的顺序：
1. 先创建User
2. 再创建Paper（使用已存在的User ID）
3. 最后创建Progress（使用已存在的Paper ID）

## 测试建议

迁移完成后，建议运行以下测试：

```javascript
// 测试用户创建
const newUser = await prisma.user.create({
  data: {
    username: "testuser",
    email: "test@example.com",
    passwordHash: "hashed_password"
  }
});

// 测试论文创建
const newPaper = await prisma.paper.create({
  data: {
    title: "测试论文",
    description: "这是一篇测试论文",
    deadline: new Date("2024-12-31"),
    userId: newUser.id
  }
});

// 测试进度创建
const newProgress = await prisma.progress.create({
  data: {
    paperId: newPaper.id,
    progressPercentage: 25,
    completedWords: 1000,
    note: "完成了第一章"
  }
});
```

## 下一步

迁移完成后，你可以：
1. 更新前端界面以利用新的字段
2. 改进API以提供更丰富的数据
3. 添加数据验证和约束
4. 优化查询性能

如有问题，请参考 [Prisma官方文档](https://www.prisma.io/docs)。