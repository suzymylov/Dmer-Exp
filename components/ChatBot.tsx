'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, X, Send, Loader2, Database } from 'lucide-react'
import { createPortal } from 'react-dom'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// 创建一个单独的调试窗口组件
const DebugWindow = ({ 
  onClose, 
  content 
}: { 
  onClose: () => void
  content: string 
}) => {
  // 阻止事件冒泡
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 left-0 top-0 w-full h-full flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">数据库上下文信息</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          <pre className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap text-sm font-mono">
            {content || '加载中...'}
          </pre>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function ChatBot() {
  const controls = useAnimation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [databaseContext, setDatabaseContext] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // 初始化聊天机器人
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChat()
    }
  }, [isOpen, isInitialized])

  // 添加 useEffect 来处理动画
  useEffect(() => {
    if (isOpen) {
      controls.start("visible")
    } else {
      controls.start("hidden")
    }
  }, [isOpen, controls])

  const initializeChat = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '初始化',
          isFirstMessage: true 
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMessages([{ role: 'assistant', content: data.message }])
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('初始化错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { 
      role: 'user' as const,
      content: input 
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          isFirstMessage: false 
        }),
      })

      const data = await response.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch (error) {
      console.error('聊天请求错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取数据库上下文
  const fetchDatabaseContext = useCallback(async () => {
    try {
      setDatabaseContext('正在加载AI系统消息...')
      const response = await fetch('/api/chat')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success && data.context) {
        setDatabaseContext(data.context)
      } else {
        throw new Error(data.error || '获取数据失败')
      }
    } catch (error) {
      console.error('获取系统消息错误:', error)
      setDatabaseContext('获取系统消息失败: ' + 
        (error instanceof Error ? error.message : '未知错误'))
    }
  }, [])

  // 修改监听调试按钮点击的逻辑
  useEffect(() => {
    const handleDebugClick = () => {
      if (!showDebugInfo) {  // 只在窗口未显示时才触发
        setShowDebugInfo(true)
        fetchDatabaseContext()
      }
    }
    
    document.addEventListener('debug-click', handleDebugClick)
    return () => document.removeEventListener('debug-click', handleDebugClick)
  }, [fetchDatabaseContext, showDebugInfo])  // 添加 showDebugInfo 作为依赖

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-[120px] items-center justify-center rounded-full bg-gradient-to-r from-blue-500/40 to-purple-500/40 hover:from-blue-500/50 hover:to-purple-500/50 text-white shadow-lg transition-all duration-300"
      >
        <div className="flex items-center">
          <MessageSquare className="h-5 w-5" />
          <span className="ml-2">AI 助手</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={controls}
            exit={{ opacity: 0, height: 0, y: -20 }}
            variants={{
              visible: { opacity: 1, height: 'auto', y: 0 },
              hidden: { opacity: 0, height: 0, y: -20 }
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-[60px] right-[10px] w-[calc(100vw-20px)] max-w-[350px] max-h-[calc(100vh-120px)] rounded-xl bg-white/90 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 overflow-hidden z-50"
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between border-b border-gray-100/20 p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/30 to-purple-500/30">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900">智能助手</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100/50 rounded-lg transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            {/* 消息列表 */}
            <div className="h-[calc(100vh-250px)] overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300/50 scrollbar-track-transparent bg-gradient-to-b from-white/50 to-white/80">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-gray-100/90 backdrop-blur-sm text-gray-800 border border-gray-100'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-gray-100">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <form onSubmit={handleSubmit} className="border-t border-gray-100/20 p-4 bg-white/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入消息..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showDebugInfo && (
        <DebugWindow
          onClose={() => setShowDebugInfo(false)}
          content={databaseContext}
        />
      )}
    </div>
  )
} 