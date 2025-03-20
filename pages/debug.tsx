import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [result, setResult] = useState('测试中...')
  
  useEffect(() => {
    async function testAPI() {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: '测试',
            isFirstMessage: true 
          })
        })
        
        if (!res.ok) {
          setResult(`请求失败: ${res.status} ${res.statusText}`)
          return
        }
        
        const data = await res.json()
        setResult(`API连接成功: ${JSON.stringify(data)}`)
      } catch (error) {
        setResult(`错误: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
    
    testAPI()
  }, [])
  
  return (
    <div style={{ padding: 20 }}>
      <h1>API调试页面</h1>
      <div style={{ marginTop: 20, padding: 10, border: '1px solid #ccc' }}>
        {result}
      </div>
    </div>
  )
} 