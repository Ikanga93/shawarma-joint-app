import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Hero.css'

const Hero = () => {
  const videoRef = useRef(null)

  const scrollToMenu = () => {
    const element = document.getElementById('menu')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Ensure video plays on all devices
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Set video properties for better mobile support
      video.setAttribute('playsinline', 'true')
      video.setAttribute('webkit-playsinline', 'true')
      
      // Force play after component mounts
      const playVideo = async () => {
        try {
          await video.play()
        } catch (error) {
          console.log('Video autoplay prevented:', error)
          // If autoplay fails, we can show a play button or handle gracefully
        }
      }

      // Try to play video when it's loaded
      if (video.readyState >= 2) {
        playVideo()
      } else {
        video.addEventListener('loadeddata', playVideo)
      }

      // Handle visibility change to restart video
      const handleVisibilityChange = () => {
        if (!document.hidden && video.paused) {
          playVideo()
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        video.removeEventListener('loadeddata', playVideo)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <video 
          ref={videoRef}
          className="hero-video"
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onLoadedData={() => {
            // Additional attempt to play when video data is loaded
            if (videoRef.current) {
              videoRef.current.play().catch(console.log)
            }
          }}
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