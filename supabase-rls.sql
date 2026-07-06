-- Tenant-aware RLS policies for Eenvoq
-- This assumes the app uses one Supabase database and scopes rows by business_id/tenant_id.

alter table if exists profiles enable row level security;
alter table if exists businesses enable row level security;
alter table if exists business_settings enable row level security;
alter table if exists application_preferences enable row level security;
alter table if exists dashboard_configurations enable row level security;
alter table if exists default_categories enable row level security;
alter table if exists operator_roles enable row level security;
alter table if exists permissions enable row level security;
alter table if exists ai_configurations enable row level security;
alter table if exists notification_preferences enable row level security;
alter table if exists products enable row level security;
alter table if exists customers enable row level security;
alter table if exists orders enable row level security;
alter table if exists suppliers enable row level security;
alter table if exists expenses enable row level security;
alter table if exists audit_logs enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    null
  )::uuid;
$$;

create or replace function public.current_profile_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from public.profiles where user_id = auth.uid() order by created_at desc limit 1;
$$;

create policy if not exists profiles_select_own
  on public.profiles for select
  using (user_id = auth.uid());

create policy if not exists profiles_manage_own
  on public.profiles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy if not exists businesses_select_own
  on public.businesses for select
  using (
    id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists businesses_update_own
  on public.businesses for update
  using (
    id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_select
  on public.products for select
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_insert
  on public.products for insert
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_update
  on public.products for update
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_delete
  on public.products for delete
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_select_customers
  on public.customers for select
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_insert_customers
  on public.customers for insert
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_update_customers
  on public.customers for update
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_select_orders
  on public.orders for select
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_insert_orders
  on public.orders for insert
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_update_orders
  on public.orders for update
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_select_suppliers
  on public.suppliers for select
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_insert_suppliers
  on public.suppliers for insert
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_update_suppliers
  on public.suppliers for update
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_select_expenses
  on public.expenses for select
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_insert_expenses
  on public.expenses for insert
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );

create policy if not exists tenant_scoped_update_expenses
  on public.expenses for update
  using (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  )
  with check (
    business_id in (
      select business_id from public.profiles where user_id = auth.uid()
    )
  );
