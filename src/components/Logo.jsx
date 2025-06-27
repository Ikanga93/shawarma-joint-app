import React from 'react'

const Logo = ({ size = 50, className = '' }) => {
  return (
    <img 
      src="/uploads/shawarma-joint-logo.jpg"
      alt="Shawarma Joint Logo"
      width={size} 
      height={size} 
      className={className}
      style={{ 
        borderRadius: '10px',
        objectFit: 'contain'
      }}
    />
  )
}

export default Logo 