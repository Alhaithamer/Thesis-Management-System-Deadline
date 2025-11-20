const http = require('http');

// 先创建一个论文，然后更新它
async function testCreateAndUpdatePaper() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJuYW1lIjoiZGVtbyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzYyNjg3MzA5LCJleHAiOjE3NjI3NzM3MDl9.rnrqeD4_SmAmp2-i-Ue2O9XPyYNYerTz5ULPEVhA4SI';
  const userId = 3;
  
  // 步骤1: 创建论文
  console.log('=== 步骤1: 创建论文 ===');
  const newPaper = await createPaper(token, userId);
  
  if (newPaper) {
    // 步骤2: 更新论文进度
    console.log('\n=== 步骤2: 更新论文进度 ===');
    await updatePaperProgress(token, newPaper.id);
  }
}

// 创建论文的函数
function createPaper(token, userId) {
  return new Promise((resolve, reject) => {
    // 使用未来的日期作为截止日期（2025年底）
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1, 11, 31); // 设置为明年12月31日
    const formattedDeadline = futureDate.toISOString().slice(0, 19); // 格式化为YYYY-MM-DDTHH:MM:SS
    
    const paperData = {
      title: '测试论文标题',
      description: '这是一篇用于测试的论文',
      deadline: formattedDeadline,
      progress: 0,
      dailyTarget: 1000,
      userId: userId
    };
    
    const data = JSON.stringify(paperData);
    console.log('创建论文数据:', JSON.stringify(paperData, null, 2));
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/papers',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`创建论文响应状态码: ${res.statusCode}`);
        console.log('创建论文响应原始数据:', responseData);
        
        try {
          const parsedData = JSON.parse(responseData);
          console.log('创建论文解析后的响应:', JSON.stringify(parsedData, null, 2));
          
          if (parsedData.success && parsedData.data) {
            console.log(`✅ 论文创建成功，ID: ${parsedData.data.id}`);
            resolve(parsedData.data);
          } else {
            console.log(`❌ 论文创建失败: ${parsedData.message || '未知错误'}`);
            resolve(null);
          }
        } catch (e) {
          console.log('无法解析创建论文的响应:', e.message);
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`创建论文请求错误: ${e.message}`);
      resolve(null);
    });
    
    req.write(data);
    req.end();
  });
}

// 更新论文进度的函数
function updatePaperProgress(token, paperId) {
  return new Promise((resolve, reject) => {
    const updateData = {
      progress: 10,
      completedWords: 1500,
      dailyTarget: 1200,
      note: "test"
    };
    
    const data = JSON.stringify(updateData);
    console.log(`目标论文ID: ${paperId}`);
    console.log('更新数据:', JSON.stringify(updateData, null, 2));
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/papers/${paperId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n更新进度响应状态码: ${res.statusCode}`);
        console.log('更新进度响应原始数据:', responseData);
        
        try {
          const parsedData = JSON.parse(responseData);
          console.log('更新进度解析后的响应:', JSON.stringify(parsedData, null, 2));
          
          if (parsedData.success) {
            console.log('✅ 论文进度更新成功！');
          } else {
            console.log(`❌ 论文进度更新失败: ${parsedData.message || '未知错误'}`);
          }
          
          resolve();
        } catch (e) {
          console.log('无法解析更新进度的响应:', e.message);
          resolve();
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`更新进度请求错误: ${e.message}`);
      resolve();
    });
    
    req.write(data);
    req.end();
  });
}

// 执行测试
testCreateAndUpdatePaper();