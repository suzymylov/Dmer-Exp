'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Loader2 } from 'lucide-react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBot() {
  const controls = useAnimation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
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
      console.log('开始初始化聊天...')
      // 直接使用固定路径，不使用环境变量
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: '初始化',
          isFirstMessage: true 
        }),
      })

      if (!response.ok) {
        throw new Error(`状态码: ${response.status}`)
      }

      const data = await response.json()
      console.log('初始化成功:', data)
      if (data.success) {
        setMessages([{ role: 'assistant', content: data.message }])
        setIsInitialized(true)
      }
    } catch (error) {
      console.error('初始化错误:', error)
      // 向用户显示错误
      setMessages([{ 
        role: 'assistant', 
        content: `初始化失败: ${error instanceof Error ? error.message : '未知错误'}` 
      }])
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
      const response = await fetch(`${apiUrl}/chat`, {
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
            className="fixed top-[60px] right-[10px] w-[calc(100vw-20px)] md:w-[350px] max-h-[calc(100vh-120px)] rounded-2xl bg-white/85 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 overflow-hidden z-50"
            style={{
              right: '10px',  // 确保右边距
              maxWidth: 'calc(100vw - 20px)'  // 确保不超出屏幕
            }}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 border-b border-white/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-sm">
                  <MessageSquare className="h-5 w-5 text-white/90" />
                </div>
                <h3 className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                  AI 助手
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* 消息列表 */}
            <div className="h-[calc(100vh-250px)] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white/40 to-white/50">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-white/90 backdrop-blur-md text-gray-800 border border-white/40'
                    }`}
                  >
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/40">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-gray-600">思考中...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="border-t border-white/20 p-4 bg-white/60 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="输入消息..."
                  className="flex-1 rounded-xl border border-white/40 bg-white/85 backdrop-blur-sm px-4 py-2.5 text-gray-800 placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 