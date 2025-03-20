import { db } from './db'

interface DeviceData {
  name: string
  total: number
  locations: {
    [key: string]: {
      count: number
      serials: string[]
    }
  }
  properties: {
    type: string
    specifications: string[]
  }
}

interface DatabaseContext {
  devices: {
    [key: string]: DeviceData
  }
  totalDevices: number
  locations: Set<string>
}

export async function getDatabaseContext(): Promise<string> {
  try {
    console.log('开始获取数据库上下文...')
    // 获取详细的设备数据 - 移除不存在的列
    const result = await db.execute(`
      SELECT 
        device_name,
        location,
        serial_number,
        type
      FROM devices
      ORDER BY device_name, location
    `)

    // 构建结构化数据
    const context: DatabaseContext = {
      devices: {},
      totalDevices: 0,
      locations: new Set()
    }

    // 处理查询结果
    result.rows.forEach(device => {
      const { device_name, location, serial_number, type } = device
      context.totalDevices++
      context.locations.add(location)

      if (!context.devices[device_name]) {
        context.devices[device_name] = {
          name: device_name,
          total: 0,
          locations: {},
          properties: {
            type: type || '未知类型',
            specifications: [] // 直接使用空数组代替不存在的specifications列
          }
        }
      }

      if (!context.devices[device_name].locations[location]) {
        context.devices[device_name].locations[location] = {
          count: 0,
          serials: []
        }
      }

      context.devices[device_name].total++
      context.devices[device_name].locations[location].count++
      context.devices[device_name].locations[location].serials.push(serial_number)
    })

    // 改进AI友好的格式
    const contextString = `
系统数据库信息:

${Object.values(context.devices).map(device => {
  const locations = Object.entries(device.locations);
  // 强制进行数值计算
  const numbers = locations.map(([_, data]) => data.count);
  const sum = numbers.reduce((a, b) => a + b, 0);
  
  return `
设备: ${device.name}
━━━━━━━━━━━━━━━━━━━━━

数值信息 (严格数学运算):
数字1 = ${numbers[0] || 0}
数字2 = ${numbers[1] || 0}
...

数学运算过程:
${numbers.join(' + ')} = ${sum}

分布明细:
${locations.map(([loc, data], i) => 
  `地点${i + 1}: ${loc}
   数量: ${data.count}`
).join('\n')}

数学验证:
1️⃣ 各数字列表: ${numbers.join(', ')}
2️⃣ 加法运算: ${numbers.join(' + ')} = ${sum}
3️⃣ 最终结果: ${sum} 件

⚠️ 重要提示 ⚠️
此设备的准确数量是 ${sum} 件
这个数字是通过数学加法得出: ${numbers.join(' + ')} = ${sum}
━━━━━━━━━━━━━━━━━━━━━`
}).join('\n\n')}

AI助手注意事项:
1. 🔢 数字处理指令:
   - 你必须将看到的每个数字转换为数值类型
   - 禁止使用字符串拼接处理数字
   - 必须使用数学加法运算

2. ➕ 当看到多个数字时:
   第一步: 提取每个数字为独立的数值
   第二步: 使用加法运算符计算总和
   第三步: 显示计算过程

3. 📊 回答模板:
   见到数字 1 和 14 时:
   • 错误示范: "114" (禁止字符串拼接)
   • 正确示范: 1 + 14 = 15 (必须数学运算)

4. ✅ 强制验证:
   - 每次回答前都要进行数学运算
   - 必须展示计算过程
   - 确保结果是数学运算的结果

你是一个数学计算助手，必须严格执行数学运算。
当用户询问数量时，你必须:
1. 分别列出每个数字
2. 显示加法过程
3. 给出数学运算结果`

    // 添加日志
    console.log('成功构建数据库上下文')
    return contextString

  } catch (error) {
    console.error('构建数据库上下文错误:', error)
    throw error  // 重新抛出错误以便上层处理
  }
} 