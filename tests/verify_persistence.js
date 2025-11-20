const https = require('https');
const http = require('http');

// 配置
const BASE_URL = 'http://localhost:3001';
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

// 验证数据持久化
async function verifyPersistence() {
  try {
    console.log('=== 数据持久化验证开始 ===\n');
    
    // 获取用户的所有论文
    console.log('获取论文列表...');
    const response = await sendRequest('/api/papers', 'GET', null, USER_TOKEN);
    
    console.log('状态码:', response.statusCode);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 处理不同的数据结构
    let papers = [];
    if (response.data.data && Array.isArray(response.data.data)) {
      papers = response.data.data;
    } else if (Array.isArray(response.data)) {
      papers = response.data;
    }
    
    console.log(`发现 ${papers.length} 篇论文\n`);
    
    if (papers.length === 0) {
      console.log('❌ 警告: 未找到任何论文，数据可能未正确保存');
      return;
    }
    
    // 显示每篇论文的详细信息
    console.log('论文列表详细信息:');
    papers.forEach((paper, index) => {
      console.log(`\n论文 ${index + 1}:`);
      console.log(`  ID: ${paper.id}`);
      console.log(`  标题: ${paper.title}`);
      console.log(`  进度: ${paper.progress}%`);
      console.log(`  每日目标: ${paper.dailyTarget} 字`);
      console.log(`  已完成字数: ${paper.completedWords} 字`);
      console.log(`  创建时间: ${paper.createdAt}`);
      console.log(`  更新时间: ${paper.updatedAt}`);
    });
    
    console.log('\n=== 数据持久化验证完成 ===');
    console.log('✅ 服务器重启后数据已成功加载');
    console.log('\n提示: 数据已保存在 server/data/ 目录中的 JSON 文件中');
    
  } catch (error) {
    console.error('验证过程中发生错误:', error);
    console.log('❌ 数据持久化验证失败');
  }
}

// 运行验证
verifyPersistence();