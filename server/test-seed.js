// 测试数据库连接和种子脚本
// 用于验证Prisma配置和种子脚本的正确性

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('🔍 测试数据库连接...');
  
  try {
    // 测试数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
    
    // 测试基本查询
    const userCount = await prisma.user.count();
    console.log(`📊 当前用户数量: ${userCount}`);
    
    const paperCount = await prisma.paper.count();
    console.log(`📄 当前论文数量: ${paperCount}`);
    
    const progressCount = await prisma.progress.count();
    console.log(`📈 当前进度记录数量: ${progressCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function testSeedScript() {
  console.log('\n🧪 测试种子脚本...');
  
  try {
    // 动态导入种子脚本
    const { main } = await import('./prisma/seed.js');
    
    console.log('🚀 开始执行种子脚本...');
    await main();
    
    console.log('✅ 种子脚本执行完成');
    return true;
  } catch (error) {
    console.error('❌ 种子脚本执行失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Prisma种子脚本测试工具\n');
  
  // 测试数据库连接
  const connectionOk = await testDatabaseConnection();
  
  if (!connectionOk) {
    console.log('\n💡 请检查以下配置:');
    console.log('1. 确保已安装依赖: npm install');
    console.log('2. 确保环境变量正确: DATABASE_URL');
    console.log('3. 确保数据库服务正在运行');
    console.log('4. 确保已运行数据库迁移: npx prisma db push');
    return;
  }
  
  // 询问是否执行种子脚本
  console.log('\n🤔 是否执行种子脚本？ (y/n)');
  console.log('注意: 这将创建示例数据到数据库中');
  
  // 自动执行测试（在生产环境中应该询问用户）
  const shouldRunSeed = true;
  
  if (shouldRunSeed) {
    const seedOk = await testSeedScript();
    
    if (seedOk) {
      console.log('\n🎉 所有测试通过！');
      console.log('\n📋 接下来可以:');
      console.log('1. 启动服务器: npm start');
      console.log('2. 打开客户端: cd ../client && npm run dev');
      console.log('3. 使用测试账户登录系统');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 测试失败:', error);
      process.exit(1);
    });
}

export { testDatabaseConnection, testSeedScript };