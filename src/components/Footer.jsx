import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, Facebook } from 'lucide-react'
import Logo from './Logo'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Logo size={60} className="footer-logo-image" />
              <div className="footer-brand-text">
                <h3>Shawarma Joint</h3>
                <p>Authentic Mediterranean cuisine made with love and tradition.</p>
              </div>
            </div>
            <div className="footer-emoji">🌮❤️🇲🇽</div>
          </div>
          
          <div className="footer-links">
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/menu">Menu</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/catering">Events</Link></li>
                <li><Link to="/location">Location</Link></li>
              </ul>
            </div>
            
            <div className="footer-section"> 
              <div className="business-hours">
                <h4>Hours</h4>
                <p>Mon-Thu: 11AM-9PM</p>
                <p>Fri-Sat: 11AM-10PM</p>
                <p>Sun: 12PM-8PM</p>
              </div>
            </div>

            <div className="footer-section">
              <h4>Connect With Us</h4>
              <div className="contact-icons">
                <a href="mailto:mosrestaurant19@gmail.com" className="contact-icon-link" title="Email us">
                  
                </a>
                <a href="https://www.facebook.com/profile.php?id=100066724737090" target="_blank" rel="noopener noreferrer" className="contact-icon-link" title="Follow us on Facebook">
                  
                </a>
                <a href="https://www.instagram.com/shawarmajoinchampaign" target="_blank" rel="noopener noreferrer" className="contact-icon-link" title="Follow us on Instagram">
                  
                </a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Services</h4>
              <ul>
                <li>Dine-in</li>
                <li>Takeout</li>
                <li>In-store pickup</li>
                <li>Catering</li>
                <li>Private Events</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Shawarma Joint Restaurant. Made with ❤️ and Mediterranean flavor!</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 