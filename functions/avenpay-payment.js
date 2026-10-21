// AVENPAY Payment Integration
// Arquivo para integração com a API de pagamentos AVENPAY

const AVENPAY_API_URL = process.env.NEXT_PUBLIC_AVENPAY_API_URL || "https://api.avenpayments.com/v1/payment";
const AVENPAY_API_KEY = process.env.AVENPAY_API_KEY;
const AVENPAY_MERCHANT_ID = process.env.AVENPAY_MERCHANT_ID;

/**
 * Cria um pagamento PIX na AVENPAY
 * @param {Object} paymentData - Dados do pagamento
 * @returns {Promise<Object>} Resposta da API
 */
async function createPixPayment(paymentData) {
  const {
    amount,
    currency = "BRL",
    description,
    externalRef,
    notificationUrl,
    payer,
    items,
  } = paymentData;

  const payload = {
    amount,
    currency,
    method: "PIX",
    description,
    externalRef,
    notificationUrl,
    payer: {
      name: payer.name,
      taxId: payer.taxId,
      email: payer.email,
      phone: payer.phone,
    },
    items: items || [],
  };

  try {
    const response = await fetch(AVENPAY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AVENPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AVENPAY API Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("AVENPAY Payment Response:", data);
    return data;
  } catch (error) {
    console.error("Erro ao criar pagamento AVENPAY:", error);
    throw error;
  }
}

/**
 * Exemplo de uso - Criar um pagamento de assinatura
 */
async function examplePayment() {
  const paymentData = {
    amount: 25990, // 259.90 em centavos
    currency: "BRL",
    method: "PIX",
    description: "Pagamento de assinatura",
    externalRef: "order_98765",
    notificationUrl: "https://example.com/webhook/payment",
    payer: {
      name: "John Doe",
      taxId: "12345678909",
      email: "john.doe@example.com",
      phone: "+5511999999999",
    },
    items: [
      {
        quantity: 1,
        name: "Produto Teste",
        price: 25990,
        type: "DIGITAL",
      },
    ],
  };

  try {
    const result = await createPixPayment(paymentData);
    console.log("Pagamento criado com sucesso:", result);
    return result;
  } catch (error) {
    console.error("Falha ao criar pagamento:", error);
  }
}

module.exports = {
  createPixPayment,
  examplePayment,
};
