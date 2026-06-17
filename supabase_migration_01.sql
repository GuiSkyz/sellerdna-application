-- 1. ADICIONAR COLUNAS FALTANTES NA TABELA listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS visits INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS health REAL DEFAULT NULL;

-- 2. HABILITAR RLS (Row Level Security) EM TODAS AS TABELAS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadolivre_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mercadolivre_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLICIES PARA GARANTIR QUE USUÁRIOS SÓ ACESSAM SEUS PRÓPRIOS DADOS

-- Users
CREATE POLICY "Users can access their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- Products
CREATE POLICY "Users can access their own products" ON products
  FOR ALL USING (auth.uid() = user_id);

-- ML Accounts
CREATE POLICY "Users can access their own accounts" ON mercadolivre_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ML Tokens (join com accounts)
CREATE POLICY "Users can access tokens for their accounts" ON mercadolivre_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mercadolivre_accounts a
      WHERE a.id = mercadolivre_tokens.account_id AND a.user_id = auth.uid()
    )
  );

-- Listings (join com accounts)
CREATE POLICY "Users can access listings for their accounts" ON listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM mercadolivre_accounts a
      WHERE a.id = listings.account_id AND a.user_id = auth.uid()
    )
  );

-- Demais tabelas (se usadas)
CREATE POLICY "Users can access their own activity" ON activity_logs
  FOR ALL USING (auth.uid() = user_id);
