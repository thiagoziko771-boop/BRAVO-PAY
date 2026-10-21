-- ========================================
-- CRIAR TABELAS NO SUPABASE
-- ========================================
-- Cole isso no SQL Editor do Supabase e execute

-- Tabela: transactions
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10, 2),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_cpf VARCHAR(11),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  brcode TEXT,
  utm_source VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_medium VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: comprovantes
CREATE TABLE IF NOT EXISTS comprovantes (
  id BIGSERIAL PRIMARY KEY,
  transaction_id VARCHAR(255),
  cpf VARCHAR(11),
  nome VARCHAR(255),
  arquivo TEXT,
  status VARCHAR(50) DEFAULT 'pending_approval',
  extra JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_tx ON comprovantes(transaction_id);

-- ========================================
-- INSTRUÇÕES FINAIS:
-- ========================================
-- 1. Após executar este SQL, vá em Storage
-- 2. Crie um novo bucket chamado "comprovantes"
-- 3. Deixe ele como Public
-- 4. Pronto! Upload funciona
