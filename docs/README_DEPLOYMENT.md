# Vercel 部署指南

## 问题分析

在部署到Vercel时遇到了 `sh: line 1: vite: command not found` 和 `Error: Command "npm run build" exited with 127` 错误，这通常是因为：

1. Vercel不知道在哪里查找构建命令
2. 没有正确配置构建上下文和依赖安装
3. 项目结构和Vercel配置不匹配

## 解决方案

我们已经在项目根目录创建了正确的 `vercel.json` 配置文件，解决了这些问题。

## 部署步骤

### 1. 确保项目文件已提交到GitHub

```bash
git add .
git commit -m "修复Vercel部署配置"
git push origin main
```

### 2. 在Vercel上重新部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到您的项目
3. 点击 "Deploy" 按钮重新部署

### 3. 验证部署是否成功

部署完成后，Vercel会提供一个预览URL，您可以通过它访问您的应用。

## 关键配置说明

我们的 `vercel.json` 文件包含以下关键配置：

- 正确指定了构建源文件路径
- 配置了正确的安装和构建命令
- 设置了API路由和静态文件路由
- 配置了环境变量

## 注意事项

1. 确保所有依赖都在 `package.json` 中正确声明
2. 部署前可以使用 `node test_build.js` 脚本测试构建是否正常
3. 如果需要环境变量，请在Vercel项目设置中添加

## 常见问题排查

- **依赖安装失败**：确保 `package.json` 中的依赖版本兼容
- **构建命令错误**：检查 `buildCommand` 配置是否正确
- **路由问题**：确保 `routes` 配置正确映射API和静态文件