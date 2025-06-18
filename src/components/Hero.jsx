import React from 'react'
import { MapPin, Clock, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import Logo from './Logo'
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
        <div className="hero-pattern"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              ¡Bienvenidos a <span>Mo's Burritos!</span>
            </h1>
            <p className="hero-subtitle">
              Savor the taste of authentic Mexican and Salvadorian eats made with love and tradition.
            </p>
            
            <div className="hero-buttons">
              <Link to="/menu" className="btn btn-primary btn-large">
                Place Order
              </Link>
            </div>
          </div>

          <div className="hero-image">
            <div className="food-truck-illustration">
              🌮🚚
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 