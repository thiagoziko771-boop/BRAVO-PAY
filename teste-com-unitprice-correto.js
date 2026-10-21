#!/usr/bin/env node

// Teste COM unitPrice - campo obrigatório conforme documentação
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🔬 TESTE: Com unitPrice OBRIGATÓRIO\n");

// A documentação diz: unitPrice é OBRIGATÓRIO na tabela de parâmetros
const payload = {
  amount: 6520, // R$ 65.20
  currency: "BRL",
  paymentMethod: "pix",
  items: [
    {
      title: "SHOPIFY LOJA 03",
      unitPrice: 6520,  // AGORA COM unitPrice
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
  externalRef: "ORDER-SHOPIFY-001"
};

async function testar() {
  console.log("📤 Payload COM unitPrice:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BLACKCAT_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    console.log("Status HTTP:", response.status);
    console.log("\n📥 Response:");
    
    const data = JSON.parse(text);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log("\n✅✅✅ SUCESSO! PIX GERADO NA GATEWAY! ✅✅✅\n");
      console.log("🎯 DADOS DO PIX:");
      console.log("  Transaction ID:", data.data.transactionId);
      console.log("  Status:", data.data.status);
      console.log("  Valor:", `R$ ${(data.data.amount / 100).toFixed(2)}`);
      console.log("  Líquido:", `R$ ${(data.data.netAmount / 100).toFixed(2)}`);
      console.log("  Taxa:", `R$ ${(data.data.fees / 100).toFixed(2)}`);
      
      if (data.data.paymentData) {
        console.log("\n📋 DADOS DO PIX:");
        if (data.data.paymentData.copyPaste) {
          console.log("  Copy-Paste PIX:", data.data.paymentData.copyPaste);
        }
        if (data.data.paymentData.qrCode) {
          console.log("  QR Code:", data.data.paymentData.qrCode?.substring(0, 80) + "...");
        }
        if (data.data.paymentData.qrCodeBase64) {
          console.log("  QR Code Base64:", "✓ Disponível");
        }
        console.log("  Expira em:", data.data.paymentData.expiresAt);
      }
      
      if (data.data.invoiceUrl) {
        console.log("\n🔗 URL para Pagamento:", data.data.invoiceUrl);
      }
    }
  } catch (err) {
    console.error("❌ Erro:", err.message);
  }
}

testar();
