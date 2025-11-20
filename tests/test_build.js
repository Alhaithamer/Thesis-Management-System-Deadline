// 构建测试脚本
const { execSync } = require('child_process');

console.log('开始测试前端构建...');

try {
    // 先进入client目录
    process.chdir('./client');
    
    console.log('检查package.json...');
    const fs = require('fs');
    if (!fs.existsSync('./package.json')) {
        console.error('错误: client/package.json 不存在');
        process.exit(1);
    }
    
    console.log('安装依赖...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('执行构建...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('构建测试成功完成！');
    
} catch (error) {
    console.error('构建测试失败:', error.message);
    process.exit(1);
} finally {
    // 回到根目录
    process.chdir('..');
}