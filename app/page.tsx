"use client"

import { useState, useEffect } from "react"
import { DeviceContainer } from "@/components/device-container"
import { SearchInput } from "@/components/search-input"
import type { GroupedDevice } from "@/types/device"
import { toast } from "@/components/ui/use-toast"
import { Boxes } from "lucide-react"
import WaterRippleEffect from "@/components/WaterRippleEffect"

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
      <div className="max-w-[90rem] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="p-3 rounded-2xl bg-zinc-800/50 backdrop-blur-sm">
            <Boxes className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Dmer-Exp</h1>
        </div>

        <div className="mb-12 max-w-xl mx-auto">
          <SearchInput onSearch={handleSearch} isLoading={isLoading} />
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDevices.map((device, index) => (
              <DeviceContainer key={index} device={device} index={index} totalDevices={filteredDevices.length} />
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

