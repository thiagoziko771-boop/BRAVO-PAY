const https = require('https');

/**
 * Integração com AVENPAY Gateway
 * Gera pagamento PIX com valor do frontend
 */

function criarPagamentoAvenpay(amount, nome, email, cpf) {
  return new Promise((resolve) => {
    // Converter para centavos (65.20 = 6520)
    const amountInCents = Math.round(amount * 100);

    const payload = {
      amount: amountInCents,
      currency: "BRL",
      method: "PIX",
      description: "Pagamento via Gateway AVENPAY",
      externalRef: `order_${Date.now()}`,
      notificationUrl: "https://suacnh-gov-br.netlify.app/webhook/payment",
      payer: {
        name: nome,
        taxId: cpf,
        email: email,
        phone: "11987654321",
      },
      items: [
        {
          quantity: 1,
          name: "Serviço/Produto",
          price: amountInCents,
          type: "DIGITAL",
        },
      ],
    };

    const payloadBuffer = Buffer.from(JSON.stringify(payload));

    const options = {
      hostname: 'api.avenpayments.com',
      port: 443,
      path: '/v1/payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payloadBuffer.length,
        'Authorization': `Bearer ${process.env.AVEN_API_KEY || 'SUA_CHAVE_DE_API'}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => { 
        data += chunk; 
      });

      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          
          if (body.success || body.pix_code || body.id) {
            console.log(`\n✅ PIX R$ ${amount.toFixed(2)} GERADO COM SUCESSO!`);
            console.log(`   ═══════════════════════════════════════════════`);
            console.log(`   Transaction ID: ${body.transaction_id || body.id}`);
            console.log(`   Código PIX: ${body.pix_code || 'Gerando...'}`);
            console.log(`   Status: ${body.status || 'PENDING'}`);
            console.log(`   Cliente: ${nome}`);
            console.log(`   Email: ${email}`);
            console.log(`   CPF: ${cpf}`);
            console.log(`   Valor: R$ ${amount.toFixed(2)}`);
            console.log(`   ═══════════════════════════════════════════════\n`);
            resolve(body);
          } else {
            console.log(`\n❌ Erro ao gerar PIX R$ ${amount.toFixed(2)}`);
            console.log(`   Resposta: ${JSON.stringify(body, null, 2)}\n`);
            resolve(body);
          }
        } catch(e) {
          console.log(`\n❌ Erro ao processar resposta: ${e.message}\n`);
          resolve({ error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`\n❌ Erro de conexão: ${e.message}`);
      console.log(`   Verifique se AVENPAY_API_KEY está configurada corretamente.\n`);
      resolve({ error: e.message });
    });

    req.write(payloadBuffer);
    req.end();
  });
}

/**
 * TESTE PRINCIPAL
 * Valor do frontend: R$ 65,20
 */
(async () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         TESTE INTEGRAÇÃO AVENPAY GATEWAY                    ║');
  console.log('║          Valor: R$ 65,20 (6520 centavos)                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n🔄 Gerando PIX via AVENPAY...\n');
  
  // Teste com valor de 65,20 (valor do frontend)
  const resultado = await criarPagamentoAvenpay(
    65.20,  // Valor em reais
    'Teste AVENPAY',  // Nome
    'teste@avenpay.com',  // Email
    '11144477735'  // CPF
  );

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║ RESPOSTA COMPLETA DA API:                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(JSON.stringify(resultado, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('✅ TESTE AVENPAY GATEWAY FINALIZADO!');
  console.log('═'.repeat(60) + '\n');
})();
