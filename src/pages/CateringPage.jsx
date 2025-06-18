import React, { useState } from 'react'
import { Users, Calendar, MapPin, Clock, Send, Phone, Mail, Star, Award, Heart } from 'lucide-react'
import './CateringPage.css'

const CateringPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    location: '',
    guestCount: '',
    duration: '',
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
    console.log('Catering request submitted:', formData)
    setFormData({
      name: '',
      email: '',
      phone: '',
      eventType: '',
      eventDate: '',
      eventTime: '',
      location: '',
      guestCount: '',
      duration: '',
      specialRequests: ''
    })
    alert('¡Gracias! Your catering request has been submitted. We\'ll contact you within 24 hours with a custom quote!')
  }

  return (
    <div className="catering-page">
      <div className="catering-hero">
        <div className="container">
          <h1 className="page-title">Catering Services</h1>
          <p className="page-subtitle">
            Bring authentic Mexican flavors to your special occasion! Perfect for parties, 
            corporate events, weddings, and community gatherings.
          </p>
        </div>
      </div>

      <section className="catering-services section">
        <div className="container">
          <h2 className="section-title">Why Choose Mo's Burritos Catering?</h2>
          
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <Users />
              </div>
              <h3>Any Size Event</h3>
              <p>From intimate gatherings of 20 to large events of 500+ guests. We scale our service to meet your needs.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Calendar />
              </div>
              <h3>Flexible Scheduling</h3>
              <p>Available for breakfast, lunch, dinner, or all-day events. We work around your schedule.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <MapPin />
              </div>
              <h3>Full Mobile Setup</h3>
              <p>We bring everything needed - our truck, equipment, staff, and authentic Mexican atmosphere.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Heart />
              </div>
              <h3>Authentic Recipes</h3>
              <p>Traditional family recipes passed down through generations, made with the freshest ingredients.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Award />
              </div>
              <h3>Award-Winning Quality</h3>
              <p>Best Food Truck 2023 - City Food Awards. Your guests will experience the same quality that won us recognition.</p>
            </div>

            <div className="service-card">
              <div className="service-icon">
                <Star />
              </div>
              <h3>Professional Service</h3>
              <p>Experienced catering team ensures smooth service and happy guests at every event.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="catering-packages section">
        <div className="container">
          <h2 className="section-title">Catering Packages</h2>
          
          <div className="packages-grid">
            <div className="package-card">
              <h3>Taco Bar Package</h3>
              <div className="package-price">Starting at $12/person</div>
              <ul className="package-features">
                <li>Choice of 3 meat options</li>
                <li>Fresh corn & flour tortillas</li>
                <li>Traditional toppings bar</li>
                <li>Rice & beans</li>
                <li>Chips & salsa</li>
                <li>Setup & cleanup included</li>
              </ul>
              <div className="package-note">Minimum 25 people</div>
            </div>

            <div className="package-card featured">
              <div className="package-badge">Most Popular</div>
              <h3>Fiesta Package</h3>
              <div className="package-price">Starting at $18/person</div>
              <ul className="package-features">
                <li>Choice of 4 meat options</li>
                <li>Quesadillas & nachos</li>
                <li>Fresh guacamole</li>
                <li>Mexican rice & refried beans</li>
                <li>Chips, salsa & queso</li>
                <li>Churros for dessert</li>
                <li>Full service staff</li>
              </ul>
              <div className="package-note">Minimum 50 people</div>
            </div>

            <div className="package-card">
              <h3>Premium Package</h3>
              <div className="package-price">Starting at $25/person</div>
              <ul className="package-features">
                <li>Full menu selection</li>
                <li>Premium meat options</li>
                <li>Specialty items (tamales, etc.)</li>
                <li>Fresh fruit agua frescas</li>
                <li>Dessert selection</li>
                <li>Decorative setup</li>
                <li>Dedicated event coordinator</li>
              </ul>
              <div className="package-note">Minimum 75 people</div>
            </div>
          </div>
        </div>
      </section>

      <section className="event-types section">
        <div className="container">
          <h2 className="section-title">Perfect For Any Occasion</h2>
          
          <div className="event-types-grid">
            <div className="event-type">
              <div className="event-emoji">🎉</div>
              <h4>Birthday Parties</h4>
              <p>Make birthdays memorable with authentic Mexican flavors</p>
            </div>
            
            <div className="event-type">
              <div className="event-emoji">💼</div>
              <h4>Corporate Events</h4>
              <p>Impress clients and employees with professional catering</p>
            </div>
            
            <div className="event-type">
              <div className="event-emoji">💒</div>
              <h4>Weddings</h4>
              <p>Add authentic Mexican cuisine to your special day</p>
            </div>
            
            <div className="event-type">
              <div className="event-emoji">🏫</div>
              <h4>School Events</h4>
              <p>Popular with students and staff for fundraisers and celebrations</p>
            </div>
            
            <div className="event-type">
              <div className="event-emoji">🏘️</div>
              <h4>Community Events</h4>
              <p>Bring neighborhoods together with delicious food</p>
            </div>
            
            <div className="event-type">
              <div className="event-emoji">🎪</div>
              <h4>Festivals</h4>
              <p>Perfect for outdoor events and large gatherings</p>
            </div>
          </div>
        </div>
      </section>

      <section className="catering-form section">
        <div className="container">
          <div className="form-content">
            <div className="form-info">
              <h2>Get Your Custom Quote</h2>
              <p>Fill out the form below and we'll provide you with a detailed quote within 24 hours.</p>
              
              <div className="contact-info">
                <h4>Questions? Contact Us Directly:</h4>
                <div className="contact-methods">
                  <a href="tel:+12176078131" className="contact-method">
                    <Phone size={18} />
                    (217) 607-8131
                  </a>
                  <a href="mailto:mosrestaurant19@gmail.com" className="contact-method">
                    <Mail size={20} />
                    mosrestaurant19@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="catering-form-container">
              <form onSubmit={handleSubmit} className="catering-form-form">
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
                      type="time"
                      name="eventTime"
                      placeholder="Event Time *"
                      value={formData.eventTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="location"
                    placeholder="Event Location/Address *"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
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
                  
                  <div className="form-group">
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Service Duration *</option>
                      <option value="2-hours">2 Hours</option>
                      <option value="3-hours">3 Hours</option>
                      <option value="4-hours">4 Hours</option>
                      <option value="full-day">Full Day</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <textarea
                    name="specialRequests"
                    placeholder="Special Requests, Dietary Restrictions, or Additional Information"
                    rows="4"
                    value={formData.specialRequests}
                    onChange={handleChange}
                  ></textarea>
                </div>
                
                <button type="submit" className="btn btn-primary btn-large">
                  <Send size={20} />
                  Request Catering Quote
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CateringPage 