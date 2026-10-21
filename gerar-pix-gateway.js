#!/usr/bin/env node

// Gerar PIX na Gateway Blackcat
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("💰 GERANDO PIX NA GATEWAY BLACKCAT\n");
console.log("=====================================\n");

async function gerarPix(valor, descricao) {
  console.log(`📍 Gerando PIX de R$ ${(valor / 100).toFixed(2)} - ${descricao}`);
  console.log("-----------------------------------\n");

  const payload = {
    amount: valor,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "SHOPIFY LOJA 03",
      unitPrice: valor,
      quantity: 1,
      tangible: false,
    }],
    customer: {
      name: "SHOPIFY LOJA 03",
      email: "shopify@loja03.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf",
      },
    },
    pix: {
      expiresInDays: 1,
    },
    externalRef: `shopify_loja03_${Date.now()}`,
    utm_source: "shopify",
    utm_medium: "loja",
    utm_campaign: "loja_03",
  };

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
    const data = JSON.parse(text);

    if (data.success && data.data) {
      console.log("✅ PIX GERADO COM SUCESSO!\n");
      console.log("📊 Detalhes da Transação:");
      console.log("  └─ ID:", data.data.transactionId);
      console.log("  └─ Valor:", `R$ ${(data.data.amount / 100).toFixed(2)}`);
      console.log("  └─ Líquido:", `R$ ${(data.data.netAmount / 100).toFixed(2)}`);
      console.log("  └─ Taxa:", `R$ ${(data.data.fees / 100).toFixed(2)}`);
      console.log("  └─ Status:", data.data.status);
      
      if (data.data.paymentData) {
        console.log("\n🔐 Dados do PIX:");
        console.log("  └─ Copy-Paste (primeiros 50 chars):", data.data.paymentData.copyPaste?.substring(0, 50) + "...");
        console.log("  └─ Expira em:", data.data.paymentData.expiresAt);
        console.log("  └─ QR Code Base64:", data.data.paymentData.qrCodeBase64 ? "✓ Disponível" : "✗ Não disponível");
      }
      
      if (data.data.invoiceUrl) {
        console.log("\n🔗 URL para Pagamento:");
        console.log("  └─", data.data.invoiceUrl);
      }
      
      console.log("\n=====================================\n");
      return data.data;
    } else {
      console.log("❌ ERRO:", data.message || data.error);
      console.log("Status HTTP:", response.status);
      console.log("\n=====================================\n");
      return null;
    }
  } catch (err) {
    console.error("❌ Erro ao conectar:", err.message);
    console.log("\n=====================================\n");
    return null;
  }
}

async function gerarTodos() {
  // Gerar PIX para diferentes valores
  await gerarPix(6520, "Valor Padrão");   // R$ 65.20
  await gerarPix(7970, "Upsell");         // R$ 79.70
  await gerarPix(9740, "Upsell Alto");    // R$ 97.40
}

gerarTodos();
