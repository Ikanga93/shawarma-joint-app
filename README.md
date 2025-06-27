# 🥙 Shawarma Joint - Mediterranean Restaurant App

A modern, full-stack restaurant web application for **Shawarma Joint**, a Mediterranean restaurant in Champaign-Urbana. Built with React, Supabase, and deployed on Vercel.

![Shawarma Joint](public/shawarma-joint-logo.jpg)

## 🌟 Features

### 🍽️ Customer Experience
- **Beautiful Homepage** with video background and modern design
- **Interactive Menu** with categories (Shawarma, Kebabs, Mediterranean Plates, etc.)
- **User Authentication** - Register, login, and manage account
- **Shopping Cart** with real-time updates
- **Order Placement** with customer information
- **Responsive Design** - works on all devices
- **Real Customer Reviews** from Google Reviews

### 🎨 Design & Branding
- **Custom Logo Integration** with brand colors
- **Mediterranean Theme** with green (#7CB342) and orange-red (#FF5722) color scheme
- **Professional Typography** with gradient effects
- **Video Background** for engaging hero section
- **Modern UI/UX** following best practices

### 🔧 Technical Features
- **React 18** with modern hooks and functional components
- **Supabase Backend** for database, authentication, and real-time features
- **Row Level Security** for data protection
- **Responsive CSS** with mobile-first approach
- **Environment Configuration** for development and production
- **SEO Optimized** with proper meta tags

## 🏗️ Tech Stack

### Frontend
- **React 18** - Modern JavaScript framework
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons
- **CSS3** - Custom styling with flexbox and grid

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Auto-generated APIs

### Deployment
- **Vercel** - Frontend hosting and deployment
- **GitHub** - Version control and CI/CD

### Development Tools
- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting
- **Concurrently** - Run multiple commands

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/shawarma-joint-app.git
   cd shawarma-joint-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp env.example .env
   
   # Edit .env with your Supabase credentials
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor
   - Get your project URL and API key from Settings > API

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Your app should now be running locally!

## 🌐 Deployment

This app is designed to be deployed using **Supabase + Vercel** for the best developer experience and performance.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/shawarma-joint-app)

### Manual Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Quick Steps:**
1. Create a Supabase project and run the schema
2. Push your code to GitHub
3. Connect your GitHub repo to Vercel
4. Add environment variables in Vercel
5. Deploy!

## 📊 Database Schema

The app uses a comprehensive database schema with the following main tables:

- **users** - User profiles and authentication
- **menu_categories** - Menu organization (Shawarma, Kebabs, etc.)
- **menu_items** - Individual menu items with pricing
- **orders** - Customer orders with status tracking
- **order_items** - Individual items within orders
- **customer_profiles** - Extended customer information

All tables include Row Level Security (RLS) policies for data protection.

## 🎯 Business Information

**Shawarma Joint**
- **Address**: 627 East Green Street, Champaign, IL
- **Phone**: (217) 552-1320
- **Email**: info@shawarmajointerestaurant.com
- **Facebook**: [ShawarmaJointCU](https://www.facebook.com/ShawarmaJointCU/)
- **Cuisine**: Mediterranean
- **Tagline**: "From our kitchen to your plate - the best Mediterranean food (and the largest portions 👀) in Champaign-Urbana"

## 🛠️ Development

### Project Structure
```
shawarma-joint-app/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── lib/              # Utilities and configurations
│   ├── config/           # Business configuration
│   └── assets/           # Images, videos, etc.
├── supabase-schema.sql   # Database schema
├── vercel.json          # Vercel configuration
└── DEPLOYMENT.md        # Deployment guide
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Stripe for payments
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# App Configuration
VITE_APP_NAME=Shawarma Joint
VITE_APP_URL=http://localhost:5173
```

## 🎨 Customization

### Branding
- Logo: Replace `public/shawarma-joint-logo.jpg`
- Colors: Update CSS custom properties in `src/index.css`
- Business info: Edit `src/config/businessConfig.js`

### Menu
- Add/edit menu items in Supabase dashboard
- Categories and items are managed through the database
- Images can be stored in Supabase Storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Real Customer Reviews** from Google Reviews
- **DiceBear Personas** for avatar generation
- **Supabase** for amazing backend services
- **Vercel** for seamless deployment
- **React Community** for excellent documentation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/shawarma-joint-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/shawarma-joint-app/discussions)
- **Email**: your-email@example.com

---

**Made with ❤️ for Shawarma Joint** - Serving the best Mediterranean food in Champaign-Urbana!
