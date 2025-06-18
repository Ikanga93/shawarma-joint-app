import React, { useState } from 'react'
import { Send, Phone, Mail } from 'lucide-react'
import './EventBooking.css'

const EventBooking = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    guestCount: '',
    specialRequests: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Event booking submitted:', formData)
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      guestCount: '',
      specialRequests: ''
    })
    alert('¡Gracias! Your event booking request has been submitted. We\'ll contact you within 24 hours to confirm details!')
  }

  return (
    <section id="event-booking" className="event-booking section">
      <div className="container">
        <div className="booking-header">
          <h2 className="section-title">Book Us for Your Event</h2>
          <p className="section-subtitle">
            Have Fernando's food truck at your next event! We bring delicious Mexican food directly to you.
          </p>
        </div>

        <div className="booking-content">
          <div className="booking-info">
            <h3>Event Booking</h3>
            <p>Fill out the form to request Fernando's food truck for your event. We'll get back to you with availability and details.</p>
            
            <div className="contact-info">
              <h4>Questions? Contact Us Directly:</h4>
              <div className="contact-methods">
                <a href="tel:+12172550210" className="contact-method">
                  <Phone size={18} />
                  (217) 255-0210
                </a>
                <a href="mailto:Fernandosfoodtruck1@gmail.com" className="contact-method">
                  <Mail size={18} />
                  Fernandosfoodtruck1@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="booking-form">
            <h3>Event Request</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name *"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email *"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number *"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Event Type *</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="corporate">Corporate Event</option>
                    <option value="wedding">Wedding/Reception</option>
                    <option value="school">School Event</option>
                    <option value="community">Community Gathering</option>
                    <option value="festival">Festival/Fair</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="date"
                    name="eventDate"
                    placeholder="Event Date *"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <input
                    type="number"
                    name="guestCount"
                    placeholder="Expected Guest Count *"
                    value={formData.guestCount}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <textarea
                  name="specialRequests"
                  placeholder="Tell us about your event and any special requests"
                  rows="3"
                  value={formData.specialRequests}
                  onChange={handleChange}
                ></textarea>
              </div>
              
              <button type="submit" className="btn btn-primary btn-large">
                <Send size={20} />
                Submit Event Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EventBooking 