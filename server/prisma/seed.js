// 论文跟踪系统数据库种子脚本
// 用于创建示例数据：1个管理员用户、1个普通用户、论文和进度记录

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

/**
 * 密码哈希处理
 * @param {string} password - 明文密码
 * @returns {Promise<string>} - 哈希后的密码
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * 计算两个日期之间的天数差
 * @param {Date} date1 - 第一个日期
 * @param {Date} date2 - 第二个日期
 * @returns {number} - 天数差
 */
function daysBetween(date1, date2) {
  const timeDifference = date2.getTime() - date1.getTime();
  return Math.ceil(timeDifference / (1000 * 3600 * 24));
}

/**
 * 计算默认每日目标
 * @param {Date} deadline - 截止日期
 * @param {number} targetWords - 目标字数
 * @returns {number} - 每日目标字数
 */
function calculateDailyTarget(deadline, targetWords) {
  const now = new Date();
  const remainingDays = daysBetween(now, deadline);
  
  // 如果剩余天数少于1天，设置最小每日目标
  if (remainingDays <= 0) {
    return targetWords || 1000;
  }
  
  const dailyTarget = Math.ceil((targetWords || 5000) / remainingDays);
  return Math.max(dailyTarget, 100); // 最少100字/天
}

/**
 * 创建示例用户数据
 */
async function createUsers() {
  console.log('👥 开始创建用户数据...');

  // 管理员用户
  const adminUser = {
    username: 'admin',
    email: 'admin@thesistracker.com',
    firstName: 'System',
    lastName: 'Administrator',
    role: 'ADMIN',
    passwordHash: await hashPassword('admin123'),
    bio: '系统管理员，负责系统维护和用户管理',
    isActive: true,
    lastLoginAt: new Date()
  };

  // 普通用户
  const regularUser = {
    username: 'student',
    email: 'student@thesistracker.com',
    firstName: 'Zhang',
    lastName: 'San',
    role: 'USER',
    passwordHash: await hashPassword('student123'),
    bio: '硕士研究生，主要研究机器学习领域',
    isActive: true,
    lastLoginAt: new Date()
  };

  try {
    const [admin, user] = await Promise.all([
      prisma.user.create({
        data: adminUser
      }),
      prisma.user.create({
        data: regularUser
      })
    ]);

    console.log(`✅ 管理员用户创建成功: ${admin.username} (${admin.email})`);
    console.log(`✅ 普通用户创建成功: ${user.username} (${user.email})`);
    
    return { admin, user };
  } catch (error) {
    console.error('❌ 创建用户时出错:', error.message);
    throw error;
  }
}

/**
 * 创建示例论文数据
 * @param {Object} users - 用户对象 { admin, user }
 */
async function createPapers(users) {
  console.log('📄 开始创建论文数据...');

  // 获取当前时间
  const now = new Date();
  
  // 为管理员用户创建论文
  const adminPapers = [
    {
      title: '深度学习在自然语言处理中的应用研究',
      description: '本研究探讨深度学习技术在自然语言处理领域的最新进展，包括BERT、GPT等模型的优化与应用。',
      deadline: new Date('2024-12-31'),
      status: 'ACTIVE',
      priority: 'HIGH',
      totalWords: 15000,
      targetWords: 20000,
      userId: users.admin.id,
      startDate: new Date('2024-01-15')
    },
    {
      title: '区块链技术在供应链管理中的安全性分析',
      description: '分析区块链技术在供应链管理中的安全性挑战和解决方案，提出改进建议。',
      deadline: new Date('2024-10-30'),
      status: 'ACTIVE',
      priority: 'MEDIUM',
      totalWords: 8000,
      targetWords: 12000,
      userId: users.admin.id,
      startDate: new Date('2024-03-01')
    }
  ];

  // 为普通用户创建论文
  const userPapers = [
    {
      title: '机器学习算法在医疗诊断中的应用',
      description: '研究机器学习算法在医疗影像诊断中的性能表现，包括准确率和效率评估。',
      deadline: new Date('2024-11-15'),
      status: 'ACTIVE',
      priority: 'HIGH',
      totalWords: 6000,
      targetWords: 15000,
      userId: users.user.id,
      startDate: new Date('2024-02-01')
    }
  ];

  try {
    const allPapers = [...adminPapers, ...userPapers];
    const createdPapers = [];

    for (const paperData of allPapers) {
      const paper = await prisma.paper.create({
        data: paperData
      });
      createdPapers.push(paper);
      console.log(`✅ 论文创建成功: "${paper.title}"`);
    }

    console.log(`📊 总共创建了 ${createdPapers.length} 篇论文`);
    return createdPapers;
  } catch (error) {
    console.error('❌ 创建论文时出错:', error.message);
    throw error;
  }
}

/**
 * 创建示例进度数据
 * @param {Array} papers - 论文数组
 */
async function createProgress(papers) {
  console.log('📈 开始创建进度数据...');

  const progressRecords = [];

  // 为每篇论文创建2-3条进度记录
  for (const paper of papers) {
    const dailyTarget = calculateDailyTarget(paper.deadline, paper.targetWords);
    const now = new Date();
    
    // 创建3条进度记录（间隔约一周）
    const progressData = [
      {
        paperId: paper.id,
        progressPercentage: Math.min(30 + Math.floor(Math.random() * 20), 50),
        completedWords: Math.floor(paper.totalWords * 0.35),
        dailyTarget: dailyTarget,
        note: '完成了文献综述部分，整理了相关理论基础',
        phase: 'RESEARCH',
        timeSpent: 420, // 7小时
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) // 2周前
      },
      {
        paperId: paper.id,
        progressPercentage: Math.min(60 + Math.floor(Math.random() * 20), 80),
        completedWords: Math.floor(paper.totalWords * 0.65),
        dailyTarget: dailyTarget,
        note: '完成了论文大纲和主要章节的撰写',
        phase: 'WRITING',
        timeSpent: 360, // 6小时
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 1周前
      },
      {
        paperId: paper.id,
        progressPercentage: Math.min(85 + Math.floor(Math.random() * 15), 95),
        completedWords: paper.totalWords,
        dailyTarget: dailyTarget,
        note: '论文初稿完成，正在进行最后的修改和完善',
        phase: 'REVISING',
        timeSpent: 480, // 8小时
        date: new Date() // 今天
      }
    ];

    for (const progress of progressData) {
      const createdProgress = await prisma.progress.create({
        data: progress
      });
      progressRecords.push(createdProgress);
      console.log(`✅ 进度记录创建成功: ${paper.title} - ${progress.progressPercentage}%`);
    }
  }

  console.log(`📊 总共创建了 ${progressRecords.length} 条进度记录`);
  return progressRecords;
}

/**
 * 打印数据统计信息
 * @param {Object} stats - 统计数据对象
 */
function printStatistics(stats) {
  console.log('\n🎉 数据库种子数据创建完成！');
  console.log('📊 数据统计:');
  console.log(`   👥 用户: ${stats.users} 个`);
  console.log(`   📄 论文: ${stats.papers} 篇`);
  console.log(`   📈 进度记录: ${stats.progresses} 条`);
  console.log('\n👤 测试账户信息:');
  console.log('   管理员账户:');
  console.log('     用户名: admin');
  console.log('     密码: admin123');
  console.log('     邮箱: admin@thesistracker.com');
  console.log('\n   普通用户账户:');
  console.log('     用户名: student');
  console.log('     密码: student123');
  console.log('     邮箱: student@thesistracker.com');
  console.log('\n💡 提示: 使用这些账户登录系统进行测试');
}

/**
 * 主函数 - 执行数据库种子操作
 */
async function main() {
  console.log('🚀 开始执行数据库种子脚本...\n');

  try {
    // 1. 创建用户
    const users = await createUsers();
    
    // 2. 创建论文
    const papers = await createPapers(users);
    
    // 3. 创建进度记录
    const progress = await createProgress(papers);
    
    // 4. 打印统计信息
    printStatistics({
      users: Object.keys(users).length,
      papers: papers.length,
      progresses: progress.length
    });

  } catch (error) {
    console.error('💥 执行种子脚本时发生错误:', error);
    throw error;
  } finally {
    // 5. 关闭Prisma连接
    await prisma.$disconnect();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 执行主函数
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log('\n✨ 种子脚本执行成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 种子脚本执行失败:', error);
      process.exit(1);
    });
}

// 导出函数供其他模块使用
export {
  main,
  createUsers,
  createPapers,
  createProgress,
  hashPassword,
  calculateDailyTarget
};