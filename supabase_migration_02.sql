-- 1. ADICIONAR COLUNA product_type NA TABELA products
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'Perfume';

-- Como os produtos atuais (se houver) provavelmente são perfumes, o default 'Perfume' faz sentido para o legado.
