import API_BASE_URL from './api.js'

// Business Configuration System
// This allows the same codebase to be used for multiple locations and business types

export const BUSINESS_TYPES = {
  FOOD_TRUCK: 'food_truck',
  RESTAURANT: 'restaurant',
  BOTH: 'both'
}

export const LOCATION_TYPES = {
  MOBILE: 'mobile',        // Food truck - moves around
  FIXED: 'fixed',          // Restaurant - fixed location
  HYBRID: 'hybrid'         // Both food truck and restaurant
}

// Main business configuration
export const businessConfig = {
  // Basic Business Info
  businessName: "Shawarma Joint",
  tagline: "Authentic Mediterranean Cuisine",
  description: "From our kitchen to your plate - the best Mediterranean food (and the largest portions 👀) in Champaign-Urbana. We also offer catering for any type of events.",
  
  // Operating Hours
  hours: {
    monday: "11:00 AM - 9:00 PM",
    tuesday: "11:00 AM - 9:00 PM", 
    wednesday: "11:00 AM - 9:00 PM",
    thursday: "11:00 AM - 9:00 PM",
    friday: "11:00 AM - 10:00 PM",
    saturday: "11:00 AM - 10:00 PM",
    sunday: "12:00 PM - 8:00 PM"
  },

  // Contact Information
  contact: {
    phone: "(217) 552-1320",
    email: "info@shawarmajointerestaurant.com",
    address: {
      street: "627 East Green Street",
      city: "Champaign",
      state: "IL",
      zip: "61820",
      country: "United States"
    },
    facebook: "https://www.facebook.com/profile.php?id=100066724737090",
    instagram: "Burritosmos"
  },

  // Delivery Platforms
  deliveryPlatforms: [
    "DoorDash",
    "Uber Eats", 
    "Grubhub",
    "EzCater"
  ],

  // Locations
  locations: [
    {
      id: 'main-restaurant',
      name: "Shawarma Joint Restaurant",
      type: "restaurant",
      address: {
        street: "627 East Green Street",
        city: "Champaign", 
        state: "IL",
        zip: "61820",
        country: "United States"
      },
      phone: "(217) 552-1320",
      description: "Our main restaurant location offering authentic Mediterranean cuisine with dine-in, takeout, and catering services.",
      coordinates: {
        lat: 40.1106,
        lng: -88.2073
      },
      operatingHours: {
        monday: "11:00 AM - 9:00 PM",
        tuesday: "11:00 AM - 9:00 PM", 
        wednesday: "11:00 AM - 9:00 PM",
        thursday: "11:00 AM - 9:00 PM",
        friday: "11:00 AM - 10:00 PM",
        saturday: "11:00 AM - 10:00 PM",
        sunday: "12:00 PM - 8:00 PM"
      },
      features: ["Dine-in", "Takeout", "In-store pickup", "Catering"],
    },
    {
      id: 'mobile-catering',
      name: "Shawarma Joint - Mobile Catering",
      type: "catering",
      coverage: ["Champaign", "Urbana", "Savoy", "Mahomet"],
      phone: "(217) 552-1320",
      email: "catering@shawarmajointerestaurant.com",
      description: "Mobile catering service bringing authentic Mediterranean flavors to your special events throughout the Champaign-Urbana area.",
      hours: "By Appointment - Events & Catering",
      features: ["Event Catering", "Private Parties", "Corporate Events"],
    }
  ],

  // Menu Categories
  menuCategories: [
    {
      id: 'shawarma',
      name: "Shawarma",
      description: "Authentic Mediterranean shawarma wraps and plates",
      icon: "🥙"
    },
    {
      id: 'kebabs',
      name: "Kebabs", 
      description: "Grilled Mediterranean kebabs and skewers",
      icon: "🍢"
    },
    {
      id: 'mediterranean-plates',
      name: "Mediterranean Plates",
      description: "Traditional Mediterranean dishes and specialties",
      icon: "🍽️"
    },
    {
      id: 2,
      name: "Tacos",
      description: "Traditional tacos with fresh ingredients",
      icon: "🌮"
    },
    {
      id: 3,
      name: "Quesadillas", 
      description: "Grilled flour tortillas with cheese and fillings",
      icon: "🧀"
    },
    {
      id: 4,
      name: "Salvadorian Specialties",
      description: "Authentic Salvadorian dishes and favorites",
      icon: "🫓"
    },
    {
      id: 5,
      name: "Sides & Appetizers",
      description: "Perfect additions to your meal",
      icon: "🥑"
    },
    {
      id: 6,
      name: "Beverages",
      description: "Refreshing drinks and traditional beverages",
      icon: "🥤"
    },
    {
      id: 7,
      name: "Desserts",
      description: "Sweet treats to finish your meal",
      icon: "🍮"
    }
  ],

  // Social Media & Marketing
  social: {
    facebook: "ShawarmaJointChampaign",
    instagram: "ShawarmaJoint",
    email: "mosrestaurant19@gmail.com",
    twitter: "ShawarmaJoint"
  },

  // SEO & Meta
  seo: {
    title: "Shawarma Joint - Authentic Mediterranean Food",
    description: "Shawarma Joint Restaurant offers authentic Mediterranean cuisine in Champaign, IL. Dine-in, takeout, delivery, and catering available.",
    keywords: "Mediterranean food, shawarma, kebabs, Champaign IL, restaurant, catering, delivery, Middle Eastern food"
  },

  // Business Features
  features: {
    onlineOrdering: true,
    delivery: true,
    catering: true,
    mobilePayments: true,
    loyaltyProgram: false,
    giftCards: false
  }
}

// Location-specific configurations
export const getActiveLocations = () => {
  return businessConfig.locations.filter(location => location.isActive)
}

export const getPrimaryLocation = () => {
  return businessConfig.locations.find(location => location.isPrimary)
}

export const getLocationById = (id) => {
  return businessConfig.locations.find(location => location.id === id)
}

// Business type helpers
export const isFoodTruckBusiness = () => {
  return businessConfig.businessType === BUSINESS_TYPES.FOOD_TRUCK || 
         businessConfig.businessType === BUSINESS_TYPES.BOTH
}

export const isRestaurantBusiness = () => {
  return businessConfig.businessType === BUSINESS_TYPES.RESTAURANT || 
         businessConfig.businessType === BUSINESS_TYPES.BOTH
}

export const hasMultipleLocations = () => {
  return getActiveLocations().length > 1
}

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development'
  
  const envConfigs = {
    development: {
      apiUrl: 'http://localhost:3001',
      enableDebug: true
    },
    production: {
      apiUrl: API_BASE_URL,
      enableDebug: false
    }
  }
  
  return envConfigs[env] || envConfigs.development
} 