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
    // 修改SQL查询，移除不存在的列
    const result = await db.execute(`
      SELECT 
        device_name,
        location,
        serial_number
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
      const { device_name, location, serial_number } = device
      context.totalDevices++
      context.locations.add(location)

      if (!context.devices[device_name]) {
        context.devices[device_name] = {
          name: device_name,
          total: 0,
          locations: {},
          properties: {
            type: '未知类型', // 使用默认值代替数据库列
            specifications: [] // 使用空数组代替不存在的specifications列
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

    // 转换为字符串并返回
    return JSON.stringify(context, (key, value) => {
      if (value instanceof Set) return [...value];
      return value;
    }, 2);
  } catch (error) {
    console.error('获取数据库上下文错误:', error)
    throw error
  }
} 