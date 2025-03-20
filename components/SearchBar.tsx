'use client'

import { useEffect, useState, useRef } from 'react'
import { Search } from 'lucide-react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'

export function SearchBar() {
  const controls = useAnimation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])

  const animationSequence = async () => {
    while (true) {
      // 收起状态
      await controls.start({
        width: '48px',
        transition: { duration: 0.3 }
      })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 展开状态
      await controls.start({
        width: '300px',
        transition: {
          type: 'spring',
          stiffness: 100,
          damping: 20
        }
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  useEffect(() => {
    animationSequence()
  }, [])

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleResultClick = (result: any) => {
    // Handle result click
  }

  return (
    <div className="relative">
      <button
        onClick={toggleSearch}
        className="flex h-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500/40 to-purple-500/40 hover:from-blue-500/50 hover:to-purple-500/50 text-white px-4 shadow-lg transition-all duration-300"
      >
        <Search className="h-5 w-5" />
        <span className="ml-2">搜索</span>
      </button>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed md:absolute right-0 top-[60px] md:top-full md:left-0 w-[90vw] md:w-80 m-2 rounded-xl bg-white/90 backdrop-blur-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 overflow-hidden z-[100]"
            style={{
              maxWidth: "calc(100vw - 20px)",
              transform: "none" // 覆盖任何可能的transform
            }}
          >
            <div className="flex p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleChange}
                placeholder="搜索设备..."
                className="flex-1 rounded-lg border border-gray-200 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-white/80 backdrop-blur-sm"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto p-2 bg-white/50">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-gray-100/60 rounded-lg cursor-pointer"
                    onClick={() => handleResultClick(result)}
                  >
                    {result.name || result.id}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 