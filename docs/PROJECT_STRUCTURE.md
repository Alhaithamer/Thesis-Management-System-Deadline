# 论文跟踪系统 - 项目结构

## 概述

本项目已按照标准全栈项目结构重新组织，采用前后端分离架构，便于开发、测试和部署。

## 目录结构

```
Deadline/
├── client/                 # 前端代码目录
│   ├── public/            # 静态文件
│   │   ├── index.html     # 主页面
│   │   └── ...           # 其他静态资源
│   ├── src/              # 源代码目录
│   │   ├── components/   # React组件
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # 自定义Hooks
│   │   ├── utils/        # 工具函数
│   │   ├── styles/       # 样式文件
│   │   └── App.js        # 主应用组件
│   ├── thesis-deadline-tracker.js  # 独立前端脚本
│   ├── package.json      # 前端依赖配置
│   ├── vite.config.js    # Vite构建配置
│   └── dist/             # 构建输出目录
│
├── server/               # 后端代码目录
│   ├── prisma/          # 数据库相关
│   │   ├── schema.prisma # Prisma数据模型
│   │   └── seed.js      # 数据库种子脚本
│   ├── data/            # 数据持久化存储
│   │   ├── users.json   # 用户数据
│   │   └── papers.json  # 论文数据
│   ├── middleware/      # Express中间件
│   ├── routes/          # API路由
│   ├── server.js        # 主服务器文件
│   ├── test-seed.js     # 数据库测试脚本
│   └── package.json     # 后端依赖配置
│
├── docs/                # 文档目录
│   ├── README_PRISMA_SCHEMA.md    # Prisma Schema说明
│   ├── README_SEED_SCRIPT.md      # 种子脚本使用指南
│   ├── README_DEPLOYMENT.md       # 部署指南
│   └── PROJECT_STRUCTURE.md       # 本文档
│
├── tests/               # 测试文件目录
│   ├── test_admin_api.js          # 管理员API测试
│   ├── test_persistence.js        # 数据持久化测试
│   ├── test_progress_update.js    # 进度更新测试
│   ├── test_build.js              # 前端构建测试
│   └── verify_persistence.js      # 持久化验证脚本
│
├── package.json         # 根目录项目配置
├── package-lock.json    # 依赖版本锁定文件
├── .gitignore          # Git忽略文件配置
├── vercel.json         # Vercel部署配置
├── AI_PROMPTS.md       # AI提示词文档
└── README.md           # 项目说明文档
```

## 详细说明

### 前端目录 (/client)

- **public/**: 包含HTML模板和静态资源文件
- **src/**: 源代码目录，包含React组件、页面、Hooks等
- **thesis-deadline-tracker.js**: 独立的前端倒计时脚本
- **package.json**: 前端项目依赖和脚本配置
- **vite.config.js**: Vite构建工具配置
- **dist/**: 生产环境构建输出目录

### 后端目录 (/server)

- **prisma/**: 数据库相关文件
  - **schema.prisma**: Prisma数据模型定义
  - **seed.js**: 数据库种子脚本，生成示例数据
- **data/**: 文件系统数据持久化存储
  - **users.json**: 用户数据存储
  - **papers.json**: 论文数据存储
- **middleware/**: Express中间件（如认证、权限检查等）
- **routes/**: API路由定义
- **server.js**: 主服务器入口文件
- **test-seed.js**: Prisma连接和种子脚本测试工具
- **package.json**: 后端项目依赖和脚本配置

### 文档目录 (/docs)

- **README_PRISMA_SCHEMA.md**: Prisma数据模型详细说明和迁移指南
- **README_SEED_SCRIPT.md**: 种子脚本使用指南和配置说明
- **README_DEPLOYMENT.md**: 部署指南和配置说明
- **PROJECT_STRUCTURE.md**: 项目结构详细说明

### 测试目录 (/tests)

- **test_admin_api.js**: 管理员API端点测试脚本
- **test_persistence.js**: 数据持久化功能测试
- **test_progress_update.js**: 论文进度更新测试
- **test_build.js**: 前端构建流程测试
- **verify_persistence.js**: 数据持久化验证脚本

## 核心功能

### 1. 用户认证系统
- JWT token认证
- 用户注册和登录
- 角色权限管理（管理员/普通用户）

### 2. 论文管理
- 创建、查看、更新、删除论文
- 论文进度跟踪
- 字数统计和目标设定
- 截止日期管理

### 3. 进度跟踪
- 实时进度更新
- 历史进度记录
- 每日目标计算
- 写作时间统计

### 4. 数据持久化
- 文件系统存储（JSON格式）
- 自动备份机制
- 数据完整性保证

## 技术栈

### 前端
- **React**: UI框架
- **Vite**: 构建工具
- **React Router**: 前端路由
- **Axios**: HTTP客户端

### 后端
- **Node.js**: 服务器环境
- **Express.js**: Web框架
- **Prisma**: ORM数据库工具
- **PostgreSQL**: 数据库
- **JWT**: 认证机制
- **bcrypt**: 密码加密

### 开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Jest**: 单元测试

## 开发和部署

### 开发模式

```bash
# 安装所有依赖
npm run install:all

# 启动后端服务器
npm run start:server

# 启动前端开发服务器
npm run start:client

# 运行测试
npm test
```

### 构建生产版本

```bash
# 构建前端
npm run build:client

# 或者直接使用build脚本
npm run build
```

### 数据库操作

```bash
# 进入server目录
cd server

# 生成Prisma客户端
npx prisma generate

# 应用数据库迁移
npx prisma db push

# 运行种子脚本
npx prisma db seed

# 或者直接运行
node prisma/seed.js
```

## 重要文件说明

### 环境配置

1. **server/.env**: 后端环境变量配置
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/thesis_tracker"
   JWT_SECRET="your-jwt-secret"
   PORT=3001
   ```

2. **client/.env**: 前端环境变量配置
   ```
   VITE_API_URL=http://localhost:3001
   ```

### API文档

服务器启动后，可访问以下地址查看API文档：
- 基础信息: http://localhost:3001/api/papers
- 管理员统计: http://localhost:3001/api/admin/stats（需要管理员权限）

## 路径引用说明

项目重组织后，所有路径引用已更新：

1. **客户端API调用**: 指向 `http://localhost:3001`
2. **服务器静态文件**: 指向 `/server/dist/`
3. **测试脚本**: 正确指向各个目录
4. **数据库连接**: 使用环境变量配置

## 注意事项

1. 确保所有环境变量正确配置
2. 数据库服务正常运行
3. 端口3001未被占用
4. 依赖安装完整

## 故障排除

常见问题和解决方案请参考各目录下的README文档。