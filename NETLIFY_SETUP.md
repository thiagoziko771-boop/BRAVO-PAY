# 🚀 SETUP NETLIFY - PASSO A PASSO

## 1️⃣ Adicionar Variáveis de Ambiente

Acesse: https://app.netlify.com/sites/brasil-cnh-gov-br/settings/general

Procure por **Environment variables** (ou Build & Deploy > Environment)

Clique em **Add environment variable** e adicione as 3 variáveis:

### BLACKCAT_API_KEY_SECRET
Copie do seu dashboard Blackcat (Settings > API > Secret Key)

### NEXT_PUBLIC_SUPABASE_URL
```
https://villasxvrrykftwabunz.supabase.co
```

### SUPABASE_SERVICE_ROLE_KEY
Copie do seu dashboard Supabase (Settings > API > Secret Keys)

## 2️⃣ Fazer Redeploy

Depois de adicionar as 3 variáveis:

1. Vá em **Deploys**
2. Clique no botão **Retry** (ou **Trigger deploy**)
3. Espere o deploy terminar

## 3️⃣ Confirmar

Quando disser "Deploy succeeded", acesse o site e teste:
- Gerar PIX
- Fazer upload de comprovante
- Verificar no Facebook Pixel

✅ **PRONTO!**
