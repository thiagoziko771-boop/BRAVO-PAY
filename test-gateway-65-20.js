/**
 * Teste de Gateway - Valor R$ 65,20
 * Chama a função serverless pix-aven que já está funcionando
 */

const https = require('https');

function chamarGateway(valor) {
  return new Promise((resolve) => {
    const payload = {
      amount: valor,
      nome: 'Teste Gateway 65,20',
      email: 'teste@avenpay.com',
      cpf: '11144477735',
      phone: '11987654321',
    };

    const payloadBuffer = Buffer.from(JSON.stringify(payload));

    // Chama a função serverless que já está deployada
    const options = {
      hostname: 'suacnh-gov-br.netlify.app',
      port: 443,
      path: '/api/pix', // Função serverless existente
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payloadBuffer.length,
      }
    };

    console.log('\n🔄 Chamando gateway com valor R$ ' + valor.toFixed(2) + '...\n');

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
            console.log('║              ✅ PIX GERADO COM SUCESSO!                     ║');
            console.log('╚════════════════════════════════════════════════════════════╝\n');
            
            console.log(`📊 Dados do Pagamento:`);
            console.log(`   Valor: R$ ${valor.toFixed(2)}`);
            console.log(`   Status: ${body.status}`);
            console.log(`   Transaction ID: ${body.transaction_id}`);
            console.log(`\n📋 Código PIX (copia e cola):`);
            console.log(`   ${body.pixCode}\n`);
            
            console.log(`📸 QR Code:`);
            console.log(`   ${body.qr_code_image || 'Gerar via frontend'}\n`);
            
            console.log('═'.repeat(60) + '\n');
            resolve(body);
          } else if (body.error) {
            console.log('❌ Erro:', body.error);
            console.log('Debug:', body.debug);
            resolve(body);
          } else {
            console.log('⚠️  Resposta inesperada:');
            console.log(JSON.stringify(body, null, 2));
            resolve(body);
          }
        } catch(e) {
          console.log('❌ Erro ao processar resposta:', e.message);
          console.log('Resposta bruta:', data);
          resolve({ error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ Erro de conexão:', e.message);
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
  console.log('║           GATEWAY AVENPAY - TESTE R$ 65,20                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Teste com valor 65.20
  const resultado = await chamarGateway(65.20);

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              RESPOSTA COMPLETA DA GATEWAY                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(JSON.stringify(resultado, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('✅ TESTE FINALIZADO!');
  console.log('═'.repeat(60) + '\n');
})();
