import React from 'react'
import Hero from '../components/Hero'
import Contact from '../components/Contact'

const HomePage = () => {
  return (
    <>
      <Hero />
      
      {/* Customer Testimonials Section */}
      <section className="testimonials section">
        <div className="container">
          <h2 className="section-title">What Our Customers Say</h2>
          <p className="section-subtitle">
            Don't just take our word for it - hear from our satisfied customers
          </p>
          
          <div className="reviews-container">
            <div className="reviews-scroll">
              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Dave&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=50" alt="Dave" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Dave</strong>
                    <span>2 reviews · 3 photos</span>
                    <div className="review-time">a week ago</div>
                  </div>
                </div>
                <p>I really recommend the bowls. They were really good and I loved it. I would definitely come here again. I ate it at home, so the food was not as warm, but if I ate it there it would be hot. Great food!</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Shalini&backgroundColor=ffdfbf,ffd5dc,c0aede&radius=50" alt="Shalini" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Shalini khare</strong>
                    <span>Local Guide · 241 reviews · 2,273 photos</span>
                    <div className="review-time">a month ago</div>
                  </div>
                </div>
                <p>Delicious food with large portion size. They have lots of options to choose from and good variety. Being a vegetarian I was able to enjoy the food with so many varieties. Staff were humble and welcoming. Food was delicious and they have got student discount too.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Claire&backgroundColor=d1d4f9,ffdfbf,c0aede&radius=50" alt="Claire" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Claire Alyese</strong>
                    <span>Local Guide · 11 reviews · 11 photos</span>
                    <div className="review-time">4 months ago</div>
                  </div>
                </div>
                <p>I hadn't been here in a while and was happy I went back recently. The staff was very kind and friendly and they had a new yogurt salad that I hadn't had before! It was a little expensive for me but one portion can be made into several meals for me, so I think it is worth the price! I got the gyros bowl with rice (I probably should've taken a picture before I mixed it, oops)</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Tommy&backgroundColor=b6e3f4,d1d4f9,ffdfbf&radius=50" alt="Tommy" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Tommy Moraga</strong>
                    <span>Local Guide · 88 reviews · 108 photos</span>
                    <div className="review-time">11 months ago</div>
                  </div>
                </div>
                <p>Great spot for quick bite to eat! Had a few different wraps and a bowl. The spicy chicken with spicy rice and potato was on point! The rest was delicious, food was made with fresh ingredients and served hot! When visiting the area I will definitely eat here again!</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Alex&backgroundColor=ffd5dc,b6e3f4,c0aede&radius=50" alt="Alex" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Alex Soja</strong>
                    <span>Local Guide · 42 reviews · 91 photos</span>
                    <div className="review-time">a year ago</div>
                  </div>
                </div>
                <p>I ordered the "make your own wrap" with spicy chicken. Which if you like spicy food, definitely had some kick to it. It comes with four other ingredients you get to choose from and I picked the arabic salad, lettuce, and pickles. For this I paid 10.99 plus tax. The service was really good. I got my food fast and was even given two falafels on the house by the manager.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Michael&backgroundColor=c0aede,ffdfbf,d1d4f9&radius=50" alt="Michael" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Michael Cleary</strong>
                    <span>Local Guide · 80 reviews</span>
                    <div className="review-time">11 months ago</div>
                  </div>
                </div>
                <p>Overall, a good place to stop by for a fast bite. Big portions, so it can be overwhelming if you have big eyes and an empty stomach. We had a mixture of items including the spicy chicken, chicken shawarma and I cannot remember the 3rd item. For a college town, pretty good. For exceptional middle eastern food, meh.</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Rohit&backgroundColor=b6e3f4,ffd5dc,ffdfbf&radius=50" alt="Rohit" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Rohit Ranjan</strong>
                    <span>Local Guide · 181 reviews · 281 photos</span>
                    <div className="review-time">a year ago</div>
                  </div>
                </div>
                <p>Very tasty food and plentiful portion. I came here twice. I tried both chicken and the spicy chicken. Also really like the purple cabbage spiced. I recommend this place when in town! Food: 5</p>
              </div>

              <div className="review-card">
                <div className="review-header">
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=Jonny&backgroundColor=d1d4f9,c0aede,b6e3f4&radius=50" alt="Jonny" className="reviewer-avatar-img" />
                  <div className="reviewer-info">
                    <strong>Jonny1of1</strong>
                    <span>Local Guide · 15 reviews</span>
                    <div className="review-time">3 months ago</div>
                  </div>
                </div>
                <p>Wasn't a fan of this place at first and even told myself I wouldn't come back. But I decided to give it another shot, and I'm so glad I did. Turns out, I was just ordering the wrong things because my third visit was well worth it. The food was incredible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Shawarma Joint Section */}
      <section className="why-choose-us">
        <div className="container text-center">
          <h2 className="section-title">Why Choose Shawarma Joint?</h2>
          <p className="section-subtitle">
            Experience the authentic taste of Mediterranean cuisine
          </p>
          
          <div className="features-container">
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">🏺</div>
                <h3>Traditional Recipes</h3>
                <p>Passed down through three generations of Mediterranean cooking tradition, our recipes are authentic and time-tested.</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🌿</div>
                <h3>Fresh Ingredients</h3>
                <p>We source the freshest local ingredients and authentic Mediterranean spices to ensure every bite is perfect.</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <h3>Award Winning</h3>
                <p>Recognized by the local community for outstanding food quality and exceptional customer service.</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">❤️</div>
                <h3>Made with Love</h3>
                <p>Every dish is prepared with passion and care, bringing you the true taste of Mediterranean with every meal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Award Recognition Section */}
      <section className="award-recognition">
        <div className="container">
          <div className="award-banner">
            <div className="award-icon">🏆</div>
            <div className="award-content">
              <h3 className="award-title">Voted #1 Best Middle Eastern Food</h3>
              <p className="award-subtitle">Champaign-Urbana 2025</p>
              <p className="award-description">
                Recognized by <strong>The Daily Illini</strong> in their annual "Best of CU" awards
              </p>
              <a 
                href="https://dailyillini.com/buzz-stories/best-of-cu/2025/03/06/2025-best-middle-eastern-food/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="award-link btn btn-primary"
              >
                Read Full Article
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Testimonial Section */}
      <section className="featured-testimonial">
        <div className="container">
          <h2 className="section-title">Customer Favorites</h2>
          <p className="section-subtitle">
            See what our customers are raving about - fresh, authentic, and delicious!
          </p>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-image">
                <img src="/uploads/steak-shawar-bowl-image.jpg" alt="Delicious Beef Shawarma Sandwich" />
              </div>
              <div className="testimonial-content">
                <p>
                  Lunchtime delight! Just devoured a divine beef shawarma sandwich! 
                  Overflowing with succulent beef, crisp veggies, and a heavenly tahini drizzle. 
                  Taste buds, meet paradise! 😍
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">🥙</div>
                  <div className="author-info">
                    <h4>Sarah M.</h4>
                    <span>Regular Customer</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-image">
                <img src="/uploads/falafel-bowl-image.jpg" alt="Fresh Falafel Bowl" />
              </div>
              <div className="testimonial-content">
                <p>
                  Dive into our Falafel Bowl! Nestled on a bed of rice, choose between creamy hummus 
                  or crisp lettuce, add your favorite five toppings, and drizzle with your choice of sauce. 
                  Customize your meal for the ultimate flavor experience! ✨
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">🌱</div>
                  <div className="author-info">
                    <h4>Ahmed K.</h4>
                    <span>Food Enthusiast</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Contact />
    </>
  )
}

export default HomePage 