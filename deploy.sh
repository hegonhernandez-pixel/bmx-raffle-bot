#!/bin/bash

echo "🚀 Iniciando despliegue del bot de rifa BMX GTI..."

# 1. Verificar variables de entorno
if [ ! -f .env ]; then
  echo "⚠️ Archivo .env no encontrado. Creando plantilla..."
  echo "SUPABASE_URL=tu_supabase_url" > .env
  echo "SUPABASE_KEY=tu_supabase_key" >> .env
  echo "Por favor edita el archivo .env con tus credenciales antes de continuar."
  exit 1
fi

# 2. Descargar o actualizar código del repositorio
git pull origin main 2>/dev/null || echo "Desplegando en entorno local..."

# 3. Construir y levantar contenedores Docker
docker-compose down
docker-compose up -d --build

# 4. Mostrar logs en pantalla para escanear el Código QR de WhatsApp
echo "✅ Contenedor iniciado. Mostrando logs para código QR:"
docker logs -f bmx_raffle_bot

 
	
