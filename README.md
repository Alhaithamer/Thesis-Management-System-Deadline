# 论文跟踪系统 (Thesis Tracker)

[![CI Status](https://img.shields.io/badge/CI-Passing-green)](https://github.com/yourusername/deadline/actions) [![Test Coverage](https://img.shields.io/badge/Coverage-75%25-yellow)](https://github.com/yourusername/deadline) [![Deployment Status](https://img.shields.io/badge/Deploy-Live-green)](https://deadline.vercel.app)

这是一个用于跟踪和管理论文写作进度的全栈应用程序。

## 项目结构

```
.
├── server/           # 后端服务
│   ├── prisma/       # Prisma ORM配置
│   ├── server.js     # 主服务器文件
│   └── package.json  # 后端依赖配置
├── client/           # 前端React应用
│   ├── src/          # 源代码
│   ├── public/       # 静态资源
│   ├── package.json  # 前端依赖配置
│   └── vite.config.js # Vite构建配置
├── docs/             # 文档
├── tests/            # 测试文件
├── .gitignore        # Git忽略文件
├── package.json      # 项目根配置
└── README.md         # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 启动开发服务器

#### 启动后端服务
```bash
npm run start:server
```

#### 启动前端开发服务
```bash
npm run start:client
```

### 3. 构建生产版本

```bash
npm run build
```

## 技术栈

### 前端
- React 18
- React Router 6
- Vite
- Tailwind CSS

### 后端
- Node.js
- Express
- JWT 认证
- Prisma ORM
- bcrypt 密码加密

## 部署

项目支持部署到Vercel。在部署前，请确保设置了必要的环境变量。

## 许可证

MIT