import { NextResponse } from 'next/server'
import { getDatabaseContext } from '@/lib/database-context'
import { db } from '@/lib/db'
import { logToFile } from '@/lib/logger'

const API_URL = 'https://gemini.kid.ddns-ip.net/v1/chat/completions'
const API_KEY = 'AIzaSyBr52X31WPJHMf1Qy570-zRDbiiUZ-zIRU'

// 存储系统消息
let systemMessage: { role: 'system'; content: string } | null = null
// 存储对话历史
let conversationHistory: { role: string; content: string }[] = []
// 存储设备数据的缓存
let deviceDataCache: any = null

// 添加日志计数器
let messageCounter = 0

// 添加缓存时间戳
let lastDataFetchTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000  // 缓存5分钟

// 获取设备数据的统计信息
async function getDeviceStats() {
  try {
    // 修改SQL查询以包含序列号
    const statsResult = await db.execute(`
      SELECT 
        device_name,
        location,
        COUNT(*) as count,
        ARRAY_AGG(serial_number) as serials  /* 添加序列号聚合 */
      FROM devices
      GROUP BY device_name, location
      ORDER BY device_name, location
    `)

    // 修改格式化统计数据的方式
    const deviceStats = statsResult.rows.reduce((acc: any, curr: any) => {
      const count = parseInt(curr.count, 10)  // 确保count是数字类型
      
      if (!acc[curr.device_name]) {
        acc[curr.device_name] = {
          total: 0,
          locations: {}
        }
      }
      
      // 使用数字运算而不是字符串操作
      acc[curr.device_name].total = acc[curr.device_name].total + count  // 数学运算
      acc[curr.device_name].locations[curr.location] = {
        count: count,  // 存储为数字
        serials: curr.serials  // 添加序列号数组
      }
      
      return acc
    }, {})

    // 添加验证
    for (const device in deviceStats) {
      const locations = deviceStats[device].locations
      const calculatedTotal = Object.values(locations)
        .reduce((sum: number, loc: any) => sum + loc.count, 0)
      deviceStats[device].total = calculatedTotal  // 确保总数是通过加法得出
    }

    return deviceStats
  } catch (error) {
    console.error('获取设备统计错误:', error)
    return null
  }
}

// 添加一个新的函数来获取初始化时的数据库上下文
async function getInitialContext() {
  try {
    const databaseContext = await getDatabaseContext()
    return databaseContext
  } catch (error) {
    console.error('获取数据库上下文错误:', error)
    return null
  }
}

// 获取数据（使用缓存）
async function getDataWithCache() {
  // 只在缓存不存在时获取数据
  if (!deviceDataCache) {
    console.log('首次从数据库获取数据')
    const databaseContext = await getInitialContext()
    const deviceStats = await getDeviceStats()
    
    // 更新缓存
    deviceDataCache = {
      databaseContext,
      deviceStats
    }
  } else {
    console.log('使用内存中的缓存数据')
  }

  return deviceDataCache
}

export async function POST(request: Request) {
  try {
    messageCounter++
    const { message, isFirstMessage } = await request.json()
    
    // 使用缓存的数据
    const { databaseContext, deviceStats } = await getDataWithCache()

    // 如果是第一次对话，创建系统消息
    if (isFirstMessage || !systemMessage) {
      systemMessage = {
        role: 'system',
        content: `你是一个专业的设备管理AI助手。你可以访问以下设备数据和统计信息：

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

请记住对话上下文，理解连续提问的关联性。`
      }
      conversationHistory = [systemMessage]
    }

    // 非首次对话，添加新消息到历史记录
    if (!isFirstMessage) {
      // 保持原有的系统消息（包含数据库信息）
      const userMessages = conversationHistory.filter(msg => msg.role !== 'system')
      conversationHistory = [
        systemMessage,  // 必须包含，因为AI需要在每次请求中看到数据
        ...userMessages,
        { role: 'user', content: message }
      ]
    }

    // 发送完整历史给AI（包括系统消息和所有对话）
    const messages = conversationHistory

    console.log('发送给AI的消息数量:', messages.length)
    console.log('包含数据库信息:', !!messages.find(msg => msg.role === 'system'))

    // 发送请求到AI
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash-exp',
        messages: messages,  // 发送完整历史
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API响应错误:', errorText)
      throw new Error(`API请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('API响应格式错误')
    }

    // 添加AI回复到历史记录
    const aiResponse = data.choices[0].message.content
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    })

    // 记录AI响应
    console.log('AI响应状态:', response.status)
    console.log(`[${new Date().toISOString()}] 完成第 ${messageCounter} 次对话`)
    console.log('----------------------------------------')

    // 记录到文件
    logToFile(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
第 ${messageCounter} 次对话开始
时间: ${new Date().toISOString()}
用户消息: ${message}
对话历史长度: ${conversationHistory.length}
系统消息大小: ${Buffer.byteLength(systemMessage?.content || '', 'utf8')} bytes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

    return NextResponse.json({ 
      message: aiResponse,
      success: true 
    })
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 错误发生在第 ${messageCounter} 次对话:`, error)
    logToFile(`
错误发生
时间: ${new Date().toISOString()}
错误: ${error instanceof Error ? error.message : '未知错误'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
    return NextResponse.json(
      { 
        error: '处理请求时出错',
        details: error instanceof Error ? error.message : '未知错误',
        success: false 
      },
      { status: 500 }
    )
  }
}

// 添加新的GET方法来获取系统消息
export async function GET() {
  try {
    // 直接返回当前的系统消息
    if (systemMessage) {
      return NextResponse.json({ 
        success: true, 
        context: systemMessage.content  // 返回发送给AI的系统消息
      })
    } else {
      // 如果系统消息还没初始化，则初始化它
      const databaseContext = await getDatabaseContext()
      const deviceStats = await getDeviceStats()
      
      const content = `你是一个专业的设备管理AI助手。你可以访问以下设备数据和统计信息：

详细设备数据：
${databaseContext}

设备统计信息：
${JSON.stringify(deviceStats, null, 2)}

请遵循以下规则：
1. 设备查询：
   - 当用户询问具体设备数量时，请使用统计数据提供精确数字
   - 当询问设备分布时，列出所有相关地点及其对应数量
   - 回答要格式清晰，数据准确

2. 设备知识：
   - 可以解释设备的功能、用途和技术特点
   - 基于专业知识回答设备相关的技术问题
   - 提供专业且易懂的解释

3. 通用对话：
   - 保持友好和专业的对话态度
   - 可以处理任何通用话题
   - 在技术和日常话题之间自然切换

请记住上下文，理解用户的连续提问，并保持对话的连贯性。`

      return NextResponse.json({ 
        success: true, 
        context: content
      })
    }
  } catch (error) {
    console.error('获取系统消息错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取系统消息失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { 
      status: 500 
    })
  }
} 