#!/usr/bin/env node

require("dotenv").config({ path: ".env.local" });

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;

// Gerar CPF válido
function gerarCpfValido() {
  const d = new Array(9);
  for (let i = 0; i < 9; i++) {
    d[i] = Math.floor(Math.random() * 10);
  }
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += d[i] * (10 - i);
  }
  let resto = soma % 11;
  d[9] = resto < 2 ? 0 : 11 - resto;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += d[i] * (11 - i);
  }
  resto = soma % 11;
  d[10] = resto < 2 ? 0 : 11 - resto;
  
  return d.join('');
}

async function testar(cpf, nome) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`TEST: ${nome}`);
  console.log(`CPF: ${cpf}`);
  console.log("═".repeat(60));

  const payload = {
    amount: 6520,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: "SHOPIFY LOJA 03",
      unitPrice: 6520,
      quantity: 1,
      tangible: false
    }],
    customer: {
      name: "Cliente Teste",
      email: "cliente@shopify.com",
      phone: "11999999999",
      document: {
        number: cpf,
        type: "cpf"
      }
    },
    pix: {
      expiresInDays: 1
    },
    externalRef: `order_${Date.now()}`,
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

    console.log("Status HTTP:", response.status);
    
    if (data.success && data.data) {
      console.log("✅✅✅ SUCESSO! PIX GERADO! ✅✅✅\n");
      console.log("Transaction ID:", data.data.transactionId);
      console.log("Amount:", `R$ ${(data.data.amount / 100).toFixed(2)}`);
      console.log("Status:", data.data.status);
      
      if (data.data.paymentData?.copyPaste) {
        console.log("\n🎯 PIX COPY-PASTE:");
        console.log(data.data.paymentData.copyPaste);
      }
      if (data.data.paymentData?.qrCodeBase64) {
        console.log("\n✓ QR Code Base64 disponível");
      }
      if (data.data.invoiceUrl) {
        console.log("\n🔗 URL:", data.data.invoiceUrl);
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
  // Teste 1: CPF inválido (sempre 12345678901)
  await testar("12345678901", "CPF inválido (padrão)");
  
  // Teste 2: CPF válido gerado
  const cpfValido1 = gerarCpfValido();
  await testar(cpfValido1, `CPF válido gerado: ${cpfValido1}`);
  
  // Teste 3: Outro CPF válido
  const cpfValido2 = gerarCpfValido();
  await testar(cpfValido2, `CPF válido gerado: ${cpfValido2}`);
  
  // Teste 4: CPF muito usado (em muitos testes)
  await testar("11144477735", "CPF conhecido");
}

runTests();
