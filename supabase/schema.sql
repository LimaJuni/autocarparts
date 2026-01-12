-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create ENUMs for status
create type user_role as enum ('admin', 'customer', 'vendor', 'delivery');
create type order_status as enum ('pending', 'paid_waiting_verification', 'approved', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected');
create type payment_status as enum ('pending', 'verified', 'rejected');

-- 1. User Profiles (Extending Supabase Auth)
create table public.user_profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  role user_role default 'customer',
  phone_number text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  stock_quantity integer default 0,
  category_id uuid references public.categories(id),
  image_url text,
  vendor_id uuid references public.user_profiles(id), -- If multi-vendor
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) not null,
  total_amount numeric not null,
  status order_status default 'pending',
  shipping_address text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  product_id uuid references public.products(id) not null,
  quantity integer not null,
  price_at_purchase numeric not null
);

-- 6. Payments
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  user_id uuid references public.user_profiles(id) not null,
  amount numeric not null,
  proof_image_url text, -- User uploads screenshot
  transaction_id text, -- Manual entry
  status payment_status default 'pending',
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- RLS (Row Level Security) Policies
alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Helper function to check if user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Policies

-- User Profiles
create policy "Public profiles are viewable by everyone" on public.user_profiles for select using (true);
create policy "Users can insert their own profile" on public.user_profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id);

-- Categories & Products (Public Read, Admin Write)
create policy "Categories are viewable by everyone" on public.categories for select using (true);
create policy "Admins can insert categories" on public.categories for insert with check (is_admin());
create policy "Admins can update categories" on public.categories for update using (is_admin());

create policy "Products are viewable by everyone" on public.products for select using (true);
create policy "Admins/Vendors can insert products" on public.products for insert with check (is_admin()); -- or vendor check
create policy "Admins/Vendors can update products" on public.products for update using (is_admin());

-- Orders (User sees own, Admin sees all)
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Admins can view all orders" on public.orders for select using (is_admin());
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Admins can update orders" on public.orders for update using (is_admin()); 

-- Payments (User sees own, Admin sees all)
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);
create policy "Admins can view all payments" on public.payments for select using (is_admin());
create policy "Users can submit payments" on public.payments for insert with check (auth.uid() = user_id);
create policy "Admins can verify payments" on public.payments for update using (is_admin());

-- Storage Buckets Setup (You must create these buckets manually in dashboard or via API, but here is policy logic)
-- Bucket: 'product-images', 'payment-proofs'
-- Policy 'Public Access' for product-images
-- Policy 'Authenticated Upload' for product-images
