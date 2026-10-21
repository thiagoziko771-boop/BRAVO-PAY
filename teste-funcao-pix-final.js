#!/usr/bin/env node

// Simular a função handler do Netlify
require("dotenv").config({ path: ".env.local" });

const handler = require("./functions/pix.js").handler;

async function testar(valor, nome) {
  console.log(`\n${"═".repeat(70)}`);
  console.log(`TEST: ${nome}`);
  console.log(`VALOR: R$ ${(valor / 100).toFixed(2)}`);
  console.log("═".repeat(70));

  const event = {
    httpMethod: "POST",
    body: JSON.stringify({
      amount: valor / 100, // Em reais
      nome: "Cliente Teste",
      email: "cliente@shopify.com",
      phone: "11999999999",
      utm: {
        utm_source: "shopify",
        utm_medium: "loja",
        utm_campaign: "loja_03",
      }
    }),
  };

  try {
    const response = await handler(event);
    console.log("\nStatus:", response.statusCode);
    
    const body = JSON.parse(response.body);
    
    if (body.success) {
      console.log("\n✅✅✅ PIX GERADO COM SUCESSO! ✅✅✅\n");
      console.log("📊 Detalhes:");
      console.log("  └─ Transaction ID:", body.transaction_id);
      console.log("  └─ Status:", body.status);
      console.log("  └─ Amount:", `R$ ${(body.pixCode ? "Gerado" : "Erro")}`);
      
      if (body.pixCode) {
        console.log("\n🎯 PIX COPY-PASTE (primeiros 80 chars):");
        console.log("  " + body.pixCode.substring(0, 80) + "...");
        
        console.log("\n📋 PIX Completo:");
        console.log(body.pixCode);
      }
      
      if (body.qrCodeBase64) {
        console.log("\n✓ QR Code Base64 disponível");
      }
      
      if (body.invoiceUrl) {
        console.log("\n🔗 URL de Pagamento:");
        console.log("  " + body.invoiceUrl);
      }
      
      return true;
    } else {
      console.log("\n❌ Erro:", body.error);
      console.log("Debug:", body.debug);
      return false;
    }
  } catch (err) {
    console.error("❌ Erro na execução:", err.message);
    console.error(err);
    return false;
  }
}

async function runTests() {
  await testar(6520, "Valor Padrão - R$ 65.20");
  await testar(7970, "Upsell - R$ 79.70");
  await testar(9740, "Upsell Alto - R$ 97.40");
}

runTests();
