'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface DeviceCardProps {
  title: string
  deviceCount: number
  category: string
  subCategory: string
  locations: Array<{
    name: string
    count: number
  }>
}

export function DeviceCard({ title, deviceCount, category, subCategory, locations }: DeviceCardProps) {
  return (
    <Card className="bg-zinc-900 text-white border-zinc-800">
      <CardHeader>
        <CardTitle className="text-xl text-emerald-400">{title}</CardTitle>
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">设备总数</span>
            <span className="text-2xl font-bold">{deviceCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">类别</span>
            <span className="text-emerald-400">{category}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">子类别</span>
            <span className="text-emerald-400">{subCategory}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        {locations.map((location, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">{location.name}</span>
              <span>{location.count}</span>
            </div>
            <Progress value={(location.count / deviceCount) * 100} className="h-2 bg-zinc-800" className="bg-emerald-400" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

