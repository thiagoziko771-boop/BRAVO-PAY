#!/usr/bin/env node

// Test Blackcat with Public Key
require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_PUBLIC_KEY = process.env.BLACKCAT_API_KEY_PUBLIC;
const BLACKCAT_SECRET_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🧪 Testing Blackcat with both keys\n");
console.log("Public Key present:", !!BLACKCAT_PUBLIC_KEY);
console.log("Secret Key present:", !!BLACKCAT_SECRET_KEY);

async function testWithKey(keyName, keyValue) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Testing with ${keyName}...\n`);

  const payload = {
    amount: 6520,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "SHOPIFY LOJA 03",
      unitPrice: 6520,
      quantity: 1,
      tangible: false,
    }],
    customer: {
      name: "Cliente Teste",
      email: "cliente@shopify.com",
      phone: "11999999999",
      document: {
        number: "12345678901",
        type: "cpf",
      },
    },
    pix: {
      expiresInDays: 1,
    },
    externalRef: `test_${Date.now()}`,
  };

  try {
    const response = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": keyValue,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const parsed = JSON.parse(text);
    
    console.log("Status:", response.status);
    
    if (parsed.success && parsed.data) {
      console.log("✅ SUCCESS!");
      console.log("Transaction ID:", parsed.data.transactionId);
      console.log("PIX Code:", parsed.data.paymentData?.copyPaste?.substring(0, 50) + "...");
    } else {
      console.log("❌ Error:", parsed.message || parsed.error);
    }
  } catch (err) {
    console.error("Network Error:", err.message);
  }
}

async function runTests() {
  await testWithKey("Secret Key (X-API-Key header)", BLACKCAT_SECRET_KEY);
  // You could also test with different headers if needed
}

runTests();
