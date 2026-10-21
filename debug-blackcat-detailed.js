#!/usr/bin/env node

// Debug detalhado Blackcat
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🔧 DEBUG DETALHADO BLACKCAT\n");

// Teste 1: Verificar seller
async function testSeller() {
  console.log("TEST 1: Verificar dados do vendedor");
  console.log("─────────────────────────────────────\n");

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/seller`, {
      method: "GET",
      headers: {
        "X-API-Key": BLACKCAT_API_KEY,
      },
    });

    const data = await response.json();
    console.log("✅ Seller data:", JSON.stringify(data, null, 2));
    return data.data;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}

// Teste 2: Payload sem nenhum campo opcional
async function testMinimal() {
  console.log("\n\nTEST 2: Payload Mínimo (sem nenhum campo opcional)");
  console.log("─────────────────────────────────────\n");

  const payload = {
    amount: 100, // R$ 1.00 - valor bem pequeno
    paymentMethod: "pix",
    items: [{
      title: "Test",
      unitPrice: 100,
      quantity: 1,
    }],
    customer: {
      name: "Test",
      email: "test@test.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf",
      },
    },
  };

  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("\nResponse:");

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
    
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✅ PIX CRIADO COM SUCESSO!");
      return data.data;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  return null;
}

// Teste 3: Com mais informações
async function testWithDetails() {
  console.log("\n\nTEST 3: Com detalhes completos");
  console.log("─────────────────────────────────────\n");

  const payload = {
    amount: 6520,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "Produto",
      unitPrice: 6520,
      quantity: 1,
      tangible: false,
    }],
    customer: {
      name: "Cliente Teste",
      email: "cliente@teste.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf",
      },
    },
    metadata: "Teste de integração",
  };

  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("\nResponse:");

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
    
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✅ PIX CRIADO COM SUCESSO!");
      return data.data;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  return null;
}

// Teste 4: Tentar com Authorization header em vez de X-API-Key
async function testWithAuthHeader() {
  console.log("\n\nTEST 4: Tentando com Authorization header");
  console.log("─────────────────────────────────────\n");

  const payload = {
    amount: 6520,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "Teste",
      unitPrice: 6520,
      quantity: 1,
    }],
    customer: {
      name: "Teste",
      email: "teste@teste.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf",
      },
    },
  };

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BLACKCAT_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const data = JSON.parse(text);
    
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log("\n✅ PIX CRIADO COM SUCESSO!");
      return data.data;
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  return null;
}

async function runAllTests() {
  await testSeller();
  await testMinimal();
  await testWithDetails();
  await testWithAuthHeader();
}

runAllTests();
