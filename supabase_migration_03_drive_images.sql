-- Migration 03: Adicionar suporte para múltiplas imagens e pasta do Google Drive

-- Adiciona a coluna image_urls do tipo JSONB para armazenar um array de URLs de imagens
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Adiciona a coluna drive_folder_id na tabela users para guardar a pasta base do cliente
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
