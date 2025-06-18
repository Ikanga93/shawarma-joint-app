# Fernando's Food Truck - Complete Order Management System

A full-stack food truck application with real-time order management, Stripe payment processing, and customer order tracking.

## Features

### Customer Features
- 🌮 Browse menu with real-time availability
- 🛒 Shopping cart with location selection
- 💳 Secure Stripe payment processing
- 📱 Real-time order tracking
- 📍 Multiple pickup locations support

### Restaurant Admin Features
- 📊 Real-time order dashboard
- 🔔 Live order notifications
- ⏱️ Order status management with timers
- 📋 Menu management
- 📍 Location management
- ⚙️ Business settings

### Technical Features
- 🔄 Real-time updates with Socket.IO
- 💾 SQLite database for order storage
- 🔐 Secure admin authentication
- 📱 Responsive design
- 🎨 Modern UI with animations

## Tech Stack

### Frontend
- React 18
- React Router
- Stripe Elements
- Socket.IO Client
- Lucide React Icons
- CSS3 with custom properties

### Backend
- Node.js with Express
- SQLite database
- Stripe API
- Socket.IO
- UUID for order IDs

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Stripe Configuration

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Create a `.env` file in the root directory:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

4. Set the frontend environment variable:

```bash
# For development, create .env.local
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

### 3. Database Setup

The SQLite database will be created automatically when you start the server. No additional setup required.

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
# Backend only
npm run server

# Frontend only (in another terminal)
npm start
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

### For Customers

1. **Browse Menu**: Visit the homepage to see available items
2. **Add to Cart**: Click "Add to Cart" on menu items
3. **Checkout**: 
   - Click the cart icon to open cart
   - Select pickup location
   - Enter customer information
   - Click "Continue to Payment"
4. **Payment**: Enter card details (use Stripe test cards)
5. **Track Order**: Automatically redirected to order tracking page

### For Restaurant Staff

1. **Login**: Visit `/admin-login` or click "Staff" in footer
   - Username: `fernando`
   - Password: `admin123`
2. **Dashboard**: View and manage orders in real-time
3. **Order Management**:
   - Confirm pending orders
   - Start cooking confirmed orders
   - Mark orders as ready
   - Complete orders when picked up

## Stripe Test Cards

Use these test card numbers for development:

- **Successful payment**: 4242 4242 4242 4242
- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any postal code.

## API Endpoints

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (admin)
- `GET /api/orders/:orderId` - Get specific order
- `PATCH /api/orders/:orderId/status` - Update order status

### Payments
- `POST /api/create-payment-intent` - Create Stripe payment intent
- `POST /api/webhook` - Stripe webhook handler

## Real-time Features

The application uses Socket.IO for real-time updates:

- **New orders** appear instantly on admin dashboard
- **Order status changes** update customer tracking in real-time
- **Cooking timers** count down automatically
- **Desktop notifications** for new orders (admin)

## Database Schema

### Orders Table
- `id` - Unique order ID (ORD-XXXXXXXX)
- `customer_name` - Customer name
- `customer_phone` - Customer phone
- `customer_email` - Customer email (optional)
- `items` - JSON array of ordered items
- `subtotal` - Order subtotal
- `tax` - Tax amount
- `total` - Total amount
- `status` - Order status (pending, confirmed, cooking, ready, completed)
- `location_id` - Pickup location ID
- `order_time` - Order timestamp
- `estimated_time` - Estimated preparation time
- `time_remaining` - Remaining cooking time
- `stripe_payment_intent_id` - Stripe payment ID
- `payment_status` - Payment status

## Customization

The application is built with a flexible business configuration system. You can customize:

- Business name and branding
- Menu items and pricing
- Locations and schedules
- Contact information
- Features and capabilities

See `src/config/businessConfig.js` for configuration options.

## Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in your hosting platform

### Backend (Railway/Heroku)
1. Deploy the server folder
2. Set environment variables
3. Configure Stripe webhooks to point to your deployed backend

## Troubleshooting

### Common Issues

1. **Orders not appearing**: Check if backend server is running on port 3001
2. **Payment failing**: Verify Stripe keys are correctly set
3. **Real-time updates not working**: Check Socket.IO connection in browser console
4. **Database errors**: Ensure write permissions in project directory

### Development Tips

- Use browser dev tools to monitor Socket.IO connections
- Check server logs for API errors
- Use Stripe Dashboard to monitor test payments
- Enable browser notifications for order alerts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please contact the development team or create an issue in the repository. # mo-s-burrito-app
