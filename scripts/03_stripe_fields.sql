-- =============================================================================
-- RaceCopilot - Campos de Stripe en runners
-- Ejecutar en Supabase: SQL Editor → New Query → pegar y Run
-- Agrega las columnas necesarias para gestionar suscripciones con Stripe.
-- Usa "if not exists" para que sea seguro correrlo más de una vez.
-- =============================================================================

-- ID del cliente en Stripe (se crea la primera vez que va al checkout)
alter table runners add column if not exists stripe_customer_id text;

-- ID de la suscripción activa en Stripe
alter table runners add column if not exists stripe_subscription_id text;

-- Flag de acceso premium (se actualiza vía webhook)
alter table runners add column if not exists is_premium boolean default false;

-- Fecha hasta la que tiene acceso (= current_period_end de Stripe)
alter table runners add column if not exists premium_until timestamptz;
