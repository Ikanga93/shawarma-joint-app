import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error)
  if (error.message) {
    throw new Error(error.message)
  }
  throw new Error('An unexpected error occurred')
}

// Auth helpers
export const signUp = async (email, password, userData = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  
  if (error) handleSupabaseError(error)
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) handleSupabaseError(error)
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) handleSupabaseError(error)
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) handleSupabaseError(error)
  return user
}

// Database helpers
export const insertData = async (table, data) => {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
  
  if (error) handleSupabaseError(error)
  return result
}

export const selectData = async (table, columns = '*', filters = {}) => {
  let query = supabase.from(table).select(columns)
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      query = query.in(key, value)
    } else {
      query = query.eq(key, value)
    }
  })
  
  const { data, error } = await query
  if (error) handleSupabaseError(error)
  return data
}

export const updateData = async (table, updates, filters) => {
  let query = supabase.from(table).update(updates)
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data, error } = await query.select()
  if (error) handleSupabaseError(error)
  return data
}

export const deleteData = async (table, filters) => {
  let query = supabase.from(table)
  
  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { error } = await query.delete()
  if (error) handleSupabaseError(error)
} 