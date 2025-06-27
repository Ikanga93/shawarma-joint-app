import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    console.log('Loading cart from localStorage:', savedCart)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        console.log('Parsed cart:', parsedCart)
        // Restore image URLs by fetching menu items and matching them
        restoreCartItemsWithImages(parsedCart)
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        setIsLoaded(true)
      }
    } else {
      setIsLoaded(true)
    }
  }, [])

  // Restore cart items with images from menu data
  const restoreCartItemsWithImages = async (cartItems) => {
    try {
      // Fetch menu items from Supabase
      const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('id, image_url, emoji, description')
        .eq('available', true)

      if (error) {
        throw error
      }

      const menuItemsMap = new Map(menuItems.map(item => [item.id, item]))
      
      const restoredItems = cartItems.map(cartItem => {
        const menuItem = menuItemsMap.get(cartItem.id)
        if (menuItem) {
          // Restore the image_url and other properties that might have been stripped
          return {
            ...cartItem,
            image_url: menuItem.image_url,
            emoji: menuItem.emoji,
            description: menuItem.description
          }
        }
        return cartItem
      })
      
      setCartItems(restoredItems)
    } catch (error) {
      console.error('Error restoring cart items with images:', error)
      // Fallback to cart items without images
      setCartItems(cartItems)
    } finally {
      setIsLoaded(true)
    }
  }

  // Save cart to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (!isLoaded) return
    
    console.log('Saving cart to localStorage:', cartItems)
    
    // Optimize cart data for localStorage storage
    const cartDataToStore = cartItems.map(item => {
      const itemData = { ...item }
      
      // Keep image_url as just the filename/path, not full data URLs
      // Remove large base64 image data to prevent localStorage quota exceeded errors
      // If image_url is a data URL, don't save it to localStorage
      if (itemData.image_url && itemData.image_url.startsWith('data:')) {
        // Remove base64 data to save space, will be restored on load
        delete itemData.image_url
      }
      
      return itemData
    })
    
    try {
      localStorage.setItem('cart', JSON.stringify(cartDataToStore))
    } catch (quotaError) {
      console.warn('LocalStorage quota exceeded when saving cart, attempting with minimal data:', quotaError)
      
      // Fallback: save only essential cart data
      const minimalCartData = cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions
      }))
      
      try {
        localStorage.setItem('cart', JSON.stringify(minimalCartData))
      } catch (fallbackError) {
        console.error('Failed to save cart even with minimal data:', fallbackError)
        // Clear cart storage if even minimal data fails
        localStorage.removeItem('cart')
      }
    }
  }, [cartItems, isLoaded])

  const addToCart = (item) => {
    setCartItems(prevItems => {
      // For items with options, we need to check if the same item with the same options exists
      const hasOptions = item.selectedOptions && Object.keys(item.selectedOptions).length > 0;
      
      if (hasOptions) {
        // Create a unique key for this item + options combination
        const itemOptionsKey = generateItemOptionsKey(item);
        
        // Check if this exact item + options combination exists
        const existingItemIndex = prevItems.findIndex(cartItem => 
          generateItemOptionsKey(cartItem) === itemOptionsKey
        );
        
        if (existingItemIndex >= 0) {
          // If the exact item + options combination exists, increase quantity
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + 1
          };
          return updatedItems;
        } else {
          // If new item + options combination, add with quantity 1
          return [...prevItems, { ...item, quantity: 1 }];
        }
      } else {
        // For items without options, use the original logic
        const existingItem = prevItems.find(cartItem => cartItem.id === item.id && !cartItem.selectedOptions);
        
        if (existingItem) {
          // If item already exists, increase quantity
          return prevItems.map(cartItem =>
            cartItem.id === item.id && !cartItem.selectedOptions
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          );
        } else {
          // If new item, add with quantity 1
          return [...prevItems, { ...item, quantity: 1 }];
        }
      }
    });
  }
  
  // Generate a unique key for an item + options combination
  const generateItemOptionsKey = (item) => {
    if (!item.selectedOptions) return `${item.id}`;
    
    // Create a string representation of the selected options
    const optionsString = Object.entries(item.selectedOptions)
      .map(([groupId, selection]) => {
        if (Array.isArray(selection)) {
          // For multi-select options, sort the array to ensure consistent keys
          return `${groupId}:${[...selection].sort().join(',')}`;
        }
        return `${groupId}:${selection}`;
      })
      .sort() // Sort to ensure consistent order
      .join('|');
    
    return `${item.id}|${optionsString}`;
  }

  const removeFromCart = (itemId, selectedOptions = null) => {
    setCartItems(prevItems => {
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        // For items with options, we need to match both id and options
        const itemOptionsKey = generateItemOptionsKey({ id: itemId, selectedOptions });
        return prevItems.filter(item => generateItemOptionsKey(item) !== itemOptionsKey);
      } else {
        // For items without options, use the original logic
        return prevItems.filter(item => {
          if (item.id !== itemId) return true;
          // If this item has options, keep it (it's not the one we're removing)
          return item.selectedOptions && Object.keys(item.selectedOptions).length > 0;
        });
      }
    });
  }

  const updateQuantity = (itemId, newQuantity, selectedOptions = null) => {
    if (newQuantity < 1) {
      removeFromCart(itemId, selectedOptions)
      return
    }
    
    setCartItems(prevItems => {
      if (selectedOptions && Object.keys(selectedOptions).length > 0) {
        // For items with options, we need to match both id and options
        const itemOptionsKey = generateItemOptionsKey({ id: itemId, selectedOptions });
        
        return prevItems.map(item => {
          const currentItemKey = generateItemOptionsKey(item);
          return currentItemKey === itemOptionsKey ? { ...item, quantity: newQuantity } : item;
        });
      } else {
        // For items without options, use the original logic
        return prevItems.map(item => {
          if (item.id !== itemId) return item;
          if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) return item;
          return { ...item, quantity: newQuantity };
        });
      }
    });
  }

  const clearCart = () => {
    setCartItems([])
  }

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default CartContext