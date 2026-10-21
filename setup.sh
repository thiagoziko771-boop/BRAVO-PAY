#!/bin/bash

# ============================================
# SUPABASE SETUP SCRIPT
# ============================================

# CONFIGURE SUAS CREDENCIAIS:
PROJECT_URL="https://villasxvrrykftwabunz.supabase.co"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-sb_secret_XXXXXXXXXXXXXXXXXXXX}"

echo "🚀 Setup Supabase"
echo "================="

# SQL para criar tabelas
SQL_TABLES="
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

CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_tx ON comprovantes(transaction_id);
"

echo "📌 Para completar o setup:"
echo ""
echo "1️⃣  Acesse: https://supabase.com/dashboard/project/villasxvrrykftwabunz/sql/new"
echo ""
echo "2️⃣  Cole este SQL e execute:"
echo ""
echo "---BEGIN SQL---"
echo "$SQL_TABLES"
echo "---END SQL---"
echo ""
echo "3️⃣  Depois acesse: https://supabase.com/dashboard/project/villasxvrrykftwabunz/storage/buckets"
echo ""
echo "4️⃣  Crie um novo bucket chamado 'comprovantes' e deixe como Public"
echo ""
echo "✅ Pronto!"
