-- Supabase Schema for Shawarma Joint Restaurant App
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Create custom types
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE user_role AS ENUM ('customer', 'admin', 'staff');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu categories
CREATE TABLE public.menu_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu items
CREATE TABLE public.menu_items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES menu_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu item options (like spice level, size, etc.)
CREATE TABLE public.menu_item_options (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    option_type TEXT NOT NULL, -- 'radio', 'checkbox', 'select'
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- Menu item option choices
CREATE TABLE public.menu_item_option_choices (
    id SERIAL PRIMARY KEY,
    option_id INTEGER REFERENCES menu_item_options(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0
);

-- Customer profiles
CREATE TABLE public.customer_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id),
    order_number TEXT UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,
    customer_info JSONB,
    location_info JSONB,
    special_instructions TEXT,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    selected_options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations (food truck locations)
CREATE TABLE public.locations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Location schedules
CREATE TABLE public.location_schedules (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default menu categories
INSERT INTO public.menu_categories (name, description, emoji, sort_order) VALUES
('Shawarma', 'Traditional Middle Eastern wraps', '🥙', 1),
('Kebabs', 'Grilled meat skewers', '🍖', 2),
('Mediterranean Plates', 'Complete meals with rice and sides', '🍽️', 3),
('Appetizers', 'Start your meal right', '🥗', 4),
('Beverages', 'Refresh yourself', '🥤', 5),
('Desserts', 'Sweet endings', '🍰', 6);

-- Insert sample menu items
INSERT INTO public.menu_items (category_id, name, description, price, is_featured) VALUES
(1, 'Chicken Shawarma', 'Tender marinated chicken with garlic sauce, pickles, and vegetables', 10.99, true),
(1, 'Beef Shawarma', 'Seasoned beef with tahini sauce and fresh vegetables', 11.99, true),
(1, 'Lamb Shawarma', 'Premium lamb with traditional spices and yogurt sauce', 13.99, false),
(2, 'Chicken Kebab', 'Grilled chicken skewers with Mediterranean spices', 12.99, true),
(2, 'Beef Kebab', 'Tender beef skewers with onions and peppers', 14.99, false),
(3, 'Mediterranean Bowl', 'Rice bowl with your choice of protein and toppings', 11.99, true),
(3, 'Gyro Plate', 'Traditional gyro with rice, salad, and tzatziki', 13.99, false),
(4, 'Hummus & Pita', 'Creamy hummus served with warm pita bread', 6.99, false),
(4, 'Falafel (6 pieces)', 'Crispy chickpea fritters with tahini sauce', 7.99, false),
(5, 'Fountain Drink', 'Coca-Cola products', 2.99, false),
(5, 'Fresh Juice', 'Orange, apple, or pomegranate', 3.99, false),
(6, 'Baklava', 'Traditional honey and nut pastry', 4.99, false);

-- Row Level Security Policies

-- Users can read their own data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Customer profiles
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view own profile" ON public.customer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can update own profile" ON public.customer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Customers can insert own profile" ON public.customer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view own order items" ON public.order_items 
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()
    ));

-- Public read access for menu-related tables
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu categories" ON public.menu_categories FOR SELECT USING (is_active = true);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (is_available = true);

ALTER TABLE public.menu_item_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu options" ON public.menu_item_options FOR SELECT USING (true);

ALTER TABLE public.menu_item_option_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu option choices" ON public.menu_item_option_choices FOR SELECT USING (true);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (is_active = true);

ALTER TABLE public.location_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view location schedules" ON public.location_schedules FOR SELECT USING (is_active = true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    SELECT 'SJ' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::INTEGER % 10000)::TEXT, 4, '0')
    INTO new_number;
    RETURN new_number;
END;
$$ LANGUAGE plpgsql; 