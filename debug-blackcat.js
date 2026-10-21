#!/usr/bin/env node

// Debug Blackcat API
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🔍 Debug Blackcat Integration\n");
console.log("API Key presente:", !!BLACKCAT_API_KEY);
console.log("API Key (primeiros 10 chars):", BLACKCAT_API_KEY?.substring(0, 10));

// Test 1: Check seller info (simpler endpoint)
async function testSeller() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 1: Consultando dados do vendedor...\n");

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/seller`, {
      method: "GET",
      headers: {
        "X-API-Key": BLACKCAT_API_KEY,
      },
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

// Test 2: Test with minimal payload
async function testMinimalPayload() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TEST 2: Testando com payload mínimo...\n");

  const minimalPayload = {
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
      email: "teste@test.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf",
      },
    },
  };

  console.log("Payload:");
  console.log(JSON.stringify(minimalPayload, null, 2));

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BLACKCAT_API_KEY,
      },
      body: JSON.stringify(minimalPayload),
    });

    const text = await response.text();
    console.log("\nStatus:", response.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Erro:", err.message);
  }
}

async function runTests() {
  await testSeller();
  await testMinimalPayload();
}

runTests();
