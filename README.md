# 🥙 Shawarma Joint - Mediterranean Restaurant App

A modern, full-stack restaurant application built with React and Supabase, featuring online ordering, user authentication, and real-time order management.

## 🌟 Features

- **🍽️ Interactive Menu** - Browse Mediterranean dishes with categories and options
- **👤 User Authentication** - Secure registration and login with Supabase Auth
- **🛒 Shopping Cart** - Add items with customization options
- **📱 Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **⚡ Real-time Updates** - Powered by Supabase real-time subscriptions
- **🎨 Modern UI** - Beautiful Mediterranean-themed design
- **📊 Order Management** - Track order history and status

## 🏗️ Tech Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- Lucide React for icons
- CSS3 with modern animations

**Backend:**
- Supabase (Database + Authentication + APIs)
- PostgreSQL database
- Row Level Security (RLS)
- Real-time subscriptions

**Deployment:**
- Vercel (Frontend hosting)
- Supabase (Backend services)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
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
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🗄️ Database Setup

1. Create a new Supabase project
2. Run the SQL schema from `supabase-schema.sql`
3. Get your project URL and anon key from Supabase settings

The schema includes:
- User management with RLS policies
- Menu categories and items
- Order and order items tables
- Sample Mediterranean menu data

## 🌐 Deployment

Deploy in under 15 minutes using our quick setup guide:

- **📋 Quick Setup**: See [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md)
- **📖 Detailed Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

**Architecture**: Frontend on Vercel + Supabase backend

## 📱 Screenshots

### Homepage
- Hero section with video background
- Featured menu items
- Customer testimonials

### Menu
- Categorized Mediterranean dishes
- Item customization options
- Add to cart functionality

### User Dashboard
- Order history
- Account management
- Real-time order tracking

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Route components
├── contexts/        # React contexts (Auth, Cart)
├── lib/            # Supabase client and utilities
├── assets/         # Static assets
└── styles/         # CSS files
```

## 🎨 Customization

### Branding
- Update colors in CSS custom properties
- Replace logo in `src/assets/`
- Modify business information in components

### Menu
- Add/edit items in Supabase dashboard
- Update categories and descriptions
- Upload new food images

### Features
- Add payment processing with Stripe
- Implement real-time notifications
- Add admin dashboard for order management

## 🔒 Security

- **Authentication**: Handled by Supabase Auth
- **Database**: Protected with Row Level Security (RLS)
- **API Keys**: Anon key is safe for browser exposure
- **HTTPS**: Enforced by Vercel

## 📊 Performance

- **Bundle Size**: Optimized with Vite
- **Images**: Lazy loading and optimization
- **Caching**: Browser and CDN caching
- **Real-time**: Efficient WebSocket connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Documentation**: Check the deployment guides
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions

## 🌟 Roadmap

- [ ] Stripe payment integration
- [ ] Admin dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-location support
- [ ] Loyalty program
- [ ] Push notifications

---

**Built with ❤️ for the Mediterranean food community**

*Ready to serve delicious shawarma and kebabs online!* 🥙✨
