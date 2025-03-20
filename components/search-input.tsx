"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { GlowButton } from "@/components/ui/glow-button"
import { Search, Loader2 } from "lucide-react"
import { motion, useAnimation } from 'framer-motion'

interface SearchInputProps {
  onSearch: (term: string) => void
  isLoading?: boolean
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const controls = useAnimation()
  const formRef = useRef<HTMLFormElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value
    setSearchTerm(newTerm)
    onSearch(newTerm)
  }

  // 处理收缩动画
  const handleCollapse = () => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 如果没有输入内容且不是聚焦状态，设置2秒后收缩
    if (!searchTerm && !isFocused && !isHovered) {
      timeoutRef.current = setTimeout(() => {
        controls.start({
          width: '40px',
          transition: { duration: 0.3 }
        })
      }, 2000)
    }
  }

  // 监听搜索栏状态变化
  useEffect(() => {
    const shouldExpand = isHovered || isFocused || searchTerm.length > 0

    if (shouldExpand) {
      // 清除可能存在的收缩定时器
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // 展开动画
      controls.start({
        width: '100%',
        transition: {
          type: 'spring',
          stiffness: 100,
          damping: 20
        }
      })
    } else {
      // 触发延迟收缩
      handleCollapse()
    }

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isHovered, isFocused, searchTerm, controls])

  // 处理鼠标离开整个表单区域
  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      onMouseLeave={handleMouseLeave}
      className="relative w-[60%]"
    >
      <motion.div
        animate={controls}
        initial={{ width: '40px' }}
        className="relative ml-auto"
      >
        <Input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="输入设备名称搜索 (例如: Riedel)"
          className="pl-8 h-8 text-xs bg-zinc-800/80 backdrop-blur-sm border-zinc-700/50 text-white placeholder:text-zinc-400 focus:border-zinc-600 rounded-lg shadow-lg w-full"
          disabled={isLoading}
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
          <Search className="h-3.5 w-3.5 text-zinc-400" />
        </div>
        <div 
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
          onMouseEnter={() => setIsHovered(true)}
        >
          <GlowButton 
            type="submit" 
            disabled={isLoading}
            className="h-6 min-h-0 px-2 flex items-center justify-center text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <>
                <motion.span
                  animate={{ opacity: isHovered ? 0 : 1 }}
                  initial={{ opacity: 1 }}
                  className="absolute"
                >
                  搜索
                </motion.span>
                <motion.span
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  initial={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  搜索
                </motion.span>
              </>
            )}
          </GlowButton>
        </div>
      </motion.div>
    </form>
  )
}

