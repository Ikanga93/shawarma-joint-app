import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { BusinessProvider } from './context/BusinessContext'
import { CartProvider } from './context/CartContext'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Cart from './components/Cart'
import CustomerProtectedRoute from './components/CustomerProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import LocationPage from './pages/LocationPage'
import AboutPage from './pages/AboutPage'
import CateringPage from './pages/CateringPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminRegisterPage from './pages/AdminRegisterPage'
import Dashboard from './pages/Dashboard'
import OrdersPage from './pages/OrdersPage'
import OrderTracking from './pages/OrderTracking'
import OrderConfirmation from './pages/OrderConfirmation'
import OrderSuccessPage from './pages/OrderSuccessPage'
import Checkout from './pages/Checkout'
import NotFound from './pages/NotFound'

// Component to conditionally render customer layout
const AppContent = () => {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const location = useLocation()

  // Check if current route is an admin page
  const isAdminPage = location.pathname.startsWith('/dashboard') || 
                     location.pathname.startsWith('/admin')

  // Check if we should open cart on menu page (when redirected from login)
  useEffect(() => {
    if (location.pathname === '/menu' && location.state?.openCheckout) {
      setIsCartOpen(true)
      // Clear the state to prevent reopening on subsequent navigations
      window.history.replaceState({}, document.title)
    }
  }, [location])

  console.log('App component rendering...')

  const handleCartOpen = () => {
    setIsCartOpen(true)
  }

  const handleCartClose = () => {
    setIsCartOpen(false)
  }

  return (
      <div className="App">
      {/* Only show customer header on customer pages */}
      {!isAdminPage && (
        <Header 
          onCartOpen={handleCartOpen}
        />
      )}
        
        <Routes>
          <Route 
            path="/" 
            element={<HomePage />} 
          />
          <Route 
            path="/menu" 
            element={<MenuPage />} 
          />
        <Route 
          path="/about" 
          element={<AboutPage />} 
        />
        <Route 
          path="/catering" 
          element={<CateringPage />} 
        />
          <Route 
            path="/location" 
            element={<LocationPage />} 
          />
        <Route 
          path="/login" 
          element={<LoginPage />} 
        />
        <Route 
          path="/register" 
          element={<RegisterPage />} 
        />
        <Route 
          path="/admin/login" 
          element={<AdminLoginPage />} 
        />
        <Route 
          path="/admin/register" 
          element={<AdminRegisterPage />} 
        />
        <Route 
          path="/cart" 
          element={<Cart />} 
        />
        <Route 
          path="/checkout" 
          element={<Checkout />} 
        />
        <Route 
          path="/order-confirmation/:orderId" 
          element={<OrderConfirmation />} 
        />
        <Route 
          path="/order-tracking/:orderId" 
          element={<OrderTracking />} 
        />
        <Route 
          path="/order-tracking" 
          element={<OrderTracking />} 
        />
        <Route 
          path="/orders" 
          element={
            <CustomerProtectedRoute>
              <OrdersPage />
            </CustomerProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <AdminProtectedRoute>
              <Dashboard />
            </AdminProtectedRoute>
          } 
        />
        <Route 
          path="/order-success" 
          element={<OrderSuccessPage />} 
        />
        <Route 
          path="*" 
          element={<NotFound />} 
        />
        </Routes>
        
      {/* Only show customer footer on customer pages */}
      {!isAdminPage && <Footer />}
        
      {/* Only show cart on customer pages */}
      {!isAdminPage && (
        <Cart 
          isOpen={isCartOpen}
          onClose={handleCartClose}
        />
      )}
      </div>
  )
}

function App() {
  try {
    return (
      <BusinessProvider>
        <CartProvider>
          <CustomerAuthProvider>
            <AdminAuthProvider>
              <Router>
                <AppContent />
              </Router>
            </AdminAuthProvider>
          </CustomerAuthProvider>
        </CartProvider>
      </BusinessProvider>
    )
  } catch (error) {
    console.error('Error in App component:', error)
    return (
      <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
        <h1 style={{ color: 'red' }}>Error in App Component</h1>
        <p>Error: {error.message}</p>
        <pre>{error.stack}</pre>
      </div>
    )
  }
}

export default App 