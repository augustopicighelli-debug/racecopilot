-- =============================================================================
-- RaceCopilot - Tabla nutrition_products
-- Ejecutar en Supabase: SQL Editor → New Query → pegar y Run
-- PREREQUISITO: 01_schema.sql ya ejecutado (tabla runners debe existir)
-- =============================================================================

-- Borrar tabla si existe (para re-ejecución limpia)
drop table if exists nutrition_products cascade;

-- -----------------------------------------------------------------------------
-- nutrition_products: productos de nutrición del corredor (geles, pastillas)
-- Referencia al runner via runner_id para respetar el patrón del esquema
-- -----------------------------------------------------------------------------
create table nutrition_products (
  id           uuid primary key default uuid_generate_v4(),
  runner_id    uuid references runners(id) on delete cascade not null,
  name         text not null,
  type         text not null check (type in ('gel', 'salt_pill')),
  carbs_grams  numeric(5,1) not null default 0,
  sodium_mg    int not null default 0,
  caffeine_mg  int not null default 0,
  created_at   timestamptz default now()
);

-- Activar RLS (Row Level Security) igual que reference_races
alter table nutrition_products enable row level security;

-- Política SELECT: solo puede ver sus propios productos
create policy "nutrition_product: select propio" on nutrition_products
  for select using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

-- Política INSERT: solo puede insertar en su propio runner
create policy "nutrition_product: insert propio" on nutrition_products
  for insert with check (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

-- Política DELETE: solo puede borrar sus propios productos
create policy "nutrition_product: delete propio" on nutrition_products
  for delete using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );
