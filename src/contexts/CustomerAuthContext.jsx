import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, signUp, signIn, signOut, getCurrentUser } from '../lib/supabase'

const CustomerAuthContext = createContext(null)

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for existing session on mount
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          // Get user profile from our users table
          try {
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (error) {
              console.error('Error fetching user profile:', error)
              setUser(null)
            } else {
              setUser({
                id: userProfile.id,
                email: userProfile.email,
                firstName: userProfile.first_name,
                lastName: userProfile.last_name,
                phone: userProfile.phone,
                role: userProfile.role
              })
            }
          } catch (error) {
            console.error('Error in auth state change:', error)
            setUser(null)
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        // Get user profile from our users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (error) {
          console.error('Error fetching user profile:', error)
          setUser(null)
        } else {
          setUser({
            id: userProfile.id,
            email: userProfile.email,
            firstName: userProfile.first_name,
            lastName: userProfile.last_name,
            phone: userProfile.phone,
            role: userProfile.role
          })
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      setLoading(true)
      
      const { email, password, firstName, lastName, phone } = userData
      
      // Sign up with Supabase Auth
      const authData = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
        phone: phone
      })

      // The trigger function in our schema will automatically create the user profile
      // in the users table, so we don't need to manually insert it here
      
      return authData
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      setLoading(true)
      
      const { email, password } = credentials
      
      // Sign in with Supabase Auth
      const authData = await signIn(email, password)
      
      return authData
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await signOut()
      setUser(null)
    } catch (error) {
      setError(error.message)
      console.error('Logout error:', error)
      // Clear user state even if logout fails
      setUser(null)
    }
  }

  // Supabase handles token refresh automatically, so we don't need this function
  // But keeping it for compatibility with existing code
  const refreshAccessToken = async () => {
    try {
      const currentUser = await getCurrentUser()
      return currentUser?.access_token
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshAccessToken,
    setError
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
} 