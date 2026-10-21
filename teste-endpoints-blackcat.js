#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_PUBLIC_KEY = process.env.BLACKCAT_API_KEY_PUBLIC;
const BLACKCAT_SECRET_KEY = process.env.BLACKCAT_API_KEY_SECRET;

console.log("🔍 TESTANDO DIFERENTES ENDPOINTS E ABORDAGENS\n");

// Testar se existe endpoint de teste
async function testEndpoint(nome, url, headers, body = null) {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`TEST: ${nome}`);
  console.log("─".repeat(60));
  console.log("URL:", url);
  console.log("Headers:", JSON.stringify(headers, null, 2));
  if (body) {
    console.log("Body:", JSON.stringify(body, null, 2));
  }

  try {
    const options = {
      method: body ? "POST" : "GET",
      headers,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();
    
    console.log("\nStatus:", response.status);
    console.log("Response:", text.substring(0, 500));
    
    return response.status < 400;
  } catch (err) {
    console.error("Error:", err.message);
    return false;
  }
}

async function runTests() {
  // Teste 1: Seller com Public Key
  await testEndpoint(
    "Seller com Public Key",
    `${BLACKCAT_BASE}/sales/seller`,
    {
      "X-API-Key": BLACKCAT_PUBLIC_KEY,
    }
  );

  // Teste 2: Seller com Secret Key
  await testEndpoint(
    "Seller com Secret Key",
    `${BLACKCAT_BASE}/sales/seller`,
    {
      "X-API-Key": BLACKCAT_SECRET_KEY,
    }
  );

  // Teste 3: Criar PIX com Public Key no header
  await testEndpoint(
    "Create PIX com Public Key",
    `${BLACKCAT_BASE}/sales/create-sale`,
    {
      "Content-Type": "application/json",
      "X-API-Key": BLACKCAT_PUBLIC_KEY,
    },
    {
      amount: 6520,
      currency: "BRL",
      paymentMethod: "pix",
      items: [{
        title: "Teste",
        unitPrice: 6520,
        quantity: 1
      }],
      customer: {
        name: "Teste",
        email: "teste@teste.com",
        phone: "11999999999",
        document: {
          number: "12345678901",
          type: "cpf"
        }
      }
    }
  );

  // Teste 4: Tentar com Authorization Bearer usando Secret Key
  await testEndpoint(
    "Create PIX com Authorization Bearer Secret",
    `${BLACKCAT_BASE}/sales/create-sale`,
    {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BLACKCAT_SECRET_KEY}`,
    },
    {
      amount: 6520,
      currency: "BRL",
      paymentMethod: "pix",
      items: [{
        title: "Teste",
        unitPrice: 6520,
        quantity: 1
      }],
      customer: {
        name: "Teste",
        email: "teste@teste.com",
        phone: "11999999999",
        document: {
          number: "12345678901",
          type: "cpf"
        }
      }
    }
  );

  // Teste 5: Tentar com Authorization Bearer usando Public Key
  await testEndpoint(
    "Create PIX com Authorization Bearer Public",
    `${BLACKCAT_BASE}/sales/create-sale`,
    {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BLACKCAT_PUBLIC_KEY}`,
    },
    {
      amount: 6520,
      currency: "BRL",
      paymentMethod: "pix",
      items: [{
        title: "Teste",
        unitPrice: 6520,
        quantity: 1
      }],
      customer: {
        name: "Teste",
        email: "teste@teste.com",
        phone: "11999999999",
        document: {
          number: "12345678901",
          type: "cpf"
        }
      }
    }
  );

  // Teste 6: Tentar endpoint alternativo /checkout
  await testEndpoint(
    "Endpoint /checkout",
    `${BLACKCAT_BASE}/checkout`,
    {
      "Content-Type": "application/json",
      "X-API-Key": BLACKCAT_SECRET_KEY,
    },
    {
      amount: 6520,
      customer: {
        name: "Teste",
        email: "teste@teste.com"
      }
    }
  );

  // Teste 7: Tentar endpoint /transactions
  await testEndpoint(
    "Endpoint /transactions",
    `${BLACKCAT_BASE}/transactions`,
    {
      "Content-Type": "application/json",
      "X-API-Key": BLACKCAT_SECRET_KEY,
    },
    {
      amount: 6520,
      method: "pix",
      customer: {
        name: "Teste",
        email: "teste@teste.com"
      }
    }
  );

  // Teste 8: Tentar /sales/create (sem -sale)
  await testEndpoint(
    "Endpoint /sales/create",
    `${BLACKCAT_BASE}/sales/create`,
    {
      "Content-Type": "application/json",
      "X-API-Key": BLACKCAT_SECRET_KEY,
    },
    {
      amount: 6520,
      paymentMethod: "pix",
      customer: {
        name: "Teste",
        email: "teste@teste.com",
        phone: "11999999999",
        document: {
          number: "12345678901",
          type: "cpf"
        }
      },
      items: [{
        title: "Teste",
        unitPrice: 6520,
        quantity: 1
      }]
    }
  );
}

runTests();
