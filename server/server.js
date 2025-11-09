import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// 加载环境变量（尝试从上级目录加载.env文件）
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// 创建Express应用
const app = express();

// 直接使用模拟的prisma客户端，避免Prisma初始化崩溃
console.log('使用模拟数据模式启动服务器...');
const prisma = {
  user: {
    findUnique: async ({ where }) => {
      // 模拟用户数据库
      const mockUsers = [
        {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          role: 'USER',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          username: 'adminuser',
          email: 'admin@example.com',
          passwordHash: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      if (where.email) {
        return mockUsers.find(user => user.email === where.email) || null;
      }
      if (where.id) {
        return mockUsers.find(user => user.id === where.id) || null;
      }
      if (where.username) {
        return mockUsers.find(user => user.username === where.username) || null;
      }
      return null;
    },
    create: async ({ data }) => {
      // 模拟创建用户
      const newUser = {
        id: Date.now(),
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('模拟创建用户:', newUser);
      return newUser;
    }
  },
  paper: {
    findMany: async () => [],
    create: async () => null,
    findUnique: async () => null,
    update: async () => null,
    delete: async () => null,
  },
  progress: {
    create: async () => null,
    findFirst: async () => null,
    deleteMany: async () => null,
  },
  $transaction: async (callback) => {
    return callback(prisma);
  }
};

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// 密码加密强度
const SALT_ROUNDS = 10;

const PORT = process.env.PORT || 3001;

// 获取__dirname (ES模块中需要这样做)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于前端React应用）
app.use(express.static(path.join(__dirname, '../client/dist')));

// 辅助函数：从Progress记录中获取最新进度
const getLatestProgress = async (paperId) => {
  const latestProgress = await prisma.progress.findFirst({
    where: { paperId },
    orderBy: { createdAt: 'desc' }
  });
  return latestProgress;
};

// 辅助函数：计算默认每日目标
const calculateDefaultDailyTarget = (deadline) => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 7) {
    return 3000;
  } else if (daysLeft <= 30) {
    return 2000;
  } else if (daysLeft <= 90) {
    return 1500;
  } else {
    return 1000;
  }
};

// 密码加密函数
const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

// 密码验证函数
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// 生成JWT令牌函数
const generateToken = (userId, username, role) => {
  return jwt.sign(
    { userId, username, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  try {
    // 从请求头获取令牌
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        error: 'No token provided'
      });
    }
    
    // 验证令牌
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: '认证令牌无效或已过期',
          error: 'Invalid or expired token'
        });
      }
      
      // 将用户信息存储在请求对象中
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('认证过程中出错:', error);
    return res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// 用户注册接口
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // 输入验证
    const validationErrors = [];
    
    if (!username || typeof username !== 'string') {
      validationErrors.push('用户名是必填项且必须是字符串');
    } else if (username.trim().length < 3) {
      validationErrors.push('用户名长度至少需要3个字符');
    } else if (username.trim().length > 50) {
      validationErrors.push('用户名长度不能超过50个字符');
    }
    
    if (!email || typeof email !== 'string') {
      validationErrors.push('邮箱是必填项且必须是字符串');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('邮箱格式无效');
    }
    
    if (!password || typeof password !== 'string') {
      validationErrors.push('密码是必填项且必须是字符串');
    } else if (password.length < 6) {
      validationErrors.push('密码长度至少需要6个字符');
    }
    
    if (role && !['USER', 'ADMIN'].includes(role)) {
      validationErrors.push('角色只能是USER或ADMIN');
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: validationErrors
      });
    }
    
    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.trim() }
    });
    
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在',
        error: 'Username already exists'
      });
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim() }
    });
    
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册',
        error: 'Email already registered'
      });
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password);
    
    // 创建用户
    const newUser = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim(),
        passwordHash: hashedPassword,
        role: role || 'USER'
      }
    });
    
    // 生成JWT令牌
    const token = generateToken(newUser.id, newUser.username, newUser.role);
    
    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        token: token
      },
      metadata: {
        registeredAt: newUser.createdAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('用户注册时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，用户注册失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// 用户登录接口
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 输入验证
    const validationErrors = [];
    
    if (!email || typeof email !== 'string') {
      validationErrors.push('邮箱是必填项且必须是字符串');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.push('邮箱格式无效');
    }
    
    if (!password || typeof password !== 'string') {
      validationErrors.push('密码是必填项且必须是字符串');
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: validationErrors
      });
    }
    
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: email.trim() }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        error: 'Invalid credentials'
      });
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误',
        error: 'Invalid credentials'
      });
    }
    
    // 生成JWT令牌
    const token = generateToken(user.id, user.username, user.role);
    
    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: token
      },
      metadata: {
        lastLogin: new Date().toISOString(),
        tokenExpiresIn: JWT_EXPIRES_IN
      }
    });
    
  } catch (error) {
    console.error('用户登录时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，登录失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// 获取当前用户信息接口
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: '获取用户信息成功',
      data: {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('获取用户信息时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取用户信息失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// API路由
// 获取用户所有论文
app.get('/api/papers', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const papers = await prisma.paper.findMany({
      where: { userId },
      include: {
        progresses: {
          orderBy: { createdAt: 'desc' },
          take: 1 // 只获取最新的进度记录
        }
      }
    });
    
    // 转换数据格式，将最新进度信息合并到论文数据中
    const formattedPapers = await Promise.all(papers.map(async (paper) => {
      const latestProgress = paper.progresses[0];
      return {
        id: paper.id,
        title: paper.title,
        description: paper.description,
        deadline: paper.deadline.toISOString(),
        progress: latestProgress?.progressPercentage || 0,
        dailyTarget: latestProgress?.dailyTarget || 0,
        createdAt: paper.createdAt.toISOString(),
        updatedAt: paper.updatedAt.toISOString()
      };
    }));
    
    res.status(200).json({
      success: true,
      data: formattedPapers,
      message: '获取论文列表成功',
      metadata: {
        total: formattedPapers.length,
        userId: userId
      }
    });
  } catch (error) {
    console.error('获取论文列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取论文列表失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// 创建新论文
app.post('/api/papers', authenticateToken, async (req, res) => {
  try {
    const newPaperData = req.body;
    const { userId } = req.user;
    
    // 1. 详细的输入验证
    const validationErrors = [];
    
    // 验证标题
    if (!newPaperData.title || typeof newPaperData.title !== 'string') {
      validationErrors.push('论文标题是必填项且必须是字符串');
    } else if (newPaperData.title.trim().length < 5) {
      validationErrors.push('论文标题长度至少需要5个字符');
    } else if (newPaperData.title.trim().length > 200) {
      validationErrors.push('论文标题长度不能超过200个字符');
    }
    
    // 验证标题是否重复（在数据库中检查）
    const existingPaper = await prisma.paper.findFirst({
      where: {
        userId,
        title: { equals: newPaperData.title.trim(), mode: 'insensitive' }
      }
    });
    
    if (existingPaper) {
      validationErrors.push('已存在相同标题的论文');
    }
    
    // 验证截止日期
    if (!newPaperData.deadline) {
      validationErrors.push('截止日期是必填项');
    } else {
      const deadlineDate = new Date(newPaperData.deadline);
      const now = new Date();
      
      if (isNaN(deadlineDate.getTime())) {
        validationErrors.push('截止日期格式无效，请使用ISO格式（YYYY-MM-DDTHH:MM:SS）');
      } else if (deadlineDate <= now) {
        validationErrors.push('截止日期必须是未来的日期');
      }
    }
    
    // 验证描述（可选，但如果提供了需要验证）
    if (newPaperData.description && typeof newPaperData.description !== 'string') {
      validationErrors.push('论文描述必须是字符串');
    } else if (newPaperData.description && newPaperData.description.length > 1000) {
      validationErrors.push('论文描述长度不能超过1000个字符');
    }
    
    // 验证进度（可选，但如果提供了需要验证）
    if (newPaperData.progress !== undefined) {
      if (typeof newPaperData.progress !== 'number' || 
          !Number.isInteger(newPaperData.progress) || 
          newPaperData.progress < 0 || 
          newPaperData.progress > 100) {
        validationErrors.push('进度必须是0-100之间的整数');
      }
    }
    
    // 验证每日目标（可选，但如果提供了需要验证）
    if (newPaperData.dailyTarget !== undefined) {
      if (typeof newPaperData.dailyTarget !== 'number' || 
          !Number.isInteger(newPaperData.dailyTarget) || 
          newPaperData.dailyTarget <= 0) {
        validationErrors.push('每日目标必须是正整数');
      } else if (newPaperData.dailyTarget > 10000) {
        validationErrors.push('每日目标不能超过10000字');
      }
    }
    
    // 如果有验证错误，返回400状态码
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: validationErrors
      });
    }
    
    // 2. 计算默认每日目标
    const dailyTarget = newPaperData.dailyTarget || calculateDefaultDailyTarget(newPaperData.deadline);
    const progress = newPaperData.progress || 0;
    
    // 3. 开始数据库事务
    const createdPaper = await prisma.$transaction(async (prisma) => {
      // 创建论文记录
      const paper = await prisma.paper.create({
        data: {
          title: newPaperData.title.trim(),
          description: newPaperData.description ? newPaperData.description.trim() : '',
          deadline: new Date(newPaperData.deadline),
          userId: userId
        }
      });
      
      // 创建初始进度记录
      await prisma.progress.create({
        data: {
          paperId: paper.id,
          progressPercentage: progress,
          dailyTarget: dailyTarget
        }
      });
      
      return paper;
    });
    
    // 4. 获取完整的论文信息（包含进度）
    const latestProgress = await getLatestProgress(createdPaper.id);
    
    const responseData = {
      id: createdPaper.id,
      title: createdPaper.title,
      description: createdPaper.description,
      deadline: createdPaper.deadline.toISOString(),
      progress: latestProgress?.progressPercentage || 0,
      dailyTarget: latestProgress?.dailyTarget || 0,
      createdAt: createdPaper.createdAt.toISOString(),
      updatedAt: createdPaper.updatedAt.toISOString()
    };
    
    // 5. 获取总论文数
    const totalPapers = await prisma.paper.count({ where: { userId } });
    
    // 6. 返回成功响应
    res.status(201).json({
      success: true,
      message: '论文创建成功',
      data: responseData,
      metadata: {
        totalPapers: totalPapers,
        createdTime: responseData.createdAt,
        userId: userId
      }
    });
    
  } catch (error) {
    // 7. 错误处理
    console.error('创建论文时出错:', error);
    
    // 区分错误类型
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      // JSON解析错误
      return res.status(400).json({
        success: false,
        message: '请求体格式错误，请提供有效的JSON数据',
        error: 'Invalid JSON format'
      });
    }
    
    // 其他服务器错误
    res.status(500).json({
      success: false,
      message: '服务器内部错误，创建论文失败',
      error: process.env.NODE_ENV === 'production' ? 
        'Internal server error' : error.message
    });
  }
});

// 获取单个论文详情
app.get('/api/papers/:id', authenticateToken, async (req, res) => {
  try {
    const paperId = parseInt(req.params.id);
    const { userId } = req.user;
    
    // 验证ID格式
    if (isNaN(paperId) || paperId <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的论文ID'
      });
    }
    
    // 查询论文信息（包含最新进度）
    const paper = await prisma.paper.findFirst({
      where: {
        id: paperId,
        userId: userId // 确保只能访问自己的论文
      },
      include: {
        progresses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '论文不存在或无权限访问'
      });
    }
    
    // 格式化响应数据
    const latestProgress = paper.progresses[0];
    const responseData = {
      id: paper.id,
      title: paper.title,
      description: paper.description,
      deadline: paper.deadline.toISOString(),
      progress: latestProgress?.progressPercentage || 0,
      dailyTarget: latestProgress?.dailyTarget || 0,
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: responseData,
      message: '获取论文详情成功',
      metadata: {
        userId: userId,
        lastProgressUpdated: latestProgress?.createdAt?.toISOString() || null
      }
    });
  } catch (error) {
    console.error('获取论文详情时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取论文详情失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// 更新论文进度
app.put('/api/papers/:id', authenticateToken, async (req, res) => {
  try {
    // 1. 验证和解析路径参数
    const paperId = parseInt(req.params.id);
    const { userId } = req.user;
    
    if (isNaN(paperId) || paperId <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的论文ID'
      });
    }
    
    // 2. 查找论文并验证权限
    const paper = await prisma.paper.findFirst({
      where: {
        id: paperId,
        userId: userId // 确保只能更新自己的论文
      }
    });
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '论文不存在或无权限访问'
      });
    }
    
    const updateData = req.body;
    
    // 3. 输入验证
    const validationErrors = [];
    
    // 验证进度字段
    if (updateData.progress !== undefined) {
      if (typeof updateData.progress !== 'number' || 
          !Number.isInteger(updateData.progress) || 
          updateData.progress < 0 || 
          updateData.progress > 100) {
        validationErrors.push('进度必须是0-100之间的整数');
      }
    }
    
    // 验证其他可选字段
    if (updateData.dailyTarget !== undefined) {
      if (typeof updateData.dailyTarget !== 'number' || 
          !Number.isInteger(updateData.dailyTarget) || 
          updateData.dailyTarget <= 0 || 
          updateData.dailyTarget > 10000) {
        validationErrors.push('每日目标必须是1-10000之间的正整数');
      }
    }
    
    if (updateData.description !== undefined) {
      if (typeof updateData.description !== 'string') {
        validationErrors.push('描述必须是字符串');
      } else if (updateData.description.length > 1000) {
        validationErrors.push('描述长度不能超过1000个字符');
      }
    }
    
    if (updateData.deadline !== undefined) {
      const deadlineDate = new Date(updateData.deadline);
      const now = new Date();
      
      if (isNaN(deadlineDate.getTime())) {
        validationErrors.push('截止日期格式无效，请使用ISO格式');
      } else if (deadlineDate <= now) {
        validationErrors.push('截止日期必须是未来的日期');
      }
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: validationErrors
      });
    }
    
    // 4. 获取当前最新进度
    const latestProgress = await getLatestProgress(paperId);
    const oldProgress = latestProgress?.progressPercentage || 0;
    
    // 5. 开始数据库事务
    await prisma.$transaction(async (prisma) => {
      // 更新论文基本信息（如果有提供）
      const paperUpdateData = {};
      if (updateData.description !== undefined) {
        paperUpdateData.description = updateData.description.trim();
      }
      if (updateData.deadline !== undefined) {
        paperUpdateData.deadline = new Date(updateData.deadline);
      }
      
      if (Object.keys(paperUpdateData).length > 0) {
        await prisma.paper.update({
          where: { id: paperId },
          data: paperUpdateData
        });
      }
      
      // 创建新的进度记录（如果有提供进度或每日目标）
      if (updateData.progress !== undefined || updateData.dailyTarget !== undefined) {
        await prisma.progress.create({
          data: {
            paperId: paperId,
            progressPercentage: updateData.progress !== undefined ? updateData.progress : oldProgress,
            dailyTarget: updateData.dailyTarget,
            note: updateData.note || null
          }
        });
      }
    });
    
    // 6. 获取更新后的论文信息
    const updatedPaper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        progresses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    const newLatestProgress = updatedPaper.progresses[0];
    const newProgress = newLatestProgress?.progressPercentage || 0;
    
    // 7. 生成进度更新信息
    const progressChange = newProgress - oldProgress;
    const progressMessage = progressChange > 0 
      ? `进度提升了${progressChange}%`
      : progressChange < 0
      ? `进度降低了${Math.abs(progressChange)}%`
      : '进度未发生变化';
    
    // 8. 格式化响应数据
    const responseData = {
      id: updatedPaper.id,
      title: updatedPaper.title,
      description: updatedPaper.description,
      deadline: updatedPaper.deadline.toISOString(),
      progress: newProgress,
      dailyTarget: newLatestProgress?.dailyTarget || 0,
      createdAt: updatedPaper.createdAt.toISOString(),
      updatedAt: updatedPaper.updatedAt.toISOString()
    };
    
    // 9. 返回成功响应
    res.status(200).json({
      success: true,
      message: '论文进度更新成功',
      data: responseData,
      metadata: {
        progressChange: progressChange,
        progressMessage: progressMessage,
        updatedTime: updatedPaper.updatedAt.toISOString(),
        userId: userId
      }
    });
    
  } catch (error) {
    // 10. 错误处理
    console.error('更新论文进度时出错:', error);
    
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      return res.status(400).json({
        success: false,
        message: '请求体格式错误，请提供有效的JSON数据',
        error: 'Invalid JSON format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误，更新论文进度失败',
      error: process.env.NODE_ENV === 'production' ? 
        'Internal server error' : error.message
    });
  }
});

// 删除论文
app.delete('/api/papers/:id', authenticateToken, async (req, res) => {
  try {
    // 1. 验证和解析路径参数
    const paperId = parseInt(req.params.id);
    const { userId } = req.user;
    
    if (isNaN(paperId) || paperId <= 0) {
      return res.status(400).json({
        success: false,
        message: '无效的论文ID'
      });
    }
    
    // 2. 查找论文并验证权限
    const paper = await prisma.paper.findFirst({
      where: {
        id: paperId,
        userId: userId // 确保只能删除自己的论文
      }
    });
    
    if (!paper) {
      return res.status(404).json({
        success: false,
        message: '论文不存在或无权限删除'
      });
    }
    
    // 3. 获取论文信息用于响应
    const deletedPaper = {
      id: paper.id,
      title: paper.title,
      description: paper.description,
      deadline: paper.deadline.toISOString(),
      createdAt: paper.createdAt.toISOString(),
      updatedAt: paper.updatedAt.toISOString()
    };
    
    // 4. 开始数据库事务，级联删除论文及其所有进度记录
    await prisma.$transaction(async (prisma) => {
      // 先删除所有关联的进度记录
      await prisma.progress.deleteMany({
        where: {
          paperId: paperId
        }
      });
      
      // 然后删除论文本身
      await prisma.paper.delete({
        where: {
          id: paperId
        }
      });
    });
    
    // 5. 获取剩余论文数量
    const remainingCount = await prisma.paper.count({
      where: {
        userId: userId
      }
    });
    
    // 6. 返回成功响应
    res.status(200).json({
      success: true,
      message: '论文删除成功',
      data: deletedPaper,
      metadata: {
        deletedTime: new Date().toISOString(),
        remainingCount: remainingCount,
        userId: userId
      }
    });
    
  } catch (error) {
    // 7. 错误处理
    console.error('删除论文时出错:', error);
    
    if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
      return res.status(400).json({
        success: false,
        message: '请求体格式错误，请提供有效的JSON数据',
        error: 'Invalid JSON format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器内部错误，删除论文失败',
      error: process.env.NODE_ENV === 'production' ? 
        'Internal server error' : error.message
    });
  }
});


// 前端路由处理（用于SPA应用）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器正在运行，监听端口 ${PORT}`);
  console.log(`API文档地址: http://localhost:${PORT}/api/papers`);
});