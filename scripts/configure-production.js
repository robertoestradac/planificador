#!/usr/bin/env node

/**
 * Script interactivo para configurar archivos .env de producción
 * Uso: node scripts/configure-production.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🚀 Configurador de Producción - Invitaciones SaaS\n');
  console.log('═'.repeat(60));
  console.log('\nEste script te ayudará a configurar tus archivos .env de producción.\n');

  try {
    // Recopilar información
    console.log('📋 Por favor, proporciona la siguiente información:\n');

    const domain = await question('1. Tu dominio (ej: midominio.com): ');
    const dbHost = await question('2. Host de base de datos [localhost]: ') || 'localhost';
    const dbUser = await question('3. Usuario de base de datos (con prefijo de cPanel): ');
    const dbPassword = await question('4. Contraseña de base de datos: ');
    const dbName = await question('5. Nombre de base de datos (con prefijo de cPanel): ');
    
    console.log('\n🔐 Generando claves JWT seguras...\n');
    const jwtAccess = crypto.randomBytes(64).toString('hex');
    const jwtRefresh = crypto.randomBytes(64).toString('hex');

    const useSubdomain = await question('6. ¿Usar subdominio para API? (s/n) [s]: ') || 's';
    const apiUrl = useSubdomain.toLowerCase() === 's' 
      ? `https://api.${domain}`
      : `https://${domain}:4000`;

    // Crear contenido del .env del backend
    const backendEnv = `# ============================================
# CONFIGURACIÓN DE PRODUCCIÓN - BACKEND
# Generado automáticamente el ${new Date().toLocaleString()}
# ============================================

# Server
NODE_ENV=production
PORT=4000

# Database
DB_HOST=${dbHost}
DB_PORT=3306
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# JWT - Claves generadas automáticamente
JWT_ACCESS_SECRET=${jwtAccess}
JWT_REFRESH_SECRET=${jwtRefresh}
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS
CORS_ORIGIN=https://${domain},https://www.${domain}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=10

# App
APP_DOMAIN=${domain}
APP_PROTOCOL=https
`;

    // Crear contenido del .env del frontend
    const frontendEnv = `# ============================================
# CONFIGURACIÓN DE PRODUCCIÓN - FRONTEND
# Generado automáticamente el ${new Date().toLocaleString()}
# ============================================

# API URL
NEXT_PUBLIC_API_URL=${apiUrl}

# Environment
NODE_ENV=production
PORT=3000
`;

    // Guardar archivos
    const backendPath = path.join(__dirname, '..', 'backend', '.env.production');
    const frontendPath = path.join(__dirname, '..', 'frontend', '.env.production');

    fs.writeFileSync(backendPath, backendEnv);
    fs.writeFileSync(frontendPath, frontendEnv);

    console.log('\n✅ Archivos de configuración creados exitosamente!\n');
    console.log('─'.repeat(60));
    console.log(`📁 Backend:  ${backendPath}`);
    console.log(`📁 Frontend: ${frontendPath}`);
    console.log('─'.repeat(60));

    console.log('\n📋 Resumen de configuración:\n');
    console.log(`   Dominio:     ${domain}`);
    console.log(`   API URL:     ${apiUrl}`);
    console.log(`   Base de datos: ${dbName}`);
    console.log(`   Usuario DB:    ${dbUser}`);

    console.log('\n⚠️  IMPORTANTE:\n');
    console.log('   1. Verifica que los datos sean correctos');
    console.log('   2. NO subas estos archivos a Git');
    console.log('   3. Haz backup de las claves JWT generadas');
    console.log('   4. Sube los archivos al servidor en sus respectivas carpetas');
    console.log('   5. Renombra .env.production a .env en el servidor\n');

    console.log('🔐 Claves JWT generadas (guárdalas en un lugar seguro):\n');
    console.log(`   ACCESS:  ${jwtAccess.substring(0, 40)}...`);
    console.log(`   REFRESH: ${jwtRefresh.substring(0, 40)}...\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

main();
