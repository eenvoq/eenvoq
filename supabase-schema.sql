-- Eenvoq Supabase migration / update script
-- Safe to run multiple times

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type account_type as enum ('business');
  end if;
end $$;

-- 1) Ensure core tenant columns exist (for existing tables)
alter table if exists businesses
  add column if not exists contact_email text,
  add column if not exists contact_phone text,
  add column if not exists modules jsonb default '[]'::jsonb,
  add column if not exists logo_url text,
  add column if not exists account_type account_type default 'business';

alter table if exists profiles
  add column if not exists full_name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists account_type account_type,
  add column if not exists tenant_id uuid,
  add column if not exists profile_pic text,
  add column if not exists online boolean default false,
  add column if not exists last_active timestamptz,
  add column if not exists is_active boolean default true,
  add column if not exists pin_hash text;

-- 2) Create core tables if missing
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  subtype text,
  location text,
  currency text not null default 'USD ($)',
  contact_email text,
  contact_phone text,
  modules jsonb not null default '[]'::jsonb,
  logo_url text,
  account_type account_type not null default 'business',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  account_type account_type not null default 'business',
  full_name text not null,
  email text not null,
  role text not null check (role in ('owner', 'manager', 'staff')),
  profile_pic text,
  online boolean not null default false,
  last_active timestamptz,
  is_active boolean not null default true,
  pin_hash text, -- Added missing pin_hash field to base table definition
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (business_id, email)
);

create table if not exists business_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  timezone text not null default 'UTC',
  currency text not null default 'USD ($)',
  locale text not null default 'en-US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists application_preferences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  theme text not null default 'light',
  language text not null default 'en',
  default_view text not null default 'dashboard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists dashboard_configurations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  layout text not null default 'default',
  widgets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists default_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  category_type text not null default 'custom',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists operator_roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  description text,
  is_system_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  role_id uuid references operator_roles(id) on delete cascade,
  feature text not null,
  action text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, role_id, feature, action)
);

create table if not exists ai_configurations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  provider text not null default 'openai',
  model text not null default 'gpt-4o-mini',
  enabled boolean not null default true,
  default_prompt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  created_by uuid references profiles(id) on delete set null,
  name text not null,
  sku text not null,
  category text,
  stock int default 0,
  min_stock int default 0,
  price numeric(14,2) default 0,
  cost numeric(14,2) default 0,
  image_url text,
  status text,
  note text,
  tags text[] default array[]::text[],
  branch text,
  department text,
  details jsonb default '{}'::jsonb,
  attachments jsonb default '[]'::jsonb,
  last_modified_by text,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  status text not null default 'Active',
  total_spent numeric(14,2) default 0,
  orders_count int default 0,
  last_purchase_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric(14,2) default 0,
  date timestamptz not null default now(),
  status text not null default 'Completed',
  recorded_by uuid references profiles(id) on delete set null,
  transaction_type text,
  recipient_id uuid references profiles(id) on delete set null,
  recipient_name text,
  category text,
  inventory_id uuid references products(id) on delete set null,
  inventory_name text,
  inventory_photo text,
  sale_date date,
  purchase_price numeric(14,2) default 0,
  selling_price numeric(14,2) default 0,
  profit numeric(14,2) default 0,
  balance_due numeric(14,2) default 0,
  currency text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  name text not null,
  specialty text,
  lead_time int default 3,
  contact text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  title text not null,
  category text not null,
  amount numeric(14,2) not null default 0,
  date date not null default current_date,
  vendor text,
  product text,
  notes text,
  receipt_url text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  tenant_id uuid references businesses(id) on delete cascade,
  category text not null,
  message text not null,
  source_profile_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3) Indexes
create index if not exists idx_profiles_account_type on profiles(account_type);
create index if not exists idx_profiles_tenant_id on profiles(tenant_id);
create index if not exists idx_products_business_id on products(business_id);
create unique index if not exists idx_products_business_sku on products(business_id, sku);
create index if not exists idx_customers_business_id on customers(business_id);
create index if not exists idx_orders_business_id on orders(business_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_suppliers_business_id on suppliers(business_id);
create index if not exists idx_expenses_business_id on expenses(business_id);
create index if not exists idx_audit_logs_business_id on audit_logs(business_id);

-- 4) Enable RLS and create policies
alter table businesses enable row level security;
drop policy if exists "Authenticated users can insert businesses" on businesses;
drop policy if exists "Authenticated users can select businesses" on businesses;
drop policy if exists "Authenticated users can update own business" on businesses;
drop policy if exists "Authenticated users can delete own business" on businesses;
create policy "Authenticated users can insert businesses" on businesses
  for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can select businesses" on businesses
  for select using (true);
create policy "Authenticated users can update own business" on businesses
  for update using (exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.business_id = businesses.id))
  with check (exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.business_id = businesses.id));
create policy "Authenticated users can delete own business" on businesses
  for delete using (exists (select 1 from profiles where profiles.user_id = auth.uid() and profiles.business_id = businesses.id));

alter table profiles enable row level security;
drop policy if exists "Authenticated users can insert profiles" on profiles;
drop policy if exists "Authenticated users can select own profile" on profiles;
drop policy if exists "Authenticated users can update own profile" on profiles;
drop policy if exists "Authenticated users can delete own profile" on profiles;
create policy "Authenticated users can insert profiles" on profiles
  for insert with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Authenticated users can select own profile" on profiles
  for select using (user_id = auth.uid());
create policy "Authenticated users can update own profile" on profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Authenticated users can delete own profile" on profiles
  for delete using (user_id = auth.uid());

alter table products enable row level security;
drop policy if exists "Authenticated users can select products for their business" on products;
drop policy if exists "Authenticated users can insert products for their business" on products;
drop policy if exists "Authenticated users can update products for their business" on products;
drop policy if exists "Authenticated users can delete products for their business" on products;
create policy "Authenticated users can select products for their business" on products
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert products for their business" on products
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update products for their business" on products
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete products for their business" on products
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table orders enable row level security;
drop policy if exists "Authenticated users can select orders for their business" on orders;
drop policy if exists "Authenticated users can insert orders for their business" on orders;
drop policy if exists "Authenticated users can update orders for their business" on orders;
drop policy if exists "Authenticated users can delete orders for their business" on orders;
create policy "Authenticated users can select orders for their business" on orders
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert orders for their business" on orders
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update orders for their business" on orders
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete orders for their business" on orders
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table customers enable row level security;
drop policy if exists "Authenticated users can select customers for their business" on customers;
drop policy if exists "Authenticated users can insert customers for their business" on customers;
drop policy if exists "Authenticated users can update customers for their business" on customers;
drop policy if exists "Authenticated users can delete customers for their business" on customers;
create policy "Authenticated users can select customers for their business" on customers
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert customers for their business" on customers
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update customers for their business" on customers
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete customers for their business" on customers
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table suppliers enable row level security;
drop policy if exists "Authenticated users can select suppliers for their business" on suppliers;
drop policy if exists "Authenticated users can insert suppliers for their business" on suppliers;
drop policy if exists "Authenticated users can update suppliers for their business" on suppliers;
drop policy if exists "Authenticated users can delete suppliers for their business" on suppliers;
create policy "Authenticated users can select suppliers for their business" on suppliers
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert suppliers for their business" on suppliers
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update suppliers for their business" on suppliers
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete suppliers for their business" on suppliers
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table expenses enable row level security;
drop policy if exists "Authenticated users can select expenses for their business" on expenses;
drop policy if exists "Authenticated users can insert expenses for their business" on expenses;
drop policy if exists "Authenticated users can update expenses for their business" on expenses;
drop policy if exists "Authenticated users can delete expenses for their business" on expenses;
create policy "Authenticated users can select expenses for their business" on expenses
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert expenses for their business" on expenses
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update expenses for their business" on expenses
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete expenses for their business" on expenses
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table audit_logs enable row level security;
drop policy if exists "Authenticated users can select audit logs for their business" on audit_logs;
drop policy if exists "Authenticated users can insert audit logs for their business" on audit_logs;
drop policy if exists "Authenticated users can update audit logs for their business" on audit_logs;
drop policy if exists "Authenticated users can delete audit logs for their business" on audit_logs;
create policy "Authenticated users can select audit logs for their business" on audit_logs
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert audit logs for their business" on audit_logs
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update audit logs for their business" on audit_logs
  for update using (false);
create policy "Authenticated users can delete audit logs for their business" on audit_logs
  for delete using (false);

alter table business_settings enable row level security;
drop policy if exists "Authenticated users can select business settings" on business_settings;
drop policy if exists "Authenticated users can insert business settings" on business_settings;
drop policy if exists "Authenticated users can update business settings" on business_settings;
drop policy if exists "Authenticated users can delete business settings" on business_settings;
create policy "Authenticated users can select business settings" on business_settings
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert business settings" on business_settings
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update business settings" on business_settings
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete business settings" on business_settings
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table application_preferences enable row level security;
drop policy if exists "Authenticated users can select application preferences" on application_preferences;
drop policy if exists "Authenticated users can insert application preferences" on application_preferences;
drop policy if exists "Authenticated users can update application preferences" on application_preferences;
drop policy if exists "Authenticated users can delete application preferences" on application_preferences;
create policy "Authenticated users can select application preferences" on application_preferences
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert application preferences" on application_preferences
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update application preferences" on application_preferences
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete application preferences" on application_preferences
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table dashboard_configurations enable row level security;
drop policy if exists "Authenticated users can select dashboard configurations" on dashboard_configurations;
drop policy if exists "Authenticated users can insert dashboard configurations" on dashboard_configurations;
drop policy if exists "Authenticated users can update dashboard configurations" on dashboard_configurations;
drop policy if exists "Authenticated users can delete dashboard configurations" on dashboard_configurations;
create policy "Authenticated users can select dashboard configurations" on dashboard_configurations
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert dashboard configurations" on dashboard_configurations
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update dashboard configurations" on dashboard_configurations
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete dashboard configurations" on dashboard_configurations
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table default_categories enable row level security;
drop policy if exists "Authenticated users can select default categories" on default_categories;
drop policy if exists "Authenticated users can insert default categories" on default_categories;
drop policy if exists "Authenticated users can update default categories" on default_categories;
drop policy if exists "Authenticated users can delete default categories" on default_categories;
create policy "Authenticated users can select default categories" on default_categories
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert default categories" on default_categories
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update default categories" on default_categories
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete default categories" on default_categories
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table operator_roles enable row level security;
drop policy if exists "Authenticated users can select operator roles" on operator_roles;
drop policy if exists "Authenticated users can insert operator roles" on operator_roles;
drop policy if exists "Authenticated users can update operator roles" on operator_roles;
drop policy if exists "Authenticated users can delete operator roles" on operator_roles;
create policy "Authenticated users can select operator roles" on operator_roles
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert operator roles" on operator_roles
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update operator roles" on operator_roles
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete operator roles" on operator_roles
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table permissions enable row level security;
drop policy if exists "Authenticated users can select permissions" on permissions;
drop policy if exists "Authenticated users can insert permissions" on permissions;
drop policy if exists "Authenticated users can update permissions" on permissions;
drop policy if exists "Authenticated users can delete permissions" on permissions;
create policy "Authenticated users can select permissions" on permissions
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert permissions" on permissions
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update permissions" on permissions
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete permissions" on permissions
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table ai_configurations enable row level security;
drop policy if exists "Authenticated users can select ai configurations" on ai_configurations;
drop policy if exists "Authenticated users can insert ai configurations" on ai_configurations;
drop policy if exists "Authenticated users can update ai configurations" on ai_configurations;
drop policy if exists "Authenticated users can delete ai configurations" on ai_configurations;
create policy "Authenticated users can select ai configurations" on ai_configurations
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert ai configurations" on ai_configurations
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update ai configurations" on ai_configurations
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete ai configurations" on ai_configurations
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

alter table notification_preferences enable row level security;
drop policy if exists "Authenticated users can select notification preferences" on notification_preferences;
drop policy if exists "Authenticated users can insert notification preferences" on notification_preferences;
drop policy if exists "Authenticated users can update notification preferences" on notification_preferences;
drop policy if exists "Authenticated users can delete notification preferences" on notification_preferences;
create policy "Authenticated users can select notification preferences" on notification_preferences
  for select using (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can insert notification preferences" on notification_preferences
  for insert with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can update notification preferences" on notification_preferences
  for update using (business_id in (select business_id from profiles where user_id = auth.uid()))
  with check (business_id in (select business_id from profiles where user_id = auth.uid()));
create policy "Authenticated users can delete notification preferences" on notification_preferences
  for delete using (business_id in (select business_id from profiles where user_id = auth.uid()));

-- 5) Timestamp triggers
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Re-applying standard business layers
drop trigger if exists set_businesses_updated_at on businesses;
create trigger set_businesses_updated_at before update on businesses for each row execute function update_updated_at();

drop trigger if exists set_profiles_updated_at on profiles;
create trigger set_profiles_updated_at before update on profiles for each row execute function update_updated_at();

drop trigger if exists set_products_updated_at on products;
create trigger set_products_updated_at before update on products for each row execute function update_updated_at();

drop trigger if exists set_customers_updated_at on customers;
create trigger set_customers_updated_at before update on customers for each row execute function update_updated_at();

drop trigger if exists set_orders_updated_at on orders;
create trigger set_orders_updated_at before update on orders for each row execute function update_updated_at();

drop trigger if exists set_suppliers_updated_at on suppliers;
create trigger set_suppliers_updated_at before update on suppliers for each row execute function update_updated_at();

-- Fixed cutoff + added missing triggers for configuration layers
drop trigger if exists set_expenses_updated_at on expenses;
create trigger set_expenses_updated_at before update on expenses for each row execute function update_updated_at();

drop trigger if exists set_business_settings_updated_at on business_settings;
create trigger set_business_settings_updated_at before update on business_settings for each row execute function update_updated_at();

drop trigger if exists set_application_preferences_updated_at on application_preferences;
create trigger set_application_preferences_updated_at before update on application_preferences for each row execute function update_updated_at();

drop trigger if exists set_dashboard_configurations_updated_at on dashboard_configurations;
create trigger set_dashboard_configurations_updated_at before update on dashboard_configurations for each row execute function update_updated_at();

drop trigger if exists set_default_categories_updated_at on default_categories;
create trigger set_default_categories_updated_at before update on default_categories for each row execute function update_updated_at();

drop trigger if exists set_operator_roles_updated_at on operator_roles;
create trigger set_operator_roles_updated_at before update on operator_roles for each row execute function update_updated_at();

drop trigger if exists set_permissions_updated_at on permissions;
create trigger set_permissions_updated_at before update on permissions for each row execute function update_updated_at();

drop trigger if exists set_ai_configurations_updated_at on ai_configurations;
create trigger set_ai_configurations_updated_at before update on ai_configurations for each row execute function update_updated_at();

drop trigger if exists set_notification_preferences_updated_at on notification_preferences;
create trigger set_notification_preferences_updated_at before update on notification_preferences for each row execute function update_updated_at();
