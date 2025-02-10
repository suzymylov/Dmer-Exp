import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Hash, Laptop, ChevronDown, ChevronUp } from "lucide-react"
import type { GroupedDevice } from "@/types/device"
import "../styles/glow-container.css"
import "../styles/pulse-animations.css"
import { motion, useAnimation } from "framer-motion"

interface DeviceContainerProps {
  device: GroupedDevice
  index: number
  totalDevices: number
}

export function DeviceContainer({ device, index, totalDevices }: DeviceContainerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsExpansion, setNeedsExpansion] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const MAX_HEIGHT = 300 // 最大高度阈值

  useEffect(() => {
    const checkHeight = () => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight
        const clientHeight = contentRef.current.clientHeight
        setNeedsExpansion(contentHeight > MAX_HEIGHT && contentHeight - MAX_HEIGHT > 20)
      }
    }

    checkHeight()
    window.addEventListener("resize", checkHeight)
    return () => window.removeEventListener("resize", checkHeight)
  }, [device])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          controls.start("visible")
        } else {
          controls.start("hidden")
        }
      },
      { threshold: 0.1 },
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [controls])

  const themes = [
    {
      bg: "bg-orange-500",
      text: "text-white",
      location: "text-white",
      tag: "bg-orange-400/30 text-white",
      icon: "text-white",
    },
    {
      bg: "bg-sky-500",
      text: "text-white",
      location: "text-white",
      tag: "bg-sky-400/30 text-white",
      icon: "text-white",
    },
    {
      bg: "bg-yellow-500",
      text: "text-white",
      location: "text-white",
      tag: "bg-yellow-400/30 text-white",
      icon: "text-white",
    },
    {
      bg: "bg-green-500",
      text: "text-white",
      location: "text-white",
      tag: "bg-green-400/30 text-white",
      icon: "text-white",
    },
    {
      bg: "bg-pink-500",
      text: "text-white",
      location: "text-white",
      tag: "bg-pink-400/30 text-white",
      icon: "text-white",
    },
    {
      bg: "bg-purple-500",
      text: "text-white",
      location: "text-white",
      tag: "bg-purple-400/30 text-white",
      icon: "text-white",
    },
  ]

  const theme = themes[index % themes.length]

  const row = Math.floor(index / 4)
  const column = index % 4
  const isMiddleColumn = column === 1 || column === 2
  const custom = { column, isMiddleColumn }

  const variants = {
    hidden: {
      opacity: 0,
      x: column < 2 ? -100 : 100,
      transition: {
        duration: 0.3,
      },
    },
    visible: (custom: { column: number; isMiddleColumn: boolean }) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        delay: custom.isMiddleColumn ? 0.1 : 0.3,
      },
    }),
  }

  return (
    <motion.div ref={containerRef} initial="hidden" animate={controls} variants={variants} custom={custom}>
      <Card
        className={`${theme.bg} glow-container border-none shadow-lg rounded-2xl overflow-hidden group hover:scale-[1.02] transition-all duration-300 ease-out relative ${needsExpansion ? "cursor-pointer" : ""}`}
        onClick={() => needsExpansion && setIsExpanded(!isExpanded)}
      >
        <CardContent
          ref={contentRef}
          className={`p-5 ${!isExpanded && needsExpansion ? "max-h-[300px] overflow-hidden" : ""} animate-in fade-in duration-300 hover:scale-[1.02] transition-all`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-2xl font-bold text-white bg-white/30 backdrop-blur-sm shadow-lg ring-2 ring-white/50 animate-pulse-strong`}
              >
                {device.locations.reduce((sum, location) => sum + location.serial_numbers.length, 0)}
              </span>
              <h2 className={`text-lg font-bold ${theme.text} ml-2`}>{device.device_name}</h2>
            </div>
            <Laptop className={`h-5 w-5 ${theme.icon} opacity-50 group-hover:opacity-100 transition-opacity`} />
          </div>
          <div className="space-y-4">
            {device.locations.map((location, locationIndex) => (
              <div key={locationIndex} className={`space-y-2 rounded-xl ${theme.tag} p-3 backdrop-blur-sm`}>
                <div className={`flex items-center gap-2 ${theme.location}`}>
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{location.name}</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-sm font-bold ${theme.bg} text-white shadow-md ring-1 ring-white/30 animate-pulse-subtle`}
                  >
                    {location.serial_numbers.length}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className={`h-4 w-4 mt-1 ${theme.location}`} />
                  <div className="flex-1">
                    <div className={`text-sm ${theme.location} mb-2`}>序列号:</div>
                    <div className="font-mono text-sm flex flex-wrap gap-1.5">
                      {location.serial_numbers.map((sn, snIndex) => (
                        <span
                          key={snIndex}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors`}
                        >
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        {needsExpansion && !isExpanded && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-16 ${theme.bg} bg-opacity-90 flex items-center justify-center`}
            style={{
              background: `linear-gradient(to bottom, transparent, ${theme.bg})`,
            }}
          >
            <ChevronDown className={`h-6 w-6 ${theme.text}`} />
          </div>
        )}
        {needsExpansion && isExpanded && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-16 ${theme.bg} bg-opacity-90 flex items-center justify-center`}
          >
            <ChevronUp className={`h-6 w-6 ${theme.text}`} />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

