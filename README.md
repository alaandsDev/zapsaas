# ⚡ ZapSaaS v2 — Deploy Guide

Stack: **Railway** (backend) + **Supabase** (banco) + **Vercel** (frontend)

---

## 📁 Estrutura

```
zapsaas/
├── backend/
│   ├── server.js        # API Express + Supabase
│   ├── schema.sql       # SQL para rodar no Supabase
│   ├── package.json
│   ├── railway.toml     # Config do Railway
│   └── .env.example
└── frontend/
    ├── index.html       # SPA completo
    └── vercel.json      # Config do Vercel
```

---

## 🗄️ 1. Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **SQL Editor** e cole o conteúdo de `backend/schema.sql`
3. Execute — isso cria todas as tabelas + admin demo
4. Vá em **Project Settings > API** e copie:
   - `Project URL` → seu `SUPABASE_URL`
   - `service_role` (secret) → seu `SUPABASE_SERVICE_KEY`

---

## 🚂 2. Railway (backend)

### Opção A — Via GitHub (recomendado)
1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **New Project > Deploy from GitHub repo**
3. Selecione o repositório e a pasta **`backend/`** como root
4. Vá em **Variables** e adicione:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
JWT_SECRET=qualquer_string_aleatoria_segura
ALLOWED_ORIGINS=https://seu-projeto.vercel.app
NODE_ENV=production
```

5. Aguarde o deploy. Copie a URL gerada (ex: `https://zapsaas.up.railway.app`)
6. Teste: acesse `https://zapsaas.up.railway.app/health`

### Opção B — Via Railway CLI
```bash
npm install -g @railway/cli
cd backend
railway login
railway init
railway up
```

---

## 🌐 3. Vercel (frontend)

### Antes do deploy: atualizar a URL da API
No arquivo `frontend/index.html`, localize a linha:
```js
const API = window.ZAPSAAS_API_URL || 'https://SEU-PROJETO.up.railway.app/api';
```
Substitua pela URL real do Railway.

### Deploy via Vercel CLI
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Deploy via GitHub
1. Acesse [vercel.com](https://vercel.com)
2. **New Project > Import Git Repository**
3. Configure **Root Directory** como `frontend/`
4. Deploy!

---

## ✅ Checklist pós-deploy

- [ ] `GET https://seu-backend.up.railway.app/health` retorna `{"status":"ok"}`
- [ ] Login com `admin@demo.com` / `demo123` funciona no frontend
- [ ] CORS configurado: `ALLOWED_ORIGINS` aponta para o domínio Vercel
- [ ] Leads, mensagens e disparos funcionando

---

## 🔐 Login Demo

```
Email: admin@demo.com
Senha: demo123
```

---

## 🔧 Variáveis de Ambiente (backend)

| Variável | Descrição | Obrigatório |
|---|---|---|
| `SUPABASE_URL` | URL do projeto Supabase | ✅ |
| `SUPABASE_SERVICE_KEY` | Chave service_role do Supabase | ✅ |
| `JWT_SECRET` | String secreta para tokens | ✅ |
| `ALLOWED_ORIGINS` | URLs permitidas no CORS (separadas por vírgula) | ✅ |
| `PORT` | Porta do servidor (Railway define automaticamente) | ❌ |
| `NODE_ENV` | `production` em produção | ❌ |
