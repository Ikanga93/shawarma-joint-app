import React from 'react'
import { Heart, Award, Users } from 'lucide-react'
import './About.css'

const About = () => {
  return (
    <section id="about" className="about section">
      <div className="container">
        <div className="about-content">
          <div className="about-text">
            <h2 className="section-title">About Fernando's</h2>
            <p className="about-story">
              Founded in 2018 by Fernando Gonzalez, our food truck brings the authentic 
              flavors of Guadalajara to your neighborhood. Fernando learned these recipes 
              from his grandmother, who ran a small taqueria in Mexico for over 40 years.
            </p>
            <p className="about-story">
              Every dish is prepared with the same love and attention to detail that has 
              been passed down through generations. We use only the freshest ingredients 
              and traditional cooking methods to ensure every bite transports you to Mexico.
            </p>
            
            <div className="about-features">
              <div className="feature">
                <div className="feature-icon">
                  <Heart />
                </div>
                <div className="feature-content">
                  <h3>Made with Love</h3>
                  <p>Every dish prepared with passion and traditional family recipes</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature-icon">
                  <Award />
                </div>
                <div className="feature-content">
                  <h3>Award Winning</h3>
                  <p>Best Food Truck 2023 - City Food Awards</p>
                </div>
              </div>
              
              <div className="feature">
                <div className="feature-icon">
                  <Users />
                </div>
                <div className="feature-content">
                  <h3>Community Favorite</h3>
                  <p>Proudly serving our community for over 5 years</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="about-image">
            <div className="chef-illustration">
              👨‍🍳🇲🇽
            </div>
            <div className="quote">
              <p>"La comida es amor hecho visible"</p>
              <span>- Fernando Gonzalez</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About 