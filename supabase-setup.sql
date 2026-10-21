-- Tabela de Transações
CREATE TABLE IF NOT EXISTS transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
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

-- Tabela de Comprovantes
CREATE TABLE IF NOT EXISTS comprovantes (
  id BIGSERIAL PRIMARY KEY,
  transaction_id VARCHAR(255),
  cpf VARCHAR(11),
  nome VARCHAR(255),
  arquivo TEXT,
  status VARCHAR(50) DEFAULT 'pending_approval',
  extra JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_tx ON comprovantes(transaction_id);
