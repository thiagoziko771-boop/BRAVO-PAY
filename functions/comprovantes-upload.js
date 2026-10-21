const { getSupabase } = require("./lib/supabase");

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

exports.handler = async (event) => {
  console.log("[COMPROVANTE-UPLOAD] ===== FUNÇÃO INICIADA =====");
  
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
  try {
    const contentType = event.headers?.["content-type"] || "";
    if (contentType.includes("application/json")) {
      body = event.body ? JSON.parse(event.body) : {};
    } else {
      // FormData — extrai campos do multipart manualmente
      const raw = event.body || "";
      const getField = (name) => {
        const re = new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n-]+)`);
        const m = raw.match(re);
        return m ? m[1].trim() : null;
      };
      body = {
        transaction_id: getField("transaction_id"),
        cpf:            getField("customer_cpf"),
        nome:           getField("customer_name"),
        arquivo:        getField("comprovante") || null,
      };
    }
  } catch (_) {}

  console.log("[COMPROVANTE-UPLOAD] Dados recebidos:", {
    transaction_id: body.transaction_id,
    cpf: body.cpf || body.customer_cpf,
    nome: body.nome || body.customer_name,
    tem_arquivo: !!body.arquivo
  });

  try {
    const supabase = getSupabase();
    
    // Se houver arquivo (base64 ou URL)
    let storagePath = null;
    if (body.arquivo) {
      try {
        // Extrair base64 da imagem
        const base64Data = body.arquivo.split(',')[1] || body.arquivo;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload pra Storage do Supabase
        const fileName = `comprovante_${body.transaction_id || Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('comprovantes')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) {
          console.warn("[COMPROVANTE-UPLOAD] Aviso ao fazer upload pro Storage:", uploadError.message);
        } else {
          // Gerar URL pública
          const { data: publicUrl } = supabase
            .storage
            .from('comprovantes')
            .getPublicUrl(fileName);
          
          storagePath = publicUrl.publicUrl;
          console.log("[COMPROVANTE-UPLOAD] ✅ Arquivo armazenado no Storage:", storagePath);
        }
      } catch (err) {
        console.warn("[COMPROVANTE-UPLOAD] Erro ao processar arquivo:", err.message);
      }
    }
    
    // Inserir comprovante na Supabase
    const { data, error } = await supabase.from("comprovantes").insert({
      transaction_id: body.transaction_id || body.id || null,
      cpf:    body.cpf || body.customer_cpf || null,
      nome:   body.nome || body.customer_name || null,
      arquivo: storagePath || body.arquivo || body.file || body.url || null,
      status: "pending_approval",
      created_at: new Date().toISOString(),
      extra: {
        filename:       body.filename || null,
        customer_email: body.customer_email || null,
        ip: event.headers?.["x-forwarded-for"] || "0.0.0.0",
      },
    });
    
    if (error) {
      console.error("[COMPROVANTE-UPLOAD] Erro ao salvar:", error);
      return jsonResponse(400, { 
        success: false, 
        error: "Erro ao salvar comprovante",
        debug: error.message 
      });
    }

    console.log("[COMPROVANTE-UPLOAD] ✅ Comprovante salvo com sucesso!");
    console.log("[COMPROVANTE-UPLOAD] Transaction ID:", body.transaction_id);
    
    // Atualizar status da transação para "comprovante_enviado"
    if (body.transaction_id) {
      try {
        await supabase.from("transactions").update({
          status: "comprovante_enviado",
          updated_at: new Date().toISOString(),
        }).eq("transaction_id", body.transaction_id);
        
        console.log("[COMPROVANTE-UPLOAD] ✅ Status da transação atualizado");
      } catch (err) {
        console.error("[COMPROVANTE-UPLOAD] Erro ao atualizar transação:", err.message);
      }
    }

    return jsonResponse(200, { 
      success: true,
      message: "Comprovante recebido com sucesso",
      transaction_id: body.transaction_id
    });
    
  } catch (err) {
    console.error("[COMPROVANTE-UPLOAD] Erro geral:", err.message);
    return jsonResponse(500, { 
      success: false, 
      error: "Erro ao processar comprovante",
      debug: err.message
    });
  }
};
