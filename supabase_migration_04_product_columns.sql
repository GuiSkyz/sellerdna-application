-- Migration 04: Garantir que a tabela products possui as colunas para Mercado Livre e atributos de anúncio

ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Novo';
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_type_id TEXT DEFAULT 'gold_special';
ALTER TABLE products ADD COLUMN IF NOT EXISTS gtin TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_type TEXT DEFAULT 'Garantia do vendedor';
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty_time TEXT DEFAULT '30 dias';
ALTER TABLE products ADD COLUMN IF NOT EXISTS ml_category_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ml_attributes JSONB DEFAULT '{}'::jsonb;
