import React, { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import './MenuPage.css'

const MenuPage = () => {
  const { addToCart, updateQuantity, cartItems } = useCart()
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [menuItems, setMenuItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching menu items from Supabase')
        
        // Fetch menu items with their categories
        const { data: menuItemsData, error: menuError } = await supabase
          .from('menu_items')
          .select(`
            *,
            menu_categories (
              name
            )
          `)
          .eq('available', true)
          .order('display_order', { ascending: true })

        if (menuError) {
          throw menuError
        }

        // Transform the data to match the expected format
        const processedData = menuItemsData.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
          category: item.menu_categories?.name || 'Other',
          image_url: item.image_url,
          emoji: item.emoji,
          available: item.available
        }))
        
        setMenuItems(processedData)
      } catch (err) {
        console.error('Error loading menu items:', err)
        setError('Failed to load menu items. Please try again later.')
        setMenuItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadMenuItems()
  }, [])

  // Get unique categories from menu items
  const categories = [
    { id: 'all', name: 'All Items', emoji: '🍽️' },
    ...Array.from(new Set(menuItems.map(item => item.category)))
      .map(category => ({
        id: category.toLowerCase(),
        name: category,
        emoji: getCategoryEmoji(category)
      }))
  ]

  function getCategoryEmoji(category) {
    const emojiMap = {
      'Tacos': '🌮',
      'Burritos': '🌯',
      'Breakfast': '🍳',
      'Quesadillas': '🧀',
      'Tortas': '🥙',
      'Sides': '🌽',
      'Drinks': '🥤'
    }
    return emojiMap[category] || '🍽️'
  }

  const getItemQuantity = (itemId) => {
    const cartItem = cartItems.find(item => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const handleAddToCart = (item) => {
    addToCart(item)
  }

  const handleQuantityChange = (item, change) => {
    const currentQuantity = getItemQuantity(item.id)
    const newQuantity = currentQuantity + change
    
    if (newQuantity <= 0) {
      updateQuantity(item.id, 0) // This will remove the item
    } else {
      updateQuantity(item.id, newQuantity)
    }
  }

  // Filter items based on category and search term
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || 
                           item.category.toLowerCase() === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="menu-page">
        <div className="menu-hero">
          <div className="container">
            <Link to="/" className="back-link">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="menu-page-title">Menu</h1>
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading menu...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="menu-page-title">Menu</h1>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="menu-content">
        <div className="container">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="menu-categories">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="category-emoji">{category.emoji}</span>
                <span className="category-name">{category.name}</span>
              </button>
            ))}
          </div>

          <div className="menu-items-grid">
            {filteredItems.length === 0 ? (
              <div className="no-items">
                <p>No items found matching your criteria.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-image">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="menu-image"
                      />
                    ) : (
                      <div className="menu-emoji">{item.emoji}</div>
                    )}
                  </div>
                  <div className="menu-item-content">
                    <div className="menu-item-header">
                      <div className="menu-item-info">
                        <h4>{item.name}</h4>
                        <p className="menu-description">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="menu-item-actions">
                      {getItemQuantity(item.id) > 0 ? (
                        <div className="quantity-controls">
                          <div className="menu-price">${(parseFloat(item.price) || 0).toFixed(2)}</div>
                          <div className="quantity-buttons">
                            <button 
                              className="quantity-btn"
                              onClick={() => handleQuantityChange(item, -1)}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="quantity">{getItemQuantity(item.id)}</span>
                            <button 
                              className="quantity-btn"
                              onClick={() => handleQuantityChange(item, 1)}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="price-and-add-row">
                          <div className="menu-price">${(parseFloat(item.price) || 0).toFixed(2)}</div>
                          <button 
                            className="add-to-cart-btn"
                            onClick={() => handleAddToCart(item)}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuPage