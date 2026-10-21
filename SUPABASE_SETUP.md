# Setup Supabase - Novo Projeto

## Credenciais
- **URL**: https://villasxvrrykftwabunz.supabase.co
- **Service Key**: Veja em Settings > API no seu projeto Supabase (seção "Secret keys")

## ⚠️ SEGURANÇA
NÃO compartilhe sua Service Key em público! Use `.env.local` para armazenar.

## Passo 1: Criar Tabelas

Acesse o SQL Editor do Supabase:
https://supabase.com/dashboard/project/villasxvrrykftwabunz/sql/new

Cole e execute este SQL:

```sql
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_comprovantes_tx ON comprovantes(transaction_id);
```

## Passo 2: Criar Bucket de Storage

Acesse o Storage:
https://supabase.com/dashboard/project/villasxvrrykftwabunz/storage/buckets

1. Clique em **Create a new bucket**
2. Nome: `comprovantes`
3. Deixe marcado: **Public**
4. Clique em **Create bucket**

## Passo 3: Configurar Políticas de Upload

No bucket `comprovantes`, vá em **Policies** e adicione:

```
- Policy Name: "Allow anyone to upload"
- Target roles: public
- Permissions: SELECT, INSERT
- Operation: INSERT
- MIME types: image/*
```

## Resultado Final

✅ Tabelas criadas:
- `transactions` - Armazena dados de transações PIX
- `comprovantes` - Armazena dados de uploads de comprovantes

✅ Bucket criado:
- `comprovantes` - Armazena imagens dos comprovantes

## Como Funciona

1. Usuário paga PIX → Salvo em `transactions`
2. Usuário envia comprovante → Imagem salva no bucket, dados em `comprovantes`
3. Você vê tudo no Supabase Dashboard

---

**Status**: ⏳ Aguardando execução manual no Supabase
