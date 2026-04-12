-- =============================================================================
-- RaceCopilot - Schema inicial
-- Ejecutar en Supabase: SQL Editor → New Query → pegar y Run
-- NOTA: usa DROP + CREATE para garantizar estructura limpia
-- =============================================================================

create extension if not exists "uuid-ossp";

-- Borrar tablas existentes (en orden por dependencias FK)
drop table if exists races cascade;
drop table if exists reference_races cascade;
drop table if exists runners cascade;

-- -----------------------------------------------------------------------------
-- runners: perfil del corredor, uno por usuario auth
-- -----------------------------------------------------------------------------
create table runners (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null unique,
  weight_kg   numeric(5,2) not null,
  height_cm   numeric(5,1) not null,
  sweat_level text not null check (sweat_level in ('low', 'medium', 'high')),
  max_hr      int,
  weekly_km   numeric(6,1),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table runners enable row level security;

create policy "runner: select propio" on runners
  for select using (auth.uid() = user_id);

create policy "runner: insert propio" on runners
  for insert with check (auth.uid() = user_id);

create policy "runner: update propio" on runners
  for update using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- reference_races: carreras pasadas (para calibrar el predictor)
-- -----------------------------------------------------------------------------
create table reference_races (
  id              uuid primary key default uuid_generate_v4(),
  runner_id       uuid references runners(id) on delete cascade not null,
  distance_km     numeric(6,3) not null,
  time_seconds    int not null,
  race_date       date not null,
  race_type       text not null check (race_type in ('race', 'training')),
  avg_heart_rate  int,
  temperature_c   numeric(4,1),
  humidity_pct    int,
  notes           text,
  created_at      timestamptz default now()
);

alter table reference_races enable row level security;

create policy "ref_race: select propio" on reference_races
  for select using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

create policy "ref_race: insert propio" on reference_races
  for insert with check (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

create policy "ref_race: delete propio" on reference_races
  for delete using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- races: carreras futuras que el usuario quiere planificar
-- -----------------------------------------------------------------------------
create table races (
  id              uuid primary key default uuid_generate_v4(),
  runner_id       uuid references runners(id) on delete cascade not null,
  name            text not null,
  distance_km     numeric(6,3) not null,
  race_date       date not null,
  city            text,
  country         text,
  target_time_s   int,
  gpx_url         text,
  elevation_gain  numeric(7,1),
  created_at      timestamptz default now()
);

alter table races enable row level security;

create policy "race: select propio" on races
  for select using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

create policy "race: insert propio" on races
  for insert with check (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

create policy "race: update propio" on races
  for update using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );

create policy "race: delete propio" on races
  for delete using (
    exists (select 1 from runners r where r.id = runner_id and r.user_id = auth.uid())
  );
