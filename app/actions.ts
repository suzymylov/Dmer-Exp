'use server'

import { db } from '@/lib/db'
import type { GroupedDevice } from '@/types/device'

export async function searchGroupedDevices(searchTerm: string): Promise<GroupedDevice[]> {
  try {
    const result = await db.execute(`
      SELECT device_name, location, serial_number
      FROM devices
      WHERE LOWER(device_name) LIKE LOWER($1)
      ORDER BY device_name ASC, location ASC, serial_number ASC;
    `, [`%${searchTerm}%`])
    
    if (!result.rows) {
      console.error('没有从数据库返回行')
      return []
    }

    const devices = result.rows as Array<{device_name: string, location: string, serial_number: string}>
    const groupedDevices: GroupedDevice[] = []

    devices.forEach((device) => {
      let existingGroup = groupedDevices.find(g => g.device_name === device.device_name)
      if (!existingGroup) {
        existingGroup = {
          device_name: device.device_name,
          locations: []
        }
        groupedDevices.push(existingGroup)
      }

      let existingLocation = existingGroup.locations.find(l => l.name === device.location)
      if (!existingLocation) {
        existingLocation = {
          name: device.location,
          serial_numbers: []
        }
        existingGroup.locations.push(existingLocation)
      }

      existingLocation.serial_numbers.push(device.serial_number)
    })

    return groupedDevices
  } catch (error) {
    console.error('数据库查询错误:', error)
    return []
  }
}

