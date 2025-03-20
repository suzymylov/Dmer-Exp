"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Database, X } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

export function DebugWindow() {
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleDebugClick = async () => {
      try {
        setError(null)
        setContent('加载中...')
        setIsOpen(true)
        
        const response = await fetch('/api/chat/context')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        if (data.success) {
          setContent(data.context)
        } else {
          throw new Error(data.error || '获取数据失败')
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        console.error('获取调试信息失败:', error)
        setError(`获取系统消息失败: ${errorMessage}`)
        toast({
          variant: "destructive",
          title: "错误",
          description: `获取数据失败: ${errorMessage}`
        })
      }
    }

    document.addEventListener('debug-click', handleDebugClick)
    return () => document.removeEventListener('debug-click', handleDebugClick)
  }, [])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 left-0 top-0 w-full h-full flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />
      <div className="relative bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">数据库上下文信息</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          {error ? (
            <div className="text-red-500 p-4 rounded-lg bg-red-50">
              {error}
            </div>
          ) : (
            <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap text-sm font-mono">
              {content}
            </pre>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
} 