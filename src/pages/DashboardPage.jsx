import React from 'react'
import { useNavigate } from 'react-router-dom'

const DashboardPage = ({ onLogout }) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('currentUser')
    if (onLogout) onLogout()
    navigate('/admin/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '3rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            🚧 Admin Dashboard - Coming Soon
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            The admin dashboard is being rebuilt for the new Supabase architecture.
            <br />
            For now, you can manage your restaurant through the Supabase dashboard.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#15803d', marginBottom: '0.5rem' }}>📊 Database Management</h3>
              <p style={{ color: '#166534', fontSize: '0.9rem' }}>
                View and edit menu items, orders, and customers in your Supabase dashboard
              </p>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#16a34a',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem'
                }}
              >
                Open Supabase →
              </a>
            </div>

            <div style={{
              background: '#fef3c7',
              border: '1px solid #fcd34d',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#d97706', marginBottom: '0.5rem' }}>🛒 Order Management</h3>
              <p style={{ color: '#92400e', fontSize: '0.9rem' }}>
                Monitor orders in real-time through the Supabase Table Editor
              </p>
              <p style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem', 
                color: '#78350f',
                fontStyle: 'italic' 
              }}>
                Table: orders → View and update order status
              </p>
            </div>

            <div style={{
              background: '#e0f2fe',
              border: '1px solid #7dd3fc',
              borderRadius: '8px',
              padding: '1.5rem'
            }}>
              <h3 style={{ color: '#0369a1', marginBottom: '0.5rem' }}>🍽️ Menu Management</h3>
              <p style={{ color: '#075985', fontSize: '0.9rem' }}>
                Add, edit, and manage menu items directly in Supabase
              </p>
              <p style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem', 
                color: '#0c4a6e',
                fontStyle: 'italic' 
              }}>
                Table: menu_items → Update availability and pricing
              </p>
            </div>
          </div>

          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              color: '#374151', 
              marginBottom: '1rem',
              fontSize: '1.1rem'
            }}>
              📋 Quick Admin Tasks
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              fontSize: '0.9rem'
            }}>
              <div>
                <strong style={{ color: '#1f2937' }}>View Orders:</strong>
                <br />
                <span style={{ color: '#6b7280' }}>Supabase → Table Editor → orders</span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Update Menu:</strong>
                <br />
                <span style={{ color: '#6b7280' }}>Supabase → Table Editor → menu_items</span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Manage Users:</strong>
                <br />
                <span style={{ color: '#6b7280' }}>Supabase → Authentication → Users</span>
              </div>
              <div>
                <strong style={{ color: '#1f2937' }}>Analytics:</strong>
                <br />
                <span style={{ color: '#6b7280' }}>Supabase → Reports & Analytics</span>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate('/menu')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            >
              📱 View Customer App
            </button>
            
            <button
              onClick={handleLogout}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background 0.3s'
              }}
            >
              🚪 Logout
            </button>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#1e40af'
          }}>
            <strong>🚀 Coming Soon:</strong> Full admin dashboard with order management, 
            analytics, menu editing, and customer management - all built for Supabase!
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 