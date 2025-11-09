// 测试管理员API的脚本
const http = require('http');

function makeHttpRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ response: res, data: parsedData });
        } catch (parseError) {
          reject(new Error('解析响应失败: ' + parseError.message));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

async function testAdminApi() {
  console.log('开始测试管理员API...');
  
  try {
    // 第一步：管理员登录获取令牌
    console.log('\n1. 管理员登录...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const loginRequestBody = {
      email: 'admin@example.com',
      password: 'admin123'
    };
    
    const { response: loginResponse, data: loginData } = await makeHttpRequest(loginOptions, loginRequestBody);
    console.log('登录响应:', JSON.stringify(loginData, null, 2));
    
    if (!(loginResponse.statusCode >= 200 && loginResponse.statusCode < 300) || !loginData.success) {
      throw new Error('管理员登录失败: ' + (loginData.message || '未知错误'));
    }
    
    const token = loginData.data.token;
    console.log('获取到令牌:', token ? '成功' : '失败');
    
    // 第二步：使用获取的令牌访问管理员统计API
    console.log('\n2. 访问管理员统计API...');
    const statsOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/admin/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    const { response: statsResponse, data: statsData } = await makeHttpRequest(statsOptions);
    console.log('统计API响应:', JSON.stringify(statsData, null, 2));
    
    if (!(statsResponse.statusCode >= 200 && statsResponse.statusCode < 300) || !statsData.success) {
      throw new Error('获取统计信息失败: ' + (statsData.message || '未知错误'));
    }
    
    // 显示统计结果
    console.log('\n3. 统计结果摘要:');
    console.log(`- 总用户数: ${statsData.data.users.total}`);
    console.log(`- 普通用户数: ${statsData.data.users.regular}`);
    console.log(`- 管理员用户数: ${statsData.data.users.admin}`);
    console.log(`- 总论文数: ${statsData.data.papers.total}`);
    
    console.log('\n管理员API测试成功！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    // 不输出完整堆栈，保持输出简洁
  }
}

// 运行测试
testAdminApi();