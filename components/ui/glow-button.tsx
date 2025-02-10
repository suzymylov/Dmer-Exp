'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import '../../styles/glow-button.css'

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const GlowButton = forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`glow-button ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
GlowButton.displayName = 'GlowButton'

export { GlowButton }

