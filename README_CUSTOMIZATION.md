# Multi-Location Food Business Platform

This platform is designed to support food businesses with multiple locations, including food trucks, restaurants, or hybrid operations. One codebase can be customized for different business types and locations.

## 🏗️ Architecture Overview

### Core Components
- **Business Configuration System** (`src/config/businessConfig.js`)
- **Business Context Provider** (`src/context/BusinessContext.jsx`)
- **Location Selector** (`src/components/LocationSelector.jsx`)
- **Dynamic Header/Footer** (uses business config)

## 🎯 Business Types Supported

### 1. Food Truck Only
```javascript
businessType: BUSINESS_TYPES.FOOD_TRUCK
```
- Mobile locations with variable schedules
- Social media location tracking
- Event-based scheduling

### 2. Restaurant Only
```javascript
businessType: BUSINESS_TYPES.RESTAURANT
```
- Fixed locations with set hours
- Address-based locations
- Reservation systems (optional)

### 3. Hybrid Business
```javascript
businessType: BUSINESS_TYPES.BOTH
```
- Multiple food trucks + restaurant locations
- Location selector in header
- Different features per location

## 🔧 Customization Guide

### Step 1: Business Identity
Edit `src/config/businessConfig.js`:

```javascript
export const businessConfig = {
  businessName: "Your Business Name",
  tagline: "Your Tagline",
  businessType: BUSINESS_TYPES.BOTH, // or FOOD_TRUCK, RESTAURANT
  
  // Branding colors
  colors: {
    primary: "#D32F2F",      // Main brand color
    secondary: "#388E3C",    // Secondary color
    accent: "#FFC107",       // Accent color
    cream: "#FFF8E1",        // Background
    darkBrown: "#3E2723"     // Text
  }
}
```

### Step 2: Configure Locations

#### Food Truck Example:
```javascript
{
  id: 'truck-1',
  name: "Mario's Pizza Truck",
  type: LOCATION_TYPES.MOBILE,
  description: "Wood-fired pizza on wheels",
  isActive: true,
  isPrimary: true,
  schedule: {
    type: 'variable',
    note: "Follow us on Instagram for daily locations!"
  },
  contact: {
    phone: "(555) 123-PIZZA",
    trackingMethod: "social_media"
  }
}
```

#### Restaurant Example:
```javascript
{
  id: 'restaurant-downtown',
  name: "Mario's Pizzeria - Downtown",
  type: LOCATION_TYPES.FIXED,
  description: "Full-service restaurant with expanded menu",
  isActive: true,
  isPrimary: false,
  address: {
    street: "123 Main Street",
    city: "Your City",
    state: "ST",
    zip: "12345",
    coordinates: { lat: 40.1164, lng: -88.2434 }
  },
  schedule: {
    type: 'fixed',
    hours: {
      monday: { open: "11:00", close: "21:00", closed: false },
      tuesday: { open: "11:00", close: "21:00", closed: false },
      // ... other days
      sunday: { open: "12:00", close: "20:00", closed: false }
    }
  },
  contact: {
    phone: "(555) 123-DINE"
  },
  features: ["dine_in", "takeout", "delivery", "catering"]
}
```

### Step 3: Enable/Disable Features
```javascript
features: {
  onlineOrdering: true,    // Show cart and ordering
  catering: true,          // Show catering page
  delivery: false,         // Delivery options
  reservations: false,     // Table reservations
  loyaltyProgram: false,   // Loyalty system
  giftCards: false,        // Gift card sales
  mobileApp: false         // Mobile app promotion
}
```

### Step 4: Customize Menu Configuration
```javascript
menu: {
  showPrices: true,        // Display prices
  showIngredients: true,   // Show ingredient lists
  showNutrition: false,    // Nutrition information
  showAllergens: false,    // Allergen warnings
  allowCustomization: true, // Menu customization
  showImages: true         // Food images
}
```

### Step 5: Configure Catering (if applicable)
```javascript
catering: {
  enabled: true,
  minimumOrder: 50,        // Minimum guest count
  advanceNotice: "48 hours", // Booking notice
  serviceRadius: "30 miles", // Service area
  packages: [
    {
      name: "Basic Package",
      price: 12,
      description: "Essential catering option"
    },
    {
      name: "Premium Package",
      price: 25,
      description: "Full-service catering",
      featured: true
    }
  ]
}
```

## 🎨 Branding Customization

### Logo Options
```javascript
logo: {
  type: 'svg',           // 'svg', 'image', or 'text'
  showInHeader: true,    // Display in header
  showInFooter: true     // Display in footer
}
```

### Color Scheme
Update CSS variables in `src/index.css`:
```css
:root {
  --primary-red: #D32F2F;     /* Your primary color */
  --primary-green: #388E3C;   /* Your secondary color */
  --warm-yellow: #FFC107;     /* Your accent color */
  --cream: #FFF8E1;           /* Background color */
  --dark-brown: #3E2723;      /* Text color */
}
```

## 📱 Usage Examples

### Single Food Truck
```javascript
businessType: BUSINESS_TYPES.FOOD_TRUCK,
locations: [
  {
    id: 'truck-1',
    name: "Taco Express",
    type: LOCATION_TYPES.MOBILE,
    isActive: true,
    isPrimary: true
  }
]
```
**Result**: No location selector, mobile-focused features

### Restaurant Chain
```javascript
businessType: BUSINESS_TYPES.RESTAURANT,
locations: [
  {
    id: 'location-1',
    name: "Downtown Location",
    type: LOCATION_TYPES.FIXED,
    isActive: true,
    isPrimary: true
  },
  {
    id: 'location-2', 
    name: "Mall Location",
    type: LOCATION_TYPES.FIXED,
    isActive: true,
    isPrimary: false
  }
]
```
**Result**: Location selector, fixed hours, reservations

### Hybrid Business
```javascript
businessType: BUSINESS_TYPES.BOTH,
locations: [
  {
    id: 'truck-1',
    type: LOCATION_TYPES.MOBILE,
    isActive: true,
    isPrimary: true
  },
  {
    id: 'restaurant-1',
    type: LOCATION_TYPES.FIXED,
    isActive: true,
    isPrimary: false
  }
]
```
**Result**: Full location selector, mixed features

## 🔄 Dynamic Features

### Location-Aware Components
- **Header**: Shows location selector when multiple locations
- **Contact Info**: Uses current location's contact details
- **Hours Display**: Shows appropriate schedule type
- **Features**: Enables/disables based on location capabilities

### Context Usage in Components
```javascript
import { useBusinessConfig } from '../context/BusinessContext'

const MyComponent = () => {
  const { 
    config, 
    currentLocation, 
    hasMultipleLocations,
    switchLocation 
  } = useBusinessConfig()
  
  return (
    <div>
      <h1>{config.businessName}</h1>
      {hasMultipleLocations && <LocationSelector />}
      <p>Current: {currentLocation?.name}</p>
    </div>
  )
}
```

## 🚀 Deployment Scenarios

### Scenario 1: Single Business, Multiple Brands
- Deploy separate instances with different configs
- Each brand has its own domain/subdomain
- Shared codebase, different `businessConfig.js`

### Scenario 2: Franchise System
- Central configuration management
- Location-specific overrides
- API-driven configuration updates

### Scenario 3: White-Label Platform
- Environment-based configuration
- Database-driven business settings
- Multi-tenant architecture

## 📋 Quick Setup Checklist

1. **✅ Update Business Identity**
   - Business name and tagline
   - Contact information
   - Social media links

2. **✅ Configure Locations**
   - Add all business locations
   - Set primary location
   - Configure schedules and addresses

3. **✅ Enable Features**
   - Online ordering
   - Catering services
   - Delivery options

4. **✅ Customize Branding**
   - Update color scheme
   - Replace logo
   - Modify styling

5. **✅ Update Menu**
   - Add menu items
   - Set pricing
   - Configure categories

6. **✅ Test Location Switching**
   - Verify location selector works
   - Check feature availability per location
   - Test contact information updates

## 🔧 Advanced Customization

### Environment-Specific Configs
```javascript
// Development
const devConfig = {
  apiUrl: 'http://localhost:3001',
  enableDebug: true
}

// Production
const prodConfig = {
  apiUrl: 'https://api.yourbusiness.com',
  enableDebug: false
}
```

### API Integration
```javascript
// Fetch locations from API
const fetchLocations = async () => {
  const response = await fetch(`${apiUrl}/locations`)
  return response.json()
}
```

This platform provides a solid foundation for any food business, from single food trucks to multi-location restaurant chains. The configuration-driven approach ensures easy customization while maintaining code reusability. 