#!/usr/bin/env node

// Teste SEM unitPrice - seguindo exatamente a documentação
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🔬 TESTE: Payload exatamente como na documentação\n");

// Exatamente como na documentação
const payloadDocumentacao = {
  amount: 6520, // R$ 65.20
  currency: "BRL",
  paymentMethod: "pix",
  items: [
    {
      title: "SHOPIFY LOJA 03",
      quantity: 1,
      tangible: false
    }
  ],
  customer: {
    name: "Cliente Shopify",
    email: "cliente@shopify.com",
    phone: "11999999999",
    document: {
      number: "12345678901",
      type: "cpf"
    }
  },
  pix: {
    expiresInDays: 1
  },
  postbackUrl: "https://suacnh-gov-br.netlify.app/webhook/payment",
  metadata: "Teste shopify loja 03",
  externalRef: "ORDER-SHOPIFY-001",
  utm_source: "shopify",
  utm_medium: "loja",
  utm_campaign: "loja_03"
};

async function testar() {
  console.log("📤 Payload:");
  console.log(JSON.stringify(payloadDocumentacao, null, 2));
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BLACKCAT_API_KEY,
      },
      body: JSON.stringify(payloadDocumentacao),
    });

    const text = await response.text();
    console.log("Status HTTP:", response.status);
    console.log("\n📥 Response:");
    
    try {
      const data = JSON.parse(text);
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log("\n✅ SUCESSO! PIX GERADO!");
        console.log("\n🎯 DADOS DO PIX:");
        console.log("Transaction ID:", data.data.transactionId);
        console.log("Status:", data.data.status);
        console.log("Amount:", `R$ ${(data.data.amount / 100).toFixed(2)}`);
        
        if (data.data.paymentData) {
          console.log("\n📋 Payment Data:");
          console.log("QR Code:", data.data.paymentData.qrCode?.substring(0, 60) + "...");
          console.log("Copy-Paste:", data.data.paymentData.copyPaste?.substring(0, 60) + "...");
          console.log("Expires:", data.data.paymentData.expiresAt);
        }
      }
    } catch (e) {
      console.log(text);
    }
  } catch (err) {
    console.error("❌ Erro:", err.message);
  }
}

testar();
