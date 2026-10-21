const { getSupabase } = require("./lib/supabase");

const BLACKCAT_BASE = "https://api.blackcatoficial.com/api";
const BLACKCAT_API_KEY = process.env.BLACKCAT_API_KEY_SECRET;
const UTMIFY_TOKEN = "lzASZob4ldSJJc3jT1LILy9alPxWJgpnPhCh";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cache UTMify
const utmifyCache = new Map();
const CACHE_TTL = 60000;

function getAuthHeader() {
  if (!BLACKCAT_API_KEY) {
    throw new Error("❌ BLACKCAT_API_KEY_SECRET não configurada!");
  }
  return BLACKCAT_API_KEY;
}

async function sendUtmify(transactionId, status, customer, amountCents, createdAt, utms) {
  if (utmifyCache.has(transactionId)) {
    console.log("[UTMify] Skipping duplicate for:", transactionId);
    return;
  }

  utmifyCache.set(transactionId, true);
  setTimeout(() => utmifyCache.delete(transactionId), CACHE_TTL);

  try {
    const gatewayFeeCents = Math.round(amountCents * 0.02);
    const netCents = amountCents - gatewayFeeCents;
    const payload = {
      orderId: transactionId,
      platform: "AvenPayments",
      paymentMethod: "pix",
      status,
      createdAt: createdAt || new Date().toISOString().replace("T"," ").slice(0,19),
      approvedDate: status === "paid" ? new Date().toISOString().replace("T"," ").slice(0,19) : null,
      customer: {
        name: customer.name || null,
        email: customer.email || null,
        phone: customer.phone || null,
        document: customer.cpf || null,
        country: "BR",
        ip: "177.0.0.1",
      },
      products: [{
        id: "loja-shopify-br-001",
        name: "SHOPIFY LOJA 03",
        quantity: 1,
        priceInCents: amountCents,
      }],
      trackingParameters: {
        utm_source: utms?.utm_source || null,
        utm_campaign: utms?.utm_campaign || null,
        utm_medium: utms?.utm_medium || null,
        utm_content: utms?.utm_content || null,
        utm_term: utms?.utm_term || null,
      },
      commission: {
        totalPriceInCents: amountCents,
        gatewayFeeInCents: gatewayFeeCents,
        userCommissionInCents: netCents,
        currency: "BRL",
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-token": UTMIFY_TOKEN },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    console.log("[UTMify] ✓ Enviado para:", transactionId);
  } catch (err) {
    console.error("[UTMify] Erro (não bloqueia):", err.message);
  }
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function validarCpf(cpf) {
  if (!cpf || cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Cálculo do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }
  let resto = soma % 11;
  let digito1 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cpf[9]) !== digito1) return false;
  
  // Cálculo do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }
  resto = soma % 11;
  let digito2 = resto < 2 ? 0 : 11 - resto;
  
  if (parseInt(cpf[10]) !== digito2) return false;
  
  return true;
}

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

function fmtPhone(phone) {
  if (!phone) return "11999999999";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return digits;
  if (digits.length === 10) return digits;
  return digits;
}

exports.handler = async (event) => {
  console.log("[PIX-BLACKCAT] ===== FUNÇÃO INICIADA =====");
  console.log("[PIX-BLACKCAT] BLACKCAT_API_KEY exists:", !!BLACKCAT_API_KEY);
  console.log("[PIX-BLACKCAT] SUPABASE_URL exists:", !!SUPABASE_URL);
  console.log("[PIX-BLACKCAT] SUPABASE_KEY exists:", !!SUPABASE_KEY);
  
  if (!BLACKCAT_API_KEY) {
    console.error("❌ ERRO: BLACKCAT_API_KEY_SECRET não configurada na Netlify!");
    return jsonResponse(500, {
      success: false,
      error: "Credenciais da gateway não configuradas",
      debug: "BLACKCAT_API_KEY_SECRET não encontrada"
    });
  }

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      },
      body: "",
    };
  }

  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch { body = {}; }

  const randId = Math.random().toString(36).slice(2,10);
  
  // Aceita o amount enviado pelo frontend, ou usa 65.70 por padrão
  const rawAmount = body.amount ?? body.valor ?? body.total ?? 65.70;
  const amountReais = Number(rawAmount) || 65.70;
  const amountCents = Math.round(amountReais * 100);

  const customerName = (body.nome || body.name || body.customer_name || `Cliente ${randId}`).toString().trim();
  const customerEmail = (body.email || body.customer_email || `cliente${randId}@gmail.com`).toString().trim();
  const customerPhone = fmtPhone(body.phone || body.customer_phone || "11999999999");
  const cpfRaw = (body.cpf || body.document || body.customer_cpf || "").toString().replace(/\D/g, "");
  const customerCpf = validarCpf(cpfRaw) ? cpfRaw : gerarCpfValido();
  const utms = body.utm || {};
  const externalRef = `order_${randId}`;

  console.log("[PIX-BLACKCAT] Amount:", amountReais, "Cents:", amountCents);
  console.log("[PIX-BLACKCAT] Customer:", { name: customerName, email: customerEmail, cpf: customerCpf });

  // Determinar nome do produto - sempre "LOJA SHOPIFY"
  let productName = "LOJA SHOPIFY";

  // Payload para Blackcat - Conforme API documentation
  const payload = {
    amount: amountCents,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{
      title: productName,
      unitPrice: amountCents,
      quantity: 1,
      tangible: false,
    }],
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      document: {
        number: customerCpf,
        type: "cpf",
      },
    },
    pix: {
      expiresInDays: 1,
    },
    postbackUrl: "https://suacnh-gov-br.netlify.app/webhook/payment",
    externalRef: externalRef,
    utm_source: utms.utm_source || null,
    utm_medium: utms.utm_medium || null,
    utm_campaign: utms.utm_campaign || null,
    utm_content: utms.utm_content || null,
    utm_term: utms.utm_term || null,
  };

  let apiKey;
  try {
    apiKey = getAuthHeader();
  } catch (err) {
    console.error("❌ [PIX-BLACKCAT] Auth error:", err.message);
    return jsonResponse(500, {
      success: false,
      error: "Credenciais não configuradas",
      debug: err.message
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    const resp = await fetch(`${BLACKCAT_BASE}/sales/create-sale`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await resp.text();
    if (!resp.ok) {
      let errMsg = text;
      try { errMsg = JSON.parse(text)?.message || errMsg; } catch {}
      console.error("[Blackcat] Erro HTTP:", resp.status, errMsg);
      return jsonResponse(resp.status, {
        success: false,
        error: errMsg,
        debug: { status: resp.status, body: text.substring(0, 500) }
      });
    }

    let parsed = {};
    try { parsed = JSON.parse(text); } catch {
      console.error("[Blackcat] Parse error:", text.substring(0, 200));
      return jsonResponse(500, {
        success: false,
        error: "Resposta inválida da gateway",
        debug: text.substring(0, 200)
      });
    }

    if (!parsed.success || !parsed.data) {
      console.error("[Blackcat] Resposta sem dados:", parsed);
      return jsonResponse(500, {
        success: false,
        error: "Gateway retornou resposta incompleta",
        debug: parsed
      });
    }

    const transactionId = parsed.data.transactionId;
    const pixCode = parsed.data.paymentData?.copyPaste || null;
    const qrCodeBase64 = parsed.data.paymentData?.qrCodeBase64 || null;
    const invoiceUrl = parsed.data.invoiceUrl || null;

    if (!transactionId || !pixCode) {
      console.error("[Blackcat] Resposta incompleta:", { transactionId, pixCode });
      return jsonResponse(500, {
        success: false,
        error: "Gateway retornou resposta incompleta",
        debug: { transaction: transactionId, pix: !!pixCode }
      });
    }

    console.log("[PIX-BLACKCAT] ===== PIX GERADO COM SUCESSO =====");
    console.log("[PIX-BLACKCAT] Transaction ID:", transactionId);
    console.log("[PIX-BLACKCAT] PIX Code: ✓ Existe");

    // Salvar no Supabase (não bloqueia)
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const supabase = getSupabase();
        await supabase.from("transactions").insert({
          transaction_id: transactionId,
          amount: amountReais,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_cpf: customerCpf,
          customer_phone: customerPhone,
          status: "pending",
          brcode: pixCode,
          utm_source: utms.utm_source || null,
          utm_campaign: utms.utm_campaign || null,
          utm_medium: utms.utm_medium || null,
        });
        console.log("[Supabase] ✓ Salvo:", transactionId);
      } catch (err) {
        console.error("[Supabase] Erro (continuando):", err.message);
      }
    }

    // Notificar UTMify (não bloqueia)
    await sendUtmify(
      transactionId, "waiting_payment",
      { name: customerName, email: customerEmail, phone: customerPhone, cpf: customerCpf },
      amountCents,
      new Date().toISOString().replace("T"," ").slice(0,19),
      utms
    ).catch(err => console.error("[SendUtmify] Erro:", err.message));

    return jsonResponse(200, {
      success: true,
      pixCode,
      pix_code: pixCode,
      brcode: pixCode,
      payload: pixCode,
      qr_code_image: qrCodeBase64,
      qrCodeBase64,
      transaction_id: transactionId,
      transactionId,
      deposit_id: transactionId,
      invoice_url: invoiceUrl,
      invoiceUrl,
      status: "pending",
    });

  } catch (err) {
    console.error("[PIX-BLACKCAT] Erro ao chamar gateway:", err.message);
    return jsonResponse(502, {
      success: false,
      error: "Falha ao conectar com gateway: " + String(err)
    });
  }
};
