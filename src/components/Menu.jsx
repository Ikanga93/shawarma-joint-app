import React, { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'
import './Menu.css'

const Menu = () => {
  const { addToCart } = useCart()
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedItems, setExpandedItems] = useState({})
  const [selectedOptions, setSelectedOptions] = useState({})

  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
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
        available: item.available,
        options: [] // We'll add default options below if needed
      }))

      // Add default options for certain categories
      const processedWithOptions = processedData.map(item => {
        let defaultOptions = []
        
        // Add size options for main items
        if (['Shawarma', 'Kebabs', 'Mediterranean Plates'].includes(item.category)) {
          defaultOptions.push({
            id: `${item.id}-size`,
            name: 'Size',
            description: 'Choose your size',
            required: true,
            multiSelect: false,
            choices: [
              { id: 'small', name: 'Small', price: -2.00 },
              { id: 'medium', name: 'Medium', price: 0 },
              { id: 'large', name: 'Large', price: 2.00 }
            ]
          })
        }
        
        // Add spice level for main dishes
        if (['Shawarma', 'Kebabs'].includes(item.category)) {
          defaultOptions.push({
            id: `${item.id}-spice`,
            name: 'Spice Level',
            description: 'How spicy would you like it?',
            required: false,
            multiSelect: false,
            choices: [
              { id: 'mild', name: 'Mild', price: 0 },
              { id: 'medium', name: 'Medium', price: 0 },
              { id: 'hot', name: 'Hot', price: 0 },
              { id: 'extra-hot', name: 'Extra Hot', price: 0 }
            ]
          })
        }
        
        return {
          ...item,
          options: defaultOptions
        }
      })
      
      setMenuItems(processedWithOptions)
    } catch (err) {
      console.error('Error loading menu items:', err)
      setError('Failed to load menu items. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Memoize grouped items to prevent recalculation
  const groupedItems = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {})
  }, [menuItems])

  // Toggle item options visibility
  const toggleItemOptions = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    
    // Initialize selected options for this item if not already done
    if (!selectedOptions[itemId]) {
      initializeItemOptions(itemId);
    }
  }
  
  // Initialize options for an item
  const initializeItemOptions = (itemId) => {
    const item = menuItems.find(item => item.id === itemId);
    if (!item || !item.options) return;
    
    const initialOptions = {};
    
    item.options.forEach(optionGroup => {
      if (optionGroup.required && !optionGroup.multiSelect) {
        // For required single-select options, pre-select the first option
        initialOptions[optionGroup.id] = optionGroup.choices[0]?.id || null;
      } else if (optionGroup.multiSelect) {
        // For multi-select options, initialize with empty array
        initialOptions[optionGroup.id] = [];
      } else {
        // For optional single-select, initialize with null
        initialOptions[optionGroup.id] = null;
      }
    });
    
    setSelectedOptions(prev => ({
      ...prev,
      [itemId]: initialOptions
    }));
  }
  
  // Handle option selection change
  const handleOptionChange = (itemId, optionGroupId, choiceId, isMultiSelect) => {
    setSelectedOptions(prev => {
      const itemOptions = {...(prev[itemId] || {})};
      
      if (isMultiSelect) {
        // For checkboxes (multi-select)
        const currentSelections = [...(itemOptions[optionGroupId] || [])];
        const index = currentSelections.indexOf(choiceId);
        
        if (index >= 0) {
          currentSelections.splice(index, 1); // Remove if already selected
        } else {
          currentSelections.push(choiceId); // Add if not selected
        }
        
        itemOptions[optionGroupId] = currentSelections;
      } else {
        // For radio buttons (single-select)
        itemOptions[optionGroupId] = choiceId;
      }
      
      return {
        ...prev,
        [itemId]: itemOptions
      };
    });
  }
  
  // Check if all required options are selected
  const canAddToCart = (item) => {
    if (!item.options || item.options.length === 0) return true;
    if (!expandedItems[item.id]) return false;
    
    const itemOptionSelections = selectedOptions[item.id] || {};
    
    // Check if all required options have selections
    return item.options.every(optionGroup => {
      if (!optionGroup.required) return true;
      
      const selection = itemOptionSelections[optionGroup.id];
      
      if (optionGroup.multiSelect) {
        return selection && selection.length > 0;
      } else {
        return selection !== null && selection !== undefined;
      }
    });
  }
  
  // Add item to cart with selected options
  const handleAddToCart = (item) => {
    if (!canAddToCart(item)) return;
    
    // Create a copy of the item with selected options
    const itemWithOptions = {
      ...item,
      selectedOptions: selectedOptions[item.id] || {}
    };
    
    // Add to cart
    addToCart(itemWithOptions);
    
    // Reset options and collapse the options panel
    setExpandedItems(prev => ({
      ...prev,
      [item.id]: false
    }));
  }

  if (loading) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <h2>Most Liked</h2>
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading delicious menu items...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <h2>Most Liked</h2>
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadMenuItems} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (menuItems.length === 0) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <h2>Most Liked</h2>
          <div className="empty-menu">
            <p>We're updating our menu. Please check back soon!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="menu-section" id="menu">
      <div className="container">
        <h2>Most Liked</h2>
        <p className="menu-subtitle">Authentic Mediterranean flavors made fresh daily</p>
        
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="menu-category">
            <h3 className="category-title">{category}</h3>
            <div className="menu-items">
              {items.map(item => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-image">
                    {item.image_url ? (
                      <img 
                        src={item.image_url.startsWith('data:') ? item.image_url : `${API_BASE_URL}${item.image_url}`} 
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
                      <div className="price-and-add-row">
                        <div className="menu-price">${(parseFloat(item.price) || 0).toFixed(2)}</div>
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => handleAddToCart(item)}
                          disabled={!canAddToCart(item)}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      
                      {item.options && item.options.length > 0 && (
                        <button 
                          className="options-toggle-btn"
                          onClick={() => toggleItemOptions(item.id)}
                        >
                          {expandedItems[item.id] ? (
                            <>
                              <ChevronUp size={16} />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              Options
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Options section */}
                    {expandedItems[item.id] && item.options && item.options.length > 0 && (
                      <div className="menu-item-options">
                        {item.options.map((optionGroup) => (
                          <div key={optionGroup.id} className="option-group">
                            <div className="option-group-header">
                              <h5>{optionGroup.name}</h5>
                              <span className={`option-type ${optionGroup.required ? 'required' : 'optional'}`}>
                                {optionGroup.required ? 'Required' : 'Optional'}
                              </span>
                            </div>
                            <p className="option-description">{optionGroup.description}</p>
                            
                            <div className="option-choices">
                              {optionGroup.choices.map((choice) => (
                                <div key={choice.id} className="option-choice">
                                  <label className="option-choice-label">
                                    <input
                                      type={optionGroup.multiSelect ? "checkbox" : "radio"}
                                      name={`option-${item.id}-${optionGroup.id}`}
                                      value={choice.id}
                                      checked={
                                        selectedOptions[item.id] && 
                                        selectedOptions[item.id][optionGroup.id] && 
                                        (optionGroup.multiSelect 
                                          ? selectedOptions[item.id][optionGroup.id].includes(choice.id)
                                          : selectedOptions[item.id][optionGroup.id] === choice.id)
                                      }
                                      onChange={() => handleOptionChange(item.id, optionGroup.id, choice.id, optionGroup.multiSelect)}
                                    />
                                    <span className="option-choice-name">{choice.name}</span>
                                    {choice.price > 0 && (
                                      <span className="option-choice-price">+${(parseFloat(choice.price) || 0).toFixed(2)}</span>
                                    )}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Menu