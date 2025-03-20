// 简化的API处理函数
exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/api', '') || '/';
  
  console.log('接收到API请求:', {
    path,
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? '有内容' : '无内容'
  });
  
  // 添加调试响应
  if (path === '/debug') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'API函数正常工作',
        event: {
          path: event.path,
          method: event.httpMethod,
          headers: event.headers,
          queryParams: event.queryStringParameters
        }
      })
    }
  }
  
  // 根据路径返回不同的响应
  if (path === '/chat') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: '欢迎使用AI助手，我能帮您查询设备信息。'
      })
    }
  }
  
  // 默认响应
  return {
    statusCode: 404,
    body: JSON.stringify({ success: false, error: '未找到API端点' })
  }
} 