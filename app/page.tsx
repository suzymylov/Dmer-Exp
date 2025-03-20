"use client"

import { useState, useEffect } from "react"
import { DeviceContainer } from "@/components/device-container"
import { SearchInput } from "@/components/search-input"
import type { GroupedDevice } from "@/types/device"
import { toast } from "@/components/ui/use-toast"
import { Boxes } from "lucide-react"
import WaterRippleEffect from "@/components/WaterRippleEffect"
import { ChatBot } from "@/components/ChatBot"

function compareSerialNumbers(a: string, b: string): number {
  const numA = Number.parseInt(a.replace(/\D/g, ""))
  const numB = Number.parseInt(b.replace(/\D/g, ""))
  return numA - numB
}

export default function Page() {
  const [isLoading, setIsLoading] = useState(true)
  const [allDevices, setAllDevices] = useState<GroupedDevice[]>([])
  const [filteredDevices, setFilteredDevices] = useState<GroupedDevice[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/devices")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || `请求失败: ${response.status}`)
      }

      if (!Array.isArray(data.devices)) {
        throw new Error("返回的数据格式不正确")
      }

      const groupedDevices: GroupedDevice[] = []
      data.devices.forEach((device: any) => {
        if (!device.device_name || !device.location || !device.serial_number) {
          console.warn("设备数据不完整:", device)
          return
        }

        let existingGroup = groupedDevices.find((g) => g.device_name === device.device_name)
        if (!existingGroup) {
          existingGroup = {
            device_name: device.device_name,
            locations: [],
          }
          groupedDevices.push(existingGroup)
        }

        let existingLocation = existingGroup.locations.find((l) => l.name === device.location)
        if (!existingLocation) {
          existingLocation = {
            name: device.location,
            serial_numbers: [],
          }
          existingGroup.locations.push(existingLocation)
        }

        existingLocation.serial_numbers.push(device.serial_number)
      })

      groupedDevices.forEach((device) => {
        device.locations.forEach((location) => {
          location.serial_numbers.sort(compareSerialNumbers)
        })
      })

      setAllDevices(groupedDevices)
      setFilteredDevices(groupedDevices)
      setError(null)
    } catch (error) {
      console.error("获取设备错误:", error)
      const errorMessage = error instanceof Error ? error.message : "发生未知错误"
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "获取设备失败",
        description: errorMessage,
      })
      setAllDevices([])
      setFilteredDevices([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDevices()
  }, [])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim() === "") {
      setFilteredDevices(allDevices)
    } else {
      const filtered = allDevices.filter((device) => device.device_name.toLowerCase().includes(term.toLowerCase()))
      setFilteredDevices(filtered)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-900">
      <WaterRippleEffect />
      
      {/* 固定头部 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 backdrop-blur-md border-b border-white/20 shadow-lg">
        <div className="max-w-[90rem] mx-auto px-4 md:px-6 py-4">
          <div className="relative flex flex-col md:flex-row md:items-center">
            {/* Logo部分 */}
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 rounded-2xl bg-gradient-to-r from-blue-500/40 to-purple-500/40 hover:from-blue-500/50 hover:to-purple-500/50 transition-all duration-300 shadow-xl">
                <Boxes className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 tracking-wide">
                Dmer-Exp
              </h1>
            </div>
            
            {/* 搜索栏和聊天按钮容器 */}
            <div className="flex-1 flex justify-end mx-auto">
              {/* 搜索栏 */}
              <div className="w-full md:w-[600px] flex items-center justify-end gap-2 md:gap-4">
                <SearchInput onSearch={handleSearch} isLoading={isLoading} />
                <ChatBot />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 调整主内容区域的上边距 */}
      <div className="max-w-[90rem] mx-auto px-4 md:px-6 pt-40 md:pt-32 pb-8">
        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-400">{error}</div>
          </div>
        )}

        {!error && isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-zinc-400">加载中...</div>
          </div>
        ) : !error && filteredDevices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-auto">
            {filteredDevices.map((device, index) => (
              <DeviceContainer
                key={`${device.device_name}-${index}`}
                device={device}
                index={index}
                totalDevices={filteredDevices.length}
              />
            ))}
          </div>
        ) : (
          !error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-zinc-400">
                {searchTerm ? `没有找到包含 "${searchTerm}" 的设备` : "没有找到匹配的设备"}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}

