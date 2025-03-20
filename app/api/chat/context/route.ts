import { NextResponse } from 'next/server'
import { getDatabaseContext } from '@/lib/database-context'

export async function GET() {
  try {
    const context = await getDatabaseContext()
    if (!context) {
      throw new Error('无法获取数据库上下文')
    }
    
    return NextResponse.json({ 
      success: true, 
      context 
    })
  } catch (error) {
    console.error('获取数据库上下文错误:', error)
    return NextResponse.json({ 
      success: false, 
      error: '获取数据库上下文失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { 
      status: 500 
    })
  }
} 