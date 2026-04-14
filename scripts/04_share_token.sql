-- Agrega share_token a la tabla races.
-- Un token UUID único por carrera, generado on-demand.
-- NULL = carrera no compartida todavía.

ALTER TABLE races
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL;

-- Índice para lookup rápido por token
CREATE UNIQUE INDEX IF NOT EXISTS races_share_token_idx ON races (share_token)
  WHERE share_token IS NOT NULL;
