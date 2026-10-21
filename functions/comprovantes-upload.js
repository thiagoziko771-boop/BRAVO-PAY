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
    
    // Se houver arquivo (base64)
    let storagePath = null;
    if (body.arquivo && body.arquivo.length > 100) {
      try {
        // Extrair base64
        const base64Data = body.arquivo.includes(',') 
          ? body.arquivo.split(',')[1] 
          : body.arquivo;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Upload pro Storage - usar o nome correto do bucket
        const fileName = `comprovante_${body.transaction_id || Date.now()}.jpg`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('Comprovantes')
          .upload(fileName, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (!uploadError) {
          const { data: publicUrl } = supabase
            .storage
            .from('Comprovantes')
            .getPublicUrl(fileName);
          
          storagePath = publicUrl.publicUrl;
          console.log("[COMPROVANTE-UPLOAD] ✅ Arquivo salvo:", storagePath);
        } else {
          console.warn("[COMPROVANTE-UPLOAD] Aviso ao fazer upload:", uploadError.message);
        }
      } catch (err) {
        console.warn("[COMPROVANTE-UPLOAD] Erro ao processar arquivo:", err.message);
      }
    }
    
    // Inserir comprovante na Supabase - sem coluna 'status' se não existir
    const { data, error } = await supabase.from("comprovantes").insert({
      transaction_id: body.transaction_id || body.id || null,
      cpf: body.cpf || body.customer_cpf || null,
      nome: body.nome || body.customer_name || null,
      arquivo: storagePath || body.arquivo || null,
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error("[COMPROVANTE-UPLOAD] Erro ao salvar:", error);
      
      // Se falhar por schema, tenta sem validação
      if (error.message.includes('status')) {
        const { data: data2, error: error2 } = await supabase
          .from("comprovantes")
          .insert({
            transaction_id: body.transaction_id || body.id || null,
            cpf: body.cpf || body.customer_cpf || null,
            nome: body.nome || body.customer_name || null,
            arquivo: storagePath || body.arquivo || null,
          });
        
        if (error2) {
          console.error("[COMPROVANTE-UPLOAD] Erro na segunda tentativa:", error2);
          return jsonResponse(400, { 
            success: false, 
            error: "Erro ao salvar comprovante",
            debug: error2.message 
          });
        }
      } else {
        return jsonResponse(400, { 
          success: false, 
          error: "Erro ao salvar comprovante",
          debug: error.message 
        });
      }
    }

    console.log("[COMPROVANTE-UPLOAD] ✅ Comprovante salvo com sucesso!");

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
