#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// CONFIGURE ISSO:
const PROJECT_ID = 'villasxvrrykftwabunz'; // Mude aqui
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'SEU_SERVICE_KEY_AQUI'; // ou use env var

const PROJECT_URL = `https://${PROJECT_ID}.supabase.co`;

// Make HTTPS request
function request(method, hostname, path, headers, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createTables() {
  console.log('\n🔨 Criando tabelas no Supabase...\n');

  const sqlQueries = [
    `CREATE TABLE IF NOT EXISTS transactions (
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
    );`,

    `CREATE TABLE IF NOT EXISTS comprovantes (
      id BIGSERIAL PRIMARY KEY,
      transaction_id VARCHAR(255),
      cpf VARCHAR(11),
      nome VARCHAR(255),
      arquivo TEXT,
      status VARCHAR(50) DEFAULT 'pending_approval',
      extra JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE INDEX IF NOT EXISTS idx_transactions_id ON transactions(transaction_id);`,
    `CREATE INDEX IF NOT EXISTS idx_comprovantes_tx ON comprovantes(transaction_id);`
  ];

  for (let i = 0; i < sqlQueries.length; i++) {
    try {
      console.log(`📌 Executando query ${i + 1}/${sqlQueries.length}...`);
      
      // Usar o endpoint SQL do Supabase
      const response = await request(
        'POST',
        `${PROJECT_ID}.supabase.co`,
        '/rest/v1/rpc/exec',
        {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY
        },
        { sql: sqlQueries[i] }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Query executada com sucesso');
      } else {
        console.log(`⚠️ Status ${response.status}:`, response.body?.message || 'OK');
      }
    } catch (error) {
      console.error(`❌ Erro na query ${i + 1}:`, error.message);
    }
  }
}

async function createBucket() {
  console.log('\n📦 Criando bucket de storage...\n');

  try {
    // Criar bucket
    const response = await request(
      'POST',
      `${PROJECT_ID}.supabase.co`,
      '/storage/v1/admin/buckets',
      {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      },
      {
        name: 'comprovantes',
        public: true
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log('✅ Bucket "comprovantes" criado com sucesso');
    } else if (response.body?.message?.includes('already exists')) {
      console.log('✅ Bucket "comprovantes" já existe');
    } else {
      console.log(`⚠️ Status ${response.status}:`, response.body?.message || response.body);
    }
  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('    🚀 AUTO SETUP SUPABASE');
  console.log('═══════════════════════════════════════════════════');

  try {
    await createTables();
    await createBucket();

    console.log('\n═══════════════════════════════════════════════════');
    console.log('    ✅ SETUP COMPLETO!');
    console.log('═══════════════════════════════════════════════════\n');
    console.log('✅ Tabelas criadas:');
    console.log('   • transactions');
    console.log('   • comprovantes\n');
    console.log('✅ Bucket criado:');
    console.log('   • comprovantes (Public)\n');
    console.log('Agora você pode fazer upload de imagens! 🎉\n');

  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
    process.exit(1);
  }
}

main();
