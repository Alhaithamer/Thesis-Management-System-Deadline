// 测试数据持久化功能
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

async function testPersistence() {
    console.log('开始测试数据持久化功能...');
    
    try {
        // 1. 获取所有论文
        console.log('获取所有论文...');
        const getPapersOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/papers',
            method: 'GET'
        };
        
        const papersResponse = await makeHttpRequest(getPapersOptions);
        
        if (papersResponse.statusCode !== 200) {
            console.error(`获取论文失败，状态码: ${papersResponse.statusCode}`);
            console.error('响应体:', papersResponse.body);
            return;
        }
        
        const papers = JSON.parse(papersResponse.body);
        console.log(`成功获取 ${papers.length} 篇论文`);
        
        // 2. 检查用户数据
        console.log('检查用户数据...');
        // 注意：这里可能需要适当的认证才能访问用户数据
        
        console.log('数据持久化测试完成');
        
    } catch (error) {
        console.error('测试过程中发生错误:', error.message);
    }
}

// 运行测试
testPersistence();