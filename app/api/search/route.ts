import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  try {
    const result = await db.execute(`
      SELECT device_name, location, serial_number
      FROM devices
      WHERE LOWER(device_name) LIKE LOWER($1)
      ORDER BY device_name ASC, location ASC, serial_number ASC;
    `, [`%${query}%`])
    
    return NextResponse.json({ devices: result.rows })
  } catch (error) {
    console.error('搜索查询错误:', error)
    return NextResponse.json(
      { error: '搜索时发生错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

