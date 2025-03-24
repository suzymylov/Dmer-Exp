// 简化的API处理函数
const fetch = require('node-fetch');
const { getDatabaseContext, getDeviceStats } = require('./database-context');
const { logToFile } = require('./logger');

// 存储系统消息
let systemMessage = null;
// 存储对话历史
let conversationHistory = [];
// 存储设备数据的缓存
let deviceDataCache = null;
// 添加日志计数器
let messageCounter = 0;

// 获取数据（使用缓存）
async function getDataWithCache() {
  // 只在缓存不存在时获取数据
  if (!deviceDataCache) {
    console.log('首次从数据库获取数据');
    try {
      const databaseContext = await getDatabaseContext();
      const deviceStats = await getDeviceStats();
      
      // 更新缓存
      deviceDataCache = {
        databaseContext,
        deviceStats
      };
    } catch (error) {
      console.error('获取数据失败:', error);
      deviceDataCache = {
        databaseContext: JSON.stringify({ error: '数据库连接失败' }),
        deviceStats: {}
      };
    }
  } else {
    console.log('使用内存中的缓存数据');
  }

  return deviceDataCache;
}

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
  
  // 处理设备数据请求
  if (path === '/devices' || path === '/api/devices') {
    try {
      console.log('处理设备数据请求');
      // 获取设备数据
      const { deviceStats } = await getDataWithCache();
      
      // 转换设备数据为前端需要的格式
      const devices = [];
      
      // 从deviceStats转换数据格式
      for (const deviceName in deviceStats) {
        const deviceData = deviceStats[deviceName];
        
        // 遍历每个位置
        for (const locationName in deviceData.locations) {
          const locationData = deviceData.locations[locationName];
          
          // 将每个序列号添加为单独的设备条目
          locationData.serials.forEach(serialNumber => {
            devices.push({
              device_name: deviceName,
              location: locationName,
              serial_number: serialNumber
            });
          });
        }
      }
      
      // 记录响应日志
      console.log(`返回${devices.length}个设备数据`);
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          devices: devices
        })
      };
    } catch (error) {
      console.error('处理设备数据请求出错:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: '获取设备数据失败',
          details: error.message || '未知错误'
        })
      };
    }
  }
  
  // 处理聊天请求 - 无论是/chat还是/api/chat都应处理
  if (path === '/chat' || path === '/api/chat') {
    try {
      messageCounter++;
      // 使用配置的API密钥和URL，提供默认值
      const apiKey = process.env.API_KEY || 'AIzaSyBr52X31WPJHMf1Qy570-zRDbiiUZ-zIRU';
      // 修正URL格式 - 使用正确的kidgapi端点
      const apiUrl = 'https://kidgapi.netlify.app/edge/v1/chat/completions';
      
      // 解析请求体
      const requestBody = JSON.parse(event.body);
      const { message, isFirstMessage } = requestBody;
      
      // 获取数据库数据
      const { databaseContext, deviceStats } = await getDataWithCache();
      
      // 如果是第一次对话，创建系统消息
      if (isFirstMessage || !systemMessage) {
        systemMessage = {
          role: 'system',
          content: `你是一个专业的设备管理AI助手，同时也能回答日常问题。你可以访问以下设备数据和统计信息：

详细设备数据：
${databaseContext}

设备统计信息：
${JSON.stringify(deviceStats, null, 2)}

请遵循以下规则：
1. 设备查询：
   - 当用户询问具体设备数量时，请使用统计数据提供精确数字
   - 当询问设备分布时，列出所有相关地点及其对应数量
   - 回答要格式清晰，数据准确
   - 当用户问"在哪里"或"分布在哪里"时，列出该设备的所有位置和数量

2. 上下文理解：
   - 记住用户之前提到的设备名称
   - 理解代词（"它"、"这个"等）指代的是之前提到的设备
   - 主动关联上下文中的设备信息

3. 通用对话：
   - 保持友好和专业的对话态度
   - 在不确定时主动询问用户具体指哪个设备
   - 展示完整的数据和计算过程

4. 额外能力 - 日常问题：
   - 你也可以回答天气、新闻、生活常识等日常问题
   - 在不涉及设备时可以进行自然、友好的闲聊
   - 回答日常问题时可以更灵活自然，像真人一样交流
   - 适当展示幽默感和个性，增加交流的亲和力

请记住对话上下文，理解连续提问的关联性。面对设备问题时保持专业，面对日常问题时保持灵活。不要仅因为问题不是关于设备就拒绝回答。`
        };
        conversationHistory = [systemMessage];
      }
      
      console.log('向Gemini API发送请求:', {
        apiUrl,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        isFirstMessage
      });
      
      // 非首次对话，添加新消息到历史记录
      if (!isFirstMessage) {
        // 保持原有的系统消息（包含数据库信息）
        const userMessages = conversationHistory.filter(msg => msg.role !== 'system');
        conversationHistory = [
          systemMessage,  // 必须包含，因为AI需要在每次请求中看到数据
          ...userMessages,
          { role: 'user', content: message }
        ];
      }
      
      // 构建发送给Gemini转发服务的消息 - 使用OpenAI格式
      const openaiRequest = {
        model: 'gemini-2.0-flash',
        messages: conversationHistory,
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
      
      // 添加AI回复到历史记录
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse
      });
      
      // 记录日志
      logToFile(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
第 ${messageCounter} 次对话开始
时间: ${new Date().toISOString()}
用户消息: ${message}
对话历史长度: ${conversationHistory.length}
系统消息大小: ${Buffer.byteLength(systemMessage?.content || '', 'utf8')} bytes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
      
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
      logToFile(`
错误发生
时间: ${new Date().toISOString()}
错误: ${error.message || '未知错误'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
      
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