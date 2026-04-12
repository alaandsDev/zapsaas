#!/bin/bash
echo ""
echo "⚡ ZapSaaS — Iniciando plataforma..."
echo ""

# Check Node
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale em: https://nodejs.org"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependências..."
    cd backend && npm install && cd ..
fi

# Start backend in background
echo "🚀 Iniciando servidor backend na porta 3001..."
cd backend && node server.js &
BACKEND_PID=$!
cd ..

sleep 1

# Try to open frontend
echo ""
echo "✅ Tudo pronto! Acesse:"
echo ""
echo "   📱 App:      Abra frontend/index.html no navegador"
echo "   🔧 API:      http://localhost:3001/api"
echo ""
echo "   👤 Login demo:  admin@demo.com / demo123"
echo ""
echo "Pressione Ctrl+C para encerrar o servidor."
echo ""

wait $BACKEND_PID
