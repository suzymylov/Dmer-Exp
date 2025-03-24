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
      const apiUrl = process.env.API_URL || 'http://kidgapi.netlify.app/edge/v1/chat/completions';
      
      // 解析请求体
      const requestBody = JSON.parse(event.body);
      const { message, isFirstMessage } = requestBody;
      
      console.log('向Gemini API发送请求:', {
        apiUrl,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        isFirstMessage
      });
      
      // 构建发送给Gemini的消息
      const messages = [{
        role: 'user',
        content: message
      }];
      
      // 发送请求到Gemini API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: messages,
          temperature: 0.7,
          maxOutputTokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API响应错误:', errorText);
        throw new Error(`API请求失败: ${response.status}, ${errorText}`);
      }
      
      const data = await response.json();
      
      // 根据Gemini响应格式解析返回数据
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                        data.choices?.[0]?.message?.content || 
                        '无法解析AI响应';
      
      console.log('收到Gemini API响应:', {
        status: response.status,
        hasContent: !!aiResponse
      });
      
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