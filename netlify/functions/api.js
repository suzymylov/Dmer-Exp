// 简化的API处理函数
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const path = event.path.replace('/.netlify/functions/api', '') || '/';
  
  console.log('接收到API请求:', {
    path,
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? '有内容' : '无内容',
    url: event.path
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
          processedPath: path,
          method: event.httpMethod,
          headers: event.headers,
          queryParams: event.queryStringParameters
        }
      })
    }
  }
  
  // 处理聊天请求 - 无论是/chat还是/api/chat都应处理
  if (path === '/chat' || path === '/api/chat') {
    try {
      // 使用配置的API密钥和URL，提供默认值
      const apiKey = process.env.API_KEY || 'AIzaSyBr52X31WPJHMf1Qy570-zRDbiiUZ-zIRU';
      // 修正URL格式 - 使用正确的kidgapi端点
      const apiUrl = 'http://kidgapi.netlify.app/edge/v1/chat/completions';
      
      // 解析请求体
      const requestBody = JSON.parse(event.body);
      const { message, isFirstMessage } = requestBody;
      
      console.log('向Gemini API发送请求:', {
        apiUrl,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        isFirstMessage
      });
      
      // 构建发送给Gemini转发服务的消息 - 使用OpenAI格式
      const openaiRequest = {
        model: 'gemini-2.0-flash',
        messages: [
          // 如果是第一条消息，添加系统提示
          ...(isFirstMessage ? [{
            role: 'system',
            content: '你是一个专业的设备管理AI助手，能够提供准确、专业的回答。'
          }] : []),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      };
      
      // 发送请求到转发服务
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(openaiRequest)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API响应错误:', errorText);
        throw new Error(`API请求失败: ${response.status}, ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API响应:', JSON.stringify(data).substring(0, 150) + '...');
      
      // 从转发服务响应中提取文本
      const aiResponse = data.choices?.[0]?.message?.content || '无法获取响应';
      
      // 返回成功响应
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: aiResponse
        })
      };
    } catch (error) {
      console.error('处理聊天请求时出错:', error);
      
      // 返回错误响应
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: '处理请求时出错',
          details: error.message || '未知错误'
        })
      };
    }
  }
  
  // 默认响应
  return {
    statusCode: 404,
    body: JSON.stringify({ 
      success: false, 
      error: '未找到API端点',
      requestedPath: path,
      originalPath: event.path
    })
  }
} 