-- Guarda el clima usado al generar el último plan.
-- Se usa para detectar cambios significativos 24hs antes de la carrera
-- y enviar un email de alerta al corredor.

ALTER TABLE races
  ADD COLUMN IF NOT EXISTS last_plan_weather JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_plan_at      TIMESTAMPTZ DEFAULT NULL;
