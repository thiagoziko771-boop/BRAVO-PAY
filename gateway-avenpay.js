/**
 * Gateway AVENPAY - Integração de Pagamentos PIX
 * Arquivo principal para integração com a API AVENPAY
 * 
 * Uso:
 * const gateway = require('./gateway-avenpay');
 * const resultado = await gateway.processarPagamento(dados);
 */

const https = require('https');

class AvenpayGateway {
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_AVENPAY_API_URL || 'https://api.avenpayments.com/v1/payment';
    this.apiKey = process.env.AVEN_API_KEY;
    this.merchantId = process.env.AVENPAY_MERCHANT_ID;
    this.webhookUrl = process.env.AVENPAY_WEBHOOK_URL;
  }

  /**
   * Valida se as configurações estão corretas
   */
  validarConfig() {
    if (!this.apiKey) {
      throw new Error('AVEN_API_KEY não configurada em .env.local');
    }
    if (!this.merchantId) {
      throw new Error('AVENPAY_MERCHANT_ID não configurada em .env.local');
    }
    return true;
  }

  /**
   * Processa um pagamento PIX
   * @param {Object} dados - Dados do pagamento
   * @returns {Promise<Object>} Resposta da API AVENPAY
   */
  async processarPagamento(dados) {
    this.validarConfig();

    const {
      amount,
      nome,
      email,
      cpf,
      phone,
      descricao,
      externalRef,
      items
    } = dados;

    // Validações
    if (!amount) throw new Error('Campo "amount" é obrigatório');
    if (!nome) throw new Error('Campo "nome" é obrigatório');
    if (!email) throw new Error('Campo "email" é obrigatório');
    if (!cpf) throw new Error('Campo "cpf" é obrigatório');

    // Converter para centavos
    const amountInCents = Math.round(amount * 100);

    const payload = {
      amount: amountInCents,
      currency: 'BRL',
      method: 'PIX',
      description: descricao || 'Pagamento PIX',
      externalRef: externalRef || `order_${Date.now()}`,
      notificationUrl: this.webhookUrl,
      payer: {
        name: nome,
        taxId: cpf,
        email: email,
        phone: phone || '11987654321',
      },
      items: items || [
        {
          quantity: 1,
          name: descricao || 'Serviço/Produto',
          price: amountInCents,
          type: 'DIGITAL',
        },
      ],
    };

    return new Promise((resolve, reject) => {
      const payloadBuffer = Buffer.from(JSON.stringify(payload));

      const urlParts = new URL(this.apiUrl);
      const options = {
        hostname: urlParts.hostname,
        port: urlParts.port || 443,
        path: urlParts.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payloadBuffer.length,
          'Authorization': `Bearer ${this.apiKey}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            // Log de sucesso
            if (response.success || response.id || response.pix_code) {
              console.log('✅ Pagamento AVENPAY processado com sucesso');
              console.log(`   ID: ${response.id || response.transaction_id}`);
              console.log(`   Valor: R$ ${(amountInCents / 100).toFixed(2)}`);
            } else {
              console.log('⚠️  Resposta AVENPAY:', response);
            }

            resolve(response);
          } catch (e) {
            reject(new Error(`Erro ao processar resposta AVENPAY: ${e.message}`));
          }
        });
      });

      req.on('error', (e) => {
        console.error('❌ Erro na conexão AVENPAY:', e.message);
        reject(e);
      });

      req.write(payloadBuffer);
      req.end();
    });
  }

  /**
   * Processa pagamento com valor do frontend
   * @param {number} amount - Valor em reais (ex: 65.20)
   * @param {Object} dadosPessoa - Dados da pessoa
   * @returns {Promise<Object>} Resultado do pagamento
   */
  async processarComValorFrontend(amount, dadosPessoa) {
    return this.processarPagamento({
      amount: parseFloat(amount),
      nome: dadosPessoa.nome,
      email: dadosPessoa.email,
      cpf: dadosPessoa.cpf,
      phone: dadosPessoa.phone,
      descricao: dadosPessoa.descricao || 'Pagamento PIX',
      externalRef: dadosPessoa.externalRef,
      items: dadosPessoa.items,
    });
  }
}

// Exportar instância singleton
const gateway = new AvenpayGateway();

module.exports = {
  AvenpayGateway,
  gateway,
  // Função helper para uso rápido
  processarPagamento: (dados) => gateway.processarPagamento(dados),
  processarComValor: (amount, pessoa) => gateway.processarComValorFrontend(amount, pessoa),
};
