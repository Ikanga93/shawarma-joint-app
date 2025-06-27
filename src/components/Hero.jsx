import React from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const Hero = () => {
  const scrollToMenu = () => {
    const element = document.getElementById('menu')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <video 
          className="hero-video"
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/uploads/AQOsfkEx4xl7G1hGSxJ_aTOvw8jTm0LbzkCpiv0PvwgUBHwVA2ow-zlZTd3CKZf7L2sRi8NJcgtGiRFz4zjtk28A.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="hero-overlay"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span>Shawarma Joint</span>
            </h1>
            <p className="hero-subtitle">
              From our kitchen to your plate - the best Mediterranean food (and the largest portions 👀) in Champaign-Urbana
            </p>
            
            <div className="hero-buttons">
              <Link to="/menu" className="btn btn-primary btn-large">
                Order Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 