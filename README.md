# ⚡ ZapSaaS — Plataforma de Chatbot e Disparos

> MVP funcional para pequenos negócios. 100% gratuito, sem APIs pagas.

---

## 📁 Estrutura de Pastas

```
zapsaas/
├── backend/
│   ├── server.js          # API REST (Express.js)
│   └── package.json
├── frontend/
│   └── index.html         # SPA completo (HTML + CSS + JS puro)
├── data/                  # Gerado automaticamente
│   ├── users.json         # Usuários do sistema
│   ├── leads.json         # Leads capturados
│   ├── messages.json      # Mensagens criadas
│   ├── dispatches.json    # Histórico de disparos
│   ├── chatbot.json       # Config do chatbot
│   └── sessions.json      # Sessões ativas
├── start.sh               # Script de inicialização
└── README.md
```

---

## 🚀 Como Rodar

### Pré-requisitos
- Node.js 16+ ([baixe aqui](https://nodejs.org))

### Passo a Passo

```bash
# 1. Entre na pasta do projeto
cd zapsaas

# 2. Instale as dependências do backend
cd backend && npm install && cd ..

# 3. Inicie o servidor
node backend/server.js

# 4. Abra o frontend
# Abra o arquivo frontend/index.html no navegador
# (duplo clique ou arraste para o Chrome/Firefox)
```

### Login Demo
```
Email: admin@demo.com
Senha: demo123
```

---

## ✨ Funcionalidades

### 📊 Dashboard
- Estatísticas em tempo real (leads, disparos, mensagens enviadas)
- Leads recentes
- Ações rápidas

### 🤖 Chatbot
- Simulador de conversa estilo WhatsApp
- Fluxo de menus navegáveis (1, 2, 3, 4...)
- Respostas por palavras-chave (preço, ajuda, horário, etc.)
- Captura de leads direto pelo chat
- Configurável via `data/chatbot.json`

### 👥 Leads
- Tabela completa com busca em tempo real
- Adicionar/editar/deletar leads
- Status: Novo, Contactado, Convertido
- Filtro por nome, telefone ou interesse

### ✉️ Mensagens
- Criador de templates com suporte a `{nome}`
- Tags de organização
- Prévia antes de disparar

### 🚀 Disparos
- Selecionar mensagem + contatos
- Simulação de envio com progresso em tempo real
- Status por contato: enviado / falha
- Histórico completo de campanhas

### 📋 Formulário de Captura
- Formulário público para sites
- Captura nome, telefone e interesse
- Integração direta com base de leads
- Pronto para uso como iframe

### 🔐 Autenticação
- Login/logout com token
- Múltiplos usuários (cadastro disponível)
- Sessões com expiração (24h)

---

## 🔧 API REST

```
POST   /api/auth/login         Login
POST   /api/auth/register      Cadastro
POST   /api/auth/logout        Logout

GET    /api/leads              Listar leads
POST   /api/leads              Criar lead
PATCH  /api/leads/:id          Atualizar lead
DELETE /api/leads/:id          Deletar lead

GET    /api/messages           Listar mensagens
POST   /api/messages           Criar mensagem
DELETE /api/messages/:id       Deletar mensagem

GET    /api/dispatches         Histórico de disparos
POST   /api/dispatches         Criar disparo

POST   /api/chatbot/message    Enviar mensagem ao chatbot
GET    /api/chatbot/config     Configuração do chatbot

GET    /api/stats              Dashboard stats
```

---

## 🌱 Como Evoluir para Versão Paga

### Fase 1 — Integração Real (gratuito ainda)
- [ ] Integrar com **Evolution API** (WhatsApp unofficial, auto-hospedado)
- [ ] Usar **Baileys** (lib Node.js para WhatsApp Web, gratuito)
- [ ] Adicionar **webhooks** para receber mensagens em tempo real

### Fase 2 — Infraestrutura
- [ ] Deploy gratuito no **Railway** ou **Render.com**
- [ ] Trocar JSON por **SQLite** (melhor performance) ou **PostgreSQL** (Railway free tier)
- [ ] Adicionar **Redis** para filas de disparo (Upstash free tier)

### Fase 3 — Produto Pago
- [ ] Integrar **WhatsApp Business API** oficial (Meta)
- [ ] Adicionar **Stripe/Pagar.me** para assinaturas
- [ ] Multitenancy real (isolamento de dados por conta)
- [ ] Relatórios avançados com gráficos
- [ ] Agendamento de disparos
- [ ] Chatbot com IA (integrar Claude/GPT via API)
- [ ] App mobile (React Native)

### Precificação Sugerida
| Plano | Contatos | Disparos/mês | Preço |
|-------|----------|--------------|-------|
| Básico | 500 | 5.000 | R$ 97/mês |
| Pro | 2.000 | 20.000 | R$ 197/mês |
| Enterprise | Ilimitado | Ilimitado | R$ 397/mês |

---

## 🛠️ Stack Técnica

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + CSS3 + JavaScript puro (sem frameworks)
- **Banco**: JSON files (simples, sem instalação)
- **Auth**: JWT-like tokens com hash SHA-256
- **Fontes**: Google Fonts (Syne + DM Sans)
- **Deploy**: Qualquer servidor Node.js

---

## 📝 Licença
MIT — Use livremente para fins comerciais e pessoais.
