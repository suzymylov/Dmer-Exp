import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""

  try {
    let sql = `
      SELECT device_name, location, serial_number
      FROM devices
    `

    const params: string[] = []

    if (query.trim()) {
      sql += ` WHERE LOWER(device_name) LIKE LOWER($1)`
      params.push(`%${query}%`)
    }

    sql += ` ORDER BY device_name ASC, location ASC, serial_number ASC`

    const result = await db.execute(sql, params)

    if (!result.rows) {
      return NextResponse.json(
        {
          success: false,
          error: "没有数据返回",
          devices: [],
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      devices: result.rows,
      totalCount: result.rows.length,
      currentPage: 1,
      totalPages: 1,
    })
  } catch (error) {
    console.error("数据库查询错误:", error)
    return NextResponse.json(
      {
        success: false,
        error: "数据库查询失败",
        details: error instanceof Error ? error.message : "未知错误",
        devices: [],
      },
      { status: 500 },
    )
  }
}

