#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

async function testar(nome, payload) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`TEST: ${nome}`);
  console.log("═".repeat(60));
  console.log("Payload:", JSON.stringify(payload, null, 2));

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

    console.log("\nStatus:", response.status);
    
    if (data.success && data.data) {
      console.log("✅ SUCESSO! Transaction:", data.data.transactionId);
      if (data.data.paymentData?.copyPaste) {
        console.log("PIX:", data.data.paymentData.copyPaste.substring(0, 60) + "...");
      }
      return true;
    } else {
      console.log("❌ Erro:", data.message || data.error);
      return false;
    }
  } catch (err) {
    console.error("❌ Network Error:", err.message);
    return false;
  }
}

async function runTests() {
  // Teste 1: Mais simples possível
  await testar("Payload MÍNIMO ABSOLUTO", {
    amount: 100,
    paymentMethod: "pix",
    items: [{
      title: "Item",
      unitPrice: 100,
      quantity: 1
    }],
    customer: {
      name: "Nome",
      email: "email@email.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf"
      }
    }
  });

  // Teste 2: Com currency
  await testar("COM currency: BRL", {
    amount: 100,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "Item",
      unitPrice: 100,
      quantity: 1
    }],
    customer: {
      name: "Nome",
      email: "email@email.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf"
      }
    }
  });

  // Teste 3: Com description/metadata
  await testar("COM description", {
    amount: 100,
    currency: "BRL",
    paymentMethod: "pix",
    description: "Teste",
    items: [{
      title: "Item",
      unitPrice: 100,
      quantity: 1
    }],
    customer: {
      name: "Nome",
      email: "email@email.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf"
      }
    }
  });

  // Teste 4: Valor maior
  await testar("COM valor maior (R$ 65.20)", {
    amount: 6520,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "SHOPIFY LOJA 03",
      unitPrice: 6520,
      quantity: 1
    }],
    customer: {
      name: "Cliente",
      email: "cliente@shopify.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf"
      }
    }
  });

  // Teste 5: Com todos os campos opcionais
  await testar("COM TODOS os campos", {
    amount: 6520,
    currency: "BRL",
    paymentMethod: "pix",
    description: "SHOPIFY LOJA 03",
    items: [{
      title: "SHOPIFY LOJA 03",
      unitPrice: 6520,
      quantity: 1,
      tangible: false
    }],
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
    externalRef: "ORDER-001",
    metadata: "Teste completo",
    utm_source: "shopify",
    utm_medium: "loja",
    utm_campaign: "test"
  });
}

runTests();
