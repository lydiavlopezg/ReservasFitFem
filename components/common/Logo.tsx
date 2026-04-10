import React from 'react'

interface LogoProps {
  height?: string
  style?: React.CSSProperties
  className?: string
}

export default function Logo({ height = '40px', style, className }: LogoProps) {
  return (
    <img 
      src="/logo.png" 
      alt="Fit&Fem Studio" 
      className={className}
      style={{ 
        height, 
        width: 'auto', 
        display: 'block',
        ...style 
      }} 
    />
  )
}
