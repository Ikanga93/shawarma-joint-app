import React from 'react'
import { MapPin, Clock, Calendar } from 'lucide-react'
import './Location.css'

const Location = () => {
  return (
    <section id="location" className="location section">
      <div className="container">
        <h2 className="section-title">Find Us</h2>
        <p className="section-subtitle">
          We're always on the move! Follow us for real-time location updates.
        </p>

        <div className="location-content">
          <div className="location-info">
            <div className="info-card card">
              <h3>Follow Us for Live Updates</h3>
              <p>Get real-time location updates and special announcements!</p>
              <div className="social-links">
                <a href="https://www.facebook.com/FernandosTacosAndMore/" target="_blank" rel="noopener noreferrer" className="social-link">📘 Facebook</a>
                <a href="mailto:Fernandosfoodtruck1@gmail.com" className="social-link">📧 Email Updates</a>
                <a href="tel:+12172550210" className="social-link">📞 Call for Location</a>
              </div>
            </div>

            <div className="contact-card card">
              <h3>Current Location</h3>
              <p>Call us or check our social media for today's location!</p>
              <div className="contact-info">
                <div className="contact-item">
                  <MapPin size={16} />
                  <span>Downtown Food District</span>
                </div>
                <div className="contact-item">
                  <span>📞 (217) 255-0210</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Location 