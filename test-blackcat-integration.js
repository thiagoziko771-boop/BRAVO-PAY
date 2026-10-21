#!/usr/bin/env node

// Test Blackcat PIX Integration
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

if (!BLACKCAT_API_KEY) {
  console.error("❌ BLACKCAT_API_KEY_SECRET não configurada!");
  process.exit(1);
}

const testPayload = {
  amount: 6520, // R$ 65.20
  currency: "BRL",
  paymentMethod: "pix",
  items: [{
    title: "SHOPIFY LOJA 03",
    unitPrice: 6520,
    quantity: 1,
    tangible: false,
  }],
  customer: {
    name: "Shopify Teste",
    email: "teste@shopify.com",
    phone: "11999999999",
    document: {
      number: "12345678901",
      type: "cpf",
    },
  },
  pix: {
    expiresInDays: 1,
  },
  postbackUrl: "https://suacnh-gov-br.netlify.app/webhook/payment",
  externalRef: `order_${Date.now()}`,
  utm_source: "shopify",
  utm_medium: "loja",
  utm_campaign: "test",
};

async function testBlackcatIntegration() {
  console.log("🔄 Testando integração Blackcat...\n");
  console.log("Payload enviado:");
  console.log(JSON.stringify(testPayload, null, 2));
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BLACKCAT_API_KEY,
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    console.log("📊 Status HTTP:", response.status);
    console.log("📋 Resposta:");
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log(JSON.stringify(responseJson, null, 2));

      if (responseJson.success && responseJson.data) {
        console.log("\n✅ PIX GERADO COM SUCESSO!\n");
        console.log("📍 Transaction ID:", responseJson.data.transactionId);
        console.log("💰 Amount:", `R$ ${(responseJson.data.amount / 100).toFixed(2)}`);
        console.log("📊 Status:", responseJson.data.status);
        console.log("💳 Payment Method:", responseJson.data.paymentMethod);
        
        if (responseJson.data.paymentData) {
          console.log("\n🔐 Dados do PIX:");
          console.log("Copy-Paste:", responseJson.data.paymentData.copyPaste?.substring(0, 50) + "...");
          console.log("QR Code Base64:", responseJson.data.paymentData.qrCodeBase64 ? "✓ Disponível" : "✗ Não disponível");
          console.log("Expires At:", responseJson.data.paymentData.expiresAt);
        }
        
        if (responseJson.data.invoiceUrl) {
          console.log("\n🔗 Invoice URL:", responseJson.data.invoiceUrl);
        }
      } else {
        console.log("\n❌ Erro na resposta:", responseJson.message || "Resposta inválida");
      }
    } catch (e) {
      console.log(responseText);
    }
  } catch (err) {
    console.error("❌ Erro ao testar:", err.message);
    process.exit(1);
  }
}

testBlackcatIntegration();
