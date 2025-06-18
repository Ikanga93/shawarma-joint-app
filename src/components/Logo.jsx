import React from 'react'

const Logo = ({ size = 50, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ borderRadius: '10px' }}
    >
      {/* Background circle */}
      <circle cx="100" cy="100" r="95" fill="#FFF8E1" stroke="#FFD700" strokeWidth="3"/>
      
      {/* Burrito Body - Main yellow body */}
      <ellipse cx="100" cy="120" rx="45" ry="60" fill="#FFD700"/>
      <ellipse cx="100" cy="120" rx="40" ry="55" fill="#FFC107"/>
      
      {/* Burrito texture lines */}
      <path d="M70 90 Q100 85 130 90" stroke="#FF8F00" strokeWidth="2" fill="none"/>
      <path d="M65 110 Q100 105 135 110" stroke="#FF8F00" strokeWidth="2" fill="none"/>
      <path d="M70 130 Q100 125 130 130" stroke="#FF8F00" strokeWidth="2" fill="none"/>
      <path d="M75 150 Q100 145 125 150" stroke="#FF8F00" strokeWidth="2" fill="none"/>
      
      {/* Hat - Tan/beige color */}      
      <ellipse cx="100" cy="45" rx="35" ry="12" fill="#DEB887"/>
      <rect x="70" y="35" width="60" height="15" fill="#DEB887"/>
      <ellipse cx="100" cy="35" rx="30" ry="10" fill="#F5DEB3"/>
      
      {/* Hat band */}
      <rect x="70" y="40" width="60" height="4" fill="#8B4513"/>
      
      {/* Sunglasses */}
      <ellipse cx="85" cy="75" rx="12" ry="8" fill="#2E2E2E" stroke="#000" strokeWidth="2"/>
      <ellipse cx="115" cy="75" rx="12" ry="8" fill="#2E2E2E" stroke="#000" strokeWidth="2"/>
      <rect x="97" y="73" width="6" height="4" fill="#2E2E2E"/>
      
      {/* Sunglasses reflection */}
      <ellipse cx="82" cy="72" rx="3" ry="2" fill="#87CEEB" opacity="0.7"/>
      <ellipse cx="112" cy="72" rx="3" ry="2" fill="#87CEEB" opacity="0.7"/>
      
      {/* Happy smile */}
      <path d="M80 95 Q100 110 120 95" stroke="#FF6347" strokeWidth="4" fill="none"/>
      
      {/* Arms */}
      <ellipse cx="55" cy="100" rx="8" ry="20" fill="#FFD700" transform="rotate(-20 55 100)"/>
      <ellipse cx="145" cy="100" rx="8" ry="20" fill="#FFD700" transform="rotate(20 145 100)"/>
      
      {/* Hands */}
      <circle cx="50" cy="85" r="6" fill="#FFC107"/>
      <circle cx="150" cy="85" r="6" fill="#FFC107"/>
      
      {/* Legs */}
      <ellipse cx="85" cy="175" rx="8" ry="15" fill="#FFD700"/>
      <ellipse cx="115" cy="175" rx="8" ry="15" fill="#FFD700"/>
      
      {/* Feet */}
      <ellipse cx="85" cy="190" rx="10" ry="5" fill="#FF8F00"/>
      <ellipse cx="115" cy="190" rx="10" ry="5" fill="#FF8F00"/>
      
      {/* Mo's text */}
      <text x="100" y="25" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="#2E7D32">Mo's</text>
      
      {/* Small decorative elements around the character */}
      <text x="30" y="60" fontSize="12">🌮</text>
      <text x="170" y="60" fontSize="12">🌮</text>
      <text x="20" y="120" fontSize="10">🌶️</text>
      <text x="180" y="120" fontSize="10">🌶️</text>
      <text x="40" y="170" fontSize="8">☀️</text>
      <text x="160" y="170" fontSize="8">☀️</text>
    </svg>
  )
}

export default Logo 