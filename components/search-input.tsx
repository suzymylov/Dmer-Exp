"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { GlowButton } from "@/components/ui/glow-button"
import { Search, Loader2 } from "lucide-react"

interface SearchInputProps {
  onSearch: (term: string) => void
  isLoading?: boolean
}

export function SearchInput({ onSearch, isLoading }: SearchInputProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value
    setSearchTerm(newTerm)
    onSearch(newTerm) // 实时搜索
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        type="text"
        value={searchTerm}
        onChange={handleChange}
        placeholder="输入设备名称搜索 (例如: Riedel)"
        className="pl-12 h-14 text-base bg-zinc-800/80 backdrop-blur-sm border-zinc-700/50 text-white placeholder:text-zinc-400 focus:border-zinc-600 rounded-xl shadow-lg"
        disabled={isLoading}
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Search className="h-5 w-5 text-zinc-400" />
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <GlowButton type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "搜索"}
        </GlowButton>
      </div>
    </form>
  )
}

