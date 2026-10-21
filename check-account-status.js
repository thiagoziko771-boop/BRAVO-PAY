#!/usr/bin/env node

// Check Blackcat account status
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🔍 Checking Blackcat Account Status\n");

async function checkSeller() {
  console.log("Getting seller information...\n");
  
  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/seller`, {
      method: "GET",
      headers: {
        "X-API-Key": BLACKCAT_API_KEY,
      },
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log("\n✅ Account Details:");
      console.log("Name:", data.data.name);
      console.log("Legal Name:", data.data.legalName);
      console.log("CNPJ:", data.data.cnpj);
      console.log("Logo:", data.data.logo ? "✓ Configured" : "✗ Not configured");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function testPixCreation() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nAttempting to create PIX...\n");

  // Try with even simpler payload
  const payload = {
    amount: 1000, // R$ 10.00 - simpler amount
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "Teste",
      unitPrice: 1000,
      quantity: 1,
    }],
    customer: {
      name: "Cliente",
      email: "cliente@test.com",
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
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function run() {
  await checkSeller();
  await testPixCreation();
}

run();
