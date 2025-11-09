// 测试管理员API功能
const http = require('http');

// 辅助函数：发送HTTP请求
function makeHttpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function testAdminAPI() {
    console.log('开始测试管理员API功能...');
    
    try {
        // 1. 管理员登录获取令牌
        console.log('测试管理员登录...');
        const loginOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const loginData = JSON.stringify({
            email: 'admin@example.com',
            password: 'admin123'
        });
        
        const loginResponse = await makeHttpRequest(loginOptions, loginData);
        
        if (loginResponse.statusCode !== 200) {
            console.error(`登录失败，状态码: ${loginResponse.statusCode}`);
            console.error('响应体:', loginResponse.body);
            return;
        }
        
        const loginResult = JSON.parse(loginResponse.body);
        const token = loginResult.token;
        
        if (!token) {
            console.error('登录成功但未返回令牌');
            return;
        }
        
        console.log('管理员登录成功，获取到令牌');
        
        // 2. 使用令牌访问管理员统计API
        console.log('测试访问管理员统计API...');
        const statsOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/admin/stats',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        
        const statsResponse = await makeHttpRequest(statsOptions);
        
        if (statsResponse.statusCode !== 200) {
            console.error(`获取统计数据失败，状态码: ${statsResponse.statusCode}`);
            console.error('响应体:', statsResponse.body);
            return;
        }
        
        const statsResult = JSON.parse(statsResponse.body);
        console.log('管理员统计API调用成功！');
        console.log('统计数据:', JSON.stringify(statsResult, null, 2));
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
    }
}

// 运行测试
testAdminAPI();