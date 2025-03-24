const { db } = require('./db');

async function getDatabaseContext() {
  try {
    console.log('开始获取数据库上下文...');
    // 修改SQL查询，移除不存在的列
    const result = await db.execute(`
      SELECT 
        device_name,
        location,
        serial_number
      FROM devices
      ORDER BY device_name, location
    `);

    // 构建结构化数据
    const context = {
      devices: {},
      totalDevices: 0,
      locations: new Set()
    };

    // 处理查询结果
    result.rows.forEach(device => {
      const { device_name, location, serial_number } = device;
      context.totalDevices++;
      context.locations.add(location);

      if (!context.devices[device_name]) {
        context.devices[device_name] = {
          name: device_name,
          total: 0,
          locations: {},
          properties: {
            type: '未知类型', // 使用默认值代替数据库列
            specifications: [] // 使用空数组代替不存在的specifications列
          }
        };
      }

      if (!context.devices[device_name].locations[location]) {
        context.devices[device_name].locations[location] = {
          count: 0,
          serials: []
        };
      }

      context.devices[device_name].total++;
      context.devices[device_name].locations[location].count++;
      context.devices[device_name].locations[location].serials.push(serial_number);
    });

    // 转换为字符串并返回
    return JSON.stringify(context, (key, value) => {
      if (value instanceof Set) return [...value];
      return value;
    }, 2);
  } catch (error) {
    console.error('获取数据库上下文错误:', error);
    return JSON.stringify({ error: error.message });
  }
}

// 获取设备数据的统计信息
async function getDeviceStats() {
  try {
    // 修改SQL查询以包含序列号
    const statsResult = await db.execute(`
      SELECT 
        device_name,
        location,
        COUNT(*) as count,
        ARRAY_AGG(serial_number) as serials
      FROM devices
      GROUP BY device_name, location
      ORDER BY device_name, location
    `);

    // 修改格式化统计数据的方式
    const deviceStats = statsResult.rows.reduce((acc, curr) => {
      const count = parseInt(curr.count, 10);  // 确保count是数字类型
      
      if (!acc[curr.device_name]) {
        acc[curr.device_name] = {
          total: 0,
          locations: {}
        };
      }
      
      // 使用数字运算而不是字符串操作
      acc[curr.device_name].total = acc[curr.device_name].total + count;  // 数学运算
      acc[curr.device_name].locations[curr.location] = {
        count: count,  // 存储为数字
        serials: curr.serials  // 添加序列号数组
      };
      
      return acc;
    }, {});

    // 添加验证
    for (const device in deviceStats) {
      const locations = deviceStats[device].locations;
      const calculatedTotal = Object.values(locations)
        .reduce((sum, loc) => sum + loc.count, 0);
      deviceStats[device].total = calculatedTotal;  // 确保总数是通过加法得出
    }

    return deviceStats;
  } catch (error) {
    console.error('获取设备统计错误:', error);
    return {};
  }
}

module.exports = { 
  getDatabaseContext,
  getDeviceStats
}; 