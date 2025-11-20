const https = require('https');
const http = require('http');

// 配置
const BASE_URL = 'http://localhost:3001'; // 指向 /server 目录下的服务器
const USER_ID = 3; // demo用户ID
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInVzZXJuYW1lIjoiZGVtbyIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzYyNjg3MzA5LCJleHAiOjE3NjI3NzM3MDl9.rnrqeD4_SmAmp2-i-Ue2O9XPyYNYerTz5ULPEVhA4SI';

// 辅助函数：发送HTTP请求
async function sendRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = new URL(endpoint, BASE_URL);
  const protocol = url.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsedData });
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      const jsonData = JSON.stringify(data);
      req.setHeader('Content-Length', Buffer.byteLength(jsonData));
      req.write(jsonData);
    }
    
    req.end();
  });
}

// 测试数据持久化功能
async function testPersistence() {
  try {
    console.log('=== 数据持久化测试开始 ===\n');
    
    // 1. 创建一篇新论文
    console.log('步骤1: 创建新论文');
    // 使用时间戳创建唯一标题，避免重复
    const timestamp = Date.now();
    const paperData = {
      title: `持久化测试论文_${timestamp}`,
      description: '这是一篇用于测试数据持久化的论文',
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 一年后
      userId: USER_ID
    };
    
    const createResponse = await sendRequest('/api/papers', 'POST', paperData, USER_TOKEN);
    console.log('创建论文状态码:', createResponse.statusCode);
    console.log('创建论文响应:', JSON.stringify(createResponse.data, null, 2));
    
    if (!createResponse.data.success) {
      console.log('论文创建失败');
      return;
    }
    
    const paperId = createResponse.data.data.id;
    console.log(`论文创建成功，ID: ${paperId}\n`);
    
    // 2. 更新论文进度
    console.log('步骤2: 更新论文进度');
    const progressData = {
      progress: 25,
      completedWords: 2000,
      dailyTarget: 1500,
      note: '持久化测试更新'
    };
    
    const updateResponse = await sendRequest(`/api/papers/${paperId}`, 'PUT', progressData, USER_TOKEN);
    console.log('更新进度状态码:', updateResponse.statusCode);
    console.log('更新进度响应:', JSON.stringify(updateResponse.data, null, 2));
    
    if (!updateResponse.data.success) {
      console.log('进度更新失败');
      return;
    }
    
    console.log('论文进度更新成功\n');
    
    // 3. 获取所有论文列表，验证数据
    console.log('步骤3: 获取论文列表验证数据');
    const listResponse = await sendRequest('/api/papers', 'GET', null, USER_TOKEN);
    console.log('获取论文列表状态码:', listResponse.statusCode);
    console.log(`获取到 ${listResponse.data.data.length} 篇论文`);
    
    // 查找刚刚创建的论文
    const testPaper = listResponse.data.data.find(p => p.id === paperId);
    if (testPaper) {
      console.log('找到测试论文:', JSON.stringify(testPaper, null, 2));
      console.log('进度值:', testPaper.progress);
      console.log('每日目标:', testPaper.dailyTarget);
      console.log('已完成字数:', testPaper.completedWords);
    }
    
    console.log('\n=== 数据持久化测试准备完成 ===');
    console.log('\n请执行以下步骤验证数据持久化:');
    console.log('1. 停止当前的服务器');
    console.log('2. 重新启动服务器');
    console.log('3. 运行: node verify_persistence.js');
    console.log('\n重要: 请确保服务器已成功重启后再运行验证脚本');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
testPersistence();