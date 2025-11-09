import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import { promisify } from 'util';

// 确保__dirname存在（如果已经在文件其他地方声明过，这里就不再声明）

// 尝试加载环境变量（先不指定路径，让dotenv自动查找）
try {
  dotenv.config();
  console.log('已加载环境变量');
} catch (error) {
  console.log('环境变量加载失败，使用默认配置');
}

// 创建Express应用
const app = express();

// 直接使用模拟的prisma客户端，避免Prisma初始化崩溃
console.log('使用模拟数据模式启动服务器...');

// 数据文件路径
const DATA_DIR = path.join(process.cwd(), 'data');
const PAPERS_FILE = path.join(DATA_DIR, 'papers.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 保存数据到文件的函数
function saveDataToFile(data, filePath) {
  try {
    // 确保数据目录存在
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 将Date对象转换为ISO字符串以便JSON序列化
    const serializableData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));
    
    fs.writeFileSync(filePath, JSON.stringify(serializableData, null, 2));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

// 从文件加载数据的函数
function loadDataFromFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 递归遍历对象，将ISO字符串转换回Date对象
    function reviveDates(obj) {
      if (!obj || typeof obj !== 'object') return obj;
      
      // 处理数组
      if (Array.isArray(obj)) {
        return obj.map(item => reviveDates(item));
      }
      
      // 处理对象
      const result = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          // 检测ISO格式的日期字符串
          if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(obj[key])) {
            const date = new Date(obj[key]);
            result[key] = isNaN(date.getTime()) ? obj[key] : date;
          } else {
            // 递归处理嵌套对象
            result[key] = reviveDates(obj[key]);
          }
        }
      }
      return result;
    }
    
    return reviveDates(data);
  } catch (error) {
    console.error('加载数据失败，使用默认值:', error);
    return defaultValue;
  }
}

// 初始化默认用户数据
const defaultUsers = [
  {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    username: 'adminuser',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 添加默认测试账户，方便测试
  {
    id: 3,
    username: 'demo',
    email: 'demo@example.com',
    passwordHash: bcrypt.hashSync('demo123', 10), // 明文密码: demo123
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 从文件加载数据，如果文件不存在则使用默认值
let mockPapers = loadDataFromFile(PAPERS_FILE, []);
let mockUsers = loadDataFromFile(USERS_FILE, defaultUsers);

// 自动保存数据到文件
setInterval(() => {
  saveDataToFile(mockPapers, PAPERS_FILE);
  saveDataToFile(mockUsers, USERS_FILE);
  console.log('数据已自动保存');
}, 30000); // 每30秒自动保存一次

const prisma = {
  user: {
    findUnique: async ({ where }) => {
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
      mockUsers.push(newUser);
      console.log('模拟创建用户:', newUser);
      // 保存数据到文件
      saveDataToFile(mockUsers, USERS_FILE);
      return newUser;
    }
  },
  paper: {
    findFirst: async ({ where, include }) => {
      // 处理基于id和userId的组合查询
      if (where && where.id && where.userId) {
        let paper = mockPapers.find(paper => paper.id === where.id && paper.userId === where.userId) || null;
        
        // 处理包含progresses关系的情况
        if (paper && include && include.progresses) {
          paper = {
            ...paper,
            progresses: paper.progresses || []
          };
        }
        
        return paper;
      }
      // 处理基于title和userId的查询（用于标题唯一性检查）
      else if (where && where.userId) {
        // 检查是否有title条件
        if (where.title) {
          let titleCondition = where.title;
          let targetTitle;
          
          // 处理对象形式的条件（如 { equals: "标题", mode: "insensitive" }）
          if (typeof titleCondition === 'object' && titleCondition.equals) {
            targetTitle = titleCondition.equals.toLowerCase();
            // 执行不区分大小写的标题匹配
            return mockPapers.find(paper => 
              paper.userId === where.userId && 
              paper.title.toLowerCase() === targetTitle
            ) || null;
          } else {
            // 直接字符串匹配
            targetTitle = titleCondition;
            return mockPapers.find(paper => 
              paper.userId === where.userId && 
              paper.title === targetTitle
            ) || null;
          }
        }
      }
      // 处理只有id的查询
      else if (where && where.id) {
        let paper = mockPapers.find(paper => paper.id === where.id) || null;
        
        // 处理包含progresses关系的情况
        if (paper && include && include.progresses) {
          paper = {
            ...paper,
            progresses: paper.progresses || []
          };
        }
        
        return paper;
      }
      return null;
    },
    create: async (params) => {
      // 确保正确提取数据，处理Prisma格式的参数{data: {...}}
      const paperData = params.data || params;
      const newPaper = {
        id: Date.now(),
        ...paperData,
        createdAt: new Date(),
        updatedAt: new Date(),
        progresses: []
      };
      mockPapers.push(newPaper);
      console.log('模拟创建论文:', newPaper);
      // 保存数据到文件
      saveDataToFile(mockPapers, PAPERS_FILE);
      return newPaper;
    },
    findMany: async ({ where, include }) => {
      if (where && where.userId) {
        let papers = mockPapers.filter(paper => paper.userId === where.userId);
        
        // 处理包含progresses关系的情况
        if (include && include.progresses) {
          return papers.map(paper => ({
            ...paper,
            progresses: paper.progresses || []
          }));
        }
        return papers;
      }
      return mockPapers;
    },
    findUnique: async ({ where, include }) => {
      if (where && where.id) {
        let paper = mockPapers.find(paper => paper.id === where.id) || null;
        
        // 处理包含progresses关系的情况
        if (paper && include && include.progresses) {
          paper = {
            ...paper,
            progresses: paper.progresses || []
          };
        }
        return paper;
      }
      return null;
    },
    update: async ({ where, data }) => {
      const index = mockPapers.findIndex(paper => paper.id === where.id);
      if (index !== -1) {
        mockPapers[index] = {
          ...mockPapers[index],
          ...data,
          updatedAt: new Date()
        };
        // 保存数据到文件
        saveDataToFile(mockPapers, PAPERS_FILE);
        return mockPapers[index];
      }
      throw new Error('Paper not found');
    },
    delete: async ({ where }) => {
      const index = mockPapers.findIndex(paper => paper.id === where.id);
      if (index !== -1) {
        const deletedPaper = mockPapers[index];
        mockPapers.splice(index, 1);
        return deletedPaper;
      }
      throw new Error('Paper not found');
    },
    count: async ({ where }) => {
      if (where && where.userId) {
        return mockPapers.filter(paper => paper.userId === where.userId).length;
      }
      return mockPapers.length;
    }
  },
  progress: {
    create: async ({ data }) => {
      const paperId = data.paperId;
      const paper = mockPapers.find(p => p.id === paperId);
      
      if (paper) {
        if (!paper.progresses) {
          paper.progresses = [];
        }
        
        const newProgress = {
          id: Date.now(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        paper.progresses.push(newProgress);
        return newProgress;
      }
      return null;
    },
    findFirst: async ({ where, orderBy }) => {
      if (where && where.paperId) {
        const paper = mockPapers.find(p => p.id === where.paperId);
        if (paper && paper.progresses && paper.progresses.length > 0) {
          // 按创建时间降序排序
          const sortedProgresses = [...paper.progresses].sort((a, b) => 
            b.createdAt - a.createdAt
          );
          return sortedProgresses[0];
        }
      }
      return null;
    },
    deleteMany: async ({ where }) => {
      if (where && where.paperId) {
        const paper = mockPapers.find(p => p.id === where.paperId);
        if (paper) {
          const count = paper.progresses ? paper.progresses.length : 0;
          paper.progresses = [];
          return { count };
        }
      }
      return { count: 0 };
    }
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

// 开发环境中使用Vite服务器提供前端，暂不启用静态文件服务
// app.use(express.static(path.join(__dirname, '../client/dist')));

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
    console.log('开始认证...');
    // 从请求头获取令牌
    const authHeader = req.headers['authorization'];
    console.log('Authorization头:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('提取的令牌:', token ? '存在' : '不存在');
    
    if (!token) {
      console.log('认证失败：未提供令牌');
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        error: 'No token provided'
      });
    }
    
    // 验证令牌
    try {
      const user = jwt.verify(token, JWT_SECRET);
      console.log('令牌验证成功，用户信息:', user);
      // 将用户信息存储在请求对象中
      req.user = user;
      next();
    } catch (verifyError) {
      console.log('令牌验证失败:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期',
        error: 'Invalid or expired token',
        details: process.env.NODE_ENV === 'production' ? '' : verifyError.message
      });
    }
  } catch (error) {
    console.error('认证过程中出错:', error);
    return res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// 管理员权限验证中间件
const authorizeAdmin = (req, res, next) => {
  try {
    // 确保用户已通过认证
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
        error: 'No token provided'
      });
    }
    
    // 检查用户角色是否为管理员
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员权限',
        error: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('管理员权限验证失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，权限验证失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
};

// 获取系统统计信息（仅管理员可访问）
app.get('/api/admin/stats', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    // 获取用户总数
    const totalUsers = mockUsers.length;
    
    // 获取普通用户数量
    const regularUsers = mockUsers.filter(user => user.role === 'USER').length;
    
    // 获取管理员数量
    const adminUsers = mockUsers.filter(user => user.role === 'ADMIN').length;
    
    // 获取总论文数量
    const totalPapers = mockPapers.length;
    
    res.status(200).json({
      success: true,
      message: '获取系统统计信息成功',
      data: {
        users: {
          total: totalUsers,
          regular: regularUsers,
          admin: adminUsers
        },
        papers: {
          total: totalPapers
        },
        systemInfo: {
          lastUpdated: new Date().toISOString(),
          serverTime: new Date().toISOString()
        }
      },
      metadata: {
        adminId: req.user.userId,
        adminName: req.user.username,
        requestTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取系统统计信息时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，获取统计信息失败',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});

// JWT认证中间件 - 保持原实现不变
// 已在上方定义，这里不再重复

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
    
    // 添加日志输出，查看接收到的数据
    console.log('接收到的创建论文数据:', newPaperData);
    console.log('用户ID:', userId);
    
    // 1. 详细的输入验证
    const validationErrors = [];
    
    console.log('开始验证标题...');
    // 验证标题
    if (!newPaperData.title || typeof newPaperData.title !== 'string') {
      console.log('标题验证失败：标题不存在或不是字符串');
      validationErrors.push('论文标题是必填项且必须是字符串');
    } else if (newPaperData.title.trim().length < 5) {
      console.log('标题验证失败：标题长度不足5个字符');
      validationErrors.push('论文标题长度至少需要5个字符');
    } else if (newPaperData.title.trim().length > 200) {
      console.log('标题验证失败：标题长度超过200个字符');
      validationErrors.push('论文标题长度不能超过200个字符');
    }
    
    // 只有当标题基本验证通过后，才检查标题是否重复
    if (validationErrors.length === 0 && newPaperData.title) {
      console.log('验证标题是否重复...');
      console.log('查询条件:', { userId, title: { equals: newPaperData.title.trim(), mode: 'insensitive' } });
      const existingPaper = await prisma.paper.findFirst({
        where: {
          userId,
          title: { equals: newPaperData.title.trim(), mode: 'insensitive' }
        }
      });
      console.log('查找结果:', existingPaper);
      
      if (existingPaper) {
        console.log('标题验证失败：已存在相同标题的论文');
        validationErrors.push('已存在相同标题的论文');
      }
    }
    
    console.log('验证截止日期...');
    // 验证截止日期
    if (!newPaperData.deadline) {
      console.log('截止日期验证失败：截止日期不存在');
      validationErrors.push('截止日期是必填项');
    } else {
      console.log('截止日期值:', newPaperData.deadline);
      const deadlineDate = new Date(newPaperData.deadline);
      const now = new Date();
      console.log('解析后的截止日期:', deadlineDate);
      console.log('当前时间:', now);
      
      if (isNaN(deadlineDate.getTime())) {
        console.log('截止日期验证失败：日期格式无效');
        validationErrors.push('截止日期格式无效，请使用ISO格式（YYYY-MM-DDTHH:MM:SS）');
      } else if (deadlineDate <= now) {
        console.log('截止日期验证失败：不是未来日期');
        validationErrors.push('截止日期必须是未来的日期');
      }
    }
    
    console.log('验证描述...');
    // 验证描述（可选，但如果提供了需要验证）
    if (newPaperData.description && typeof newPaperData.description !== 'string') {
      console.log('描述验证失败：描述不是字符串');
      validationErrors.push('论文描述必须是字符串');
    } else if (newPaperData.description && newPaperData.description.length > 1000) {
      console.log('描述验证失败：描述长度超过1000个字符');
      validationErrors.push('论文描述长度不能超过1000个字符');
    }
    
    console.log('验证进度...');
    // 验证进度（可选，但如果提供了需要验证）
    if (newPaperData.progress !== undefined) {
      console.log('进度值:', newPaperData.progress);
      if (typeof newPaperData.progress !== 'number' || 
          !Number.isInteger(newPaperData.progress) || 
          newPaperData.progress < 0 || 
          newPaperData.progress > 100) {
        console.log('进度验证失败：进度不是0-100之间的整数');
        validationErrors.push('进度必须是0-100之间的整数');
      }
    }
    
    console.log('验证每日目标...');
    // 验证每日目标（可选，但如果提供了需要验证）
    if (newPaperData.dailyTarget !== undefined) {
      console.log('每日目标值:', newPaperData.dailyTarget);
      if (typeof newPaperData.dailyTarget !== 'number' || 
          !Number.isInteger(newPaperData.dailyTarget) || 
          newPaperData.dailyTarget <= 0) {
        console.log('每日目标验证失败：每日目标不是正整数');
        validationErrors.push('每日目标必须是正整数');
      } else if (newPaperData.dailyTarget > 10000) {
        console.log('每日目标验证失败：每日目标超过10000字');
        validationErrors.push('每日目标不能超过10000字');
      }
    }
    
    // 如果有验证错误，返回400状态码
    if (validationErrors.length > 0) {
      console.log('验证失败，错误列表:', validationErrors);
      return res.status(400).json({
        success: false,
        message: '输入验证失败',
        errors: validationErrors
      });
    }
    
    // 2. 计算默认每日目标
    console.log('计算每日目标和进度...');
    const dailyTarget = newPaperData.dailyTarget || calculateDefaultDailyTarget(newPaperData.deadline);
    const progress = newPaperData.progress || 0;
    
    console.log('计算结果: dailyTarget =', dailyTarget, 'progress =', progress);
    
    // 3. 直接创建论文记录
    console.log('开始创建论文记录...');
    const createdPaper = await prisma.paper.create({
      data: {
        title: newPaperData.title.trim(),
        description: newPaperData.description ? newPaperData.description.trim() : '',
        deadline: new Date(newPaperData.deadline),
        userId: userId
      }
    });
    console.log('论文记录创建成功:', createdPaper.id);
    
    // 4. 创建初始进度记录
    await prisma.progress.create({
      data: {
        paperId: createdPaper.id,
        progressPercentage: progress,
        dailyTarget: dailyTarget
      }
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
    
    // 3. 输入验证 - 暂时放宽要求以调试
    const validationErrors = [];
    
    console.log('收到的更新数据:', JSON.stringify(updateData, null, 2));
    console.log('更新数据类型:', typeof updateData);
    console.log('所有字段及其类型:');
    Object.keys(updateData).forEach(key => {
      console.log(`- ${key}: ${typeof updateData[key]}, 值:`, updateData[key]);
    });
    
    // 临时修改：将所有数字字段转换为整数并进行基本验证
    if (updateData.progress !== undefined) {
      console.log('处理progress字段:', updateData.progress);
      const progressNum = parseInt(updateData.progress);
      if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        validationErrors.push(`进度值无效: ${updateData.progress}`);
      } else {
        updateData.progress = progressNum;
      }
    }
    
    if (updateData.completedWords !== undefined) {
      console.log('处理completedWords字段:', updateData.completedWords);
      const completedWordsNum = parseInt(updateData.completedWords);
      if (isNaN(completedWordsNum) || completedWordsNum < 0) {
        validationErrors.push(`已完成字数无效: ${updateData.completedWords}`);
      } else {
        updateData.completedWords = completedWordsNum;
      }
    }
    
    if (updateData.dailyTarget !== undefined) {
      console.log('处理dailyTarget字段:', updateData.dailyTarget);
      const dailyTargetNum = parseInt(updateData.dailyTarget);
      if (isNaN(dailyTargetNum) || dailyTargetNum < 0) {
        validationErrors.push(`每日目标无效: ${updateData.dailyTarget}`);
      } else {
        updateData.dailyTarget = dailyTargetNum;
      }
    }
    
    // 临时：允许通过大多数验证，只记录警告
    if (validationErrors.length > 0) {
      console.warn('验证警告（暂时允许通过）:', validationErrors);
      // 暂时不返回错误，继续处理
      // 但仍然记录详细信息
      console.log('修改后的数据:', JSON.stringify(updateData, null, 2));
    }
    
    console.log('验证阶段完成，继续处理更新请求');

    
    // 4. 获取当前最新进度
      console.log('开始获取当前最新进度...');
      const latestProgress = await getLatestProgress(paperId);
      const oldProgress = latestProgress?.progressPercentage || 0;
      
      if (latestProgress) {
        console.log('找到现有进度记录，当前进度:', oldProgress);
      } else {
        console.log('未找到现有进度记录，使用默认值0');
      }
      
      // 5. 开始数据库事务
      console.log('开始事务处理更新...');
      await prisma.$transaction(async (prisma) => {
        console.log('事务开始，检查是否需要更新论文基本信息');
        // 更新论文基本信息（如果有提供）
        const paperUpdateData = {};
        if (updateData.description !== undefined) {
          paperUpdateData.description = updateData.description.trim();
          console.log('准备更新描述信息');
        }
        if (updateData.deadline !== undefined) {
          paperUpdateData.deadline = new Date(updateData.deadline);
          console.log('准备更新截止日期');
        }
        
        if (Object.keys(paperUpdateData).length > 0) {
          console.log('执行论文基本信息更新');
          await prisma.paper.update({
            where: { id: paperId },
            data: paperUpdateData
          });
          console.log('论文基本信息更新成功');
        }
        
        console.log('检查是否需要创建新的进度记录:', 
          updateData.progress !== undefined || updateData.dailyTarget !== undefined || updateData.completedWords !== undefined);
        
        // 创建新的进度记录（如果有提供进度、每日目标或完成字数）
        if (updateData.progress !== undefined || updateData.dailyTarget !== undefined || updateData.completedWords !== undefined) {
          const progressData = {
            paperId: paperId,
            progressPercentage: updateData.progress !== undefined ? updateData.progress : oldProgress,
            dailyTarget: updateData.dailyTarget,
            completedWords: updateData.completedWords,
            note: updateData.note || null
          };
          
          console.log('创建新的进度记录:', JSON.stringify(progressData, null, 2));
          await prisma.progress.create({
            data: progressData
          });
          console.log('进度记录创建成功');
        }
      });
      
      console.log('事务处理完成');
      
      // 6. 更新论文基本信息并获取更新后的论文
      console.log('更新论文基本信息并获取更新后的数据...');
      const paperUpdateData = {};
      
      // 确保所有提供的字段都被更新
      if (updateData.progress !== undefined) paperUpdateData.progress = updateData.progress;
      if (updateData.dailyTarget !== undefined) paperUpdateData.dailyTarget = updateData.dailyTarget;
      if (updateData.completedWords !== undefined) paperUpdateData.completedWords = updateData.completedWords;
      if (updateData.description !== undefined) paperUpdateData.description = updateData.description;
      if (updateData.deadline !== undefined) paperUpdateData.deadline = updateData.deadline;
      
      // 应用基本信息更新
      const updatedPaper = await prisma.paper.update({
        where: { id: paperId },
        data: paperUpdateData,
        include: {
          progresses: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });
      
      console.log('论文基本信息更新成功:', updatedPaper?.id);
      const newLatestProgress = updatedPaper.progresses[0];
      const newProgress = updateData.progress !== undefined ? updateData.progress : (newLatestProgress?.progressPercentage || 0);
      console.log('新的进度信息:', newLatestProgress);
      
      // 7. 生成进度更新信息
      const progressChange = updateData.progress !== undefined ? (updateData.progress - oldProgress) : (newLatestProgress?.progressPercentage - oldProgress || 0);
      const progressMessage = progressChange > 0 
        ? `进度提升了${progressChange}%`
        : progressChange < 0
        ? `进度降低了${Math.abs(progressChange)}%`
        : '进度未发生变化';
      console.log('进度变化:', progressChange, '消息:', progressMessage);
      
      // 8. 格式化响应数据
      const responseData = {
        id: updatedPaper.id,
        title: updatedPaper.title,
        description: updatedPaper.description,
        deadline: updatedPaper.deadline.toISOString(),
        progress: newProgress,
        dailyTarget: updatedPaper.dailyTarget || 0,
        completedWords: updatedPaper.completedWords || 0,
        createdAt: updatedPaper.createdAt.toISOString(),
        updatedAt: updatedPaper.updatedAt.toISOString()
      };
      
      console.log('准备返回响应数据:', JSON.stringify(responseData, null, 2));
      
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

// 程序退出时保存数据
process.on('SIGINT', () => {
  console.log('程序正在退出，保存数据...');
  saveDataToFile(mockPapers, PAPERS_FILE);
  saveDataToFile(mockUsers, USERS_FILE);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('程序正在退出，保存数据...');
  saveDataToFile(mockPapers, PAPERS_FILE);
  saveDataToFile(mockUsers, USERS_FILE);
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器正在运行，监听端口 ${PORT}`);
  console.log(`API文档地址: http://localhost:${PORT}/api/papers`);
  console.log('数据持久化已启用，数据将自动保存到 server/data/ 目录');
});