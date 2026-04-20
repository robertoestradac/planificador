#!/usr/bin/env node

/**
 * Script para generar claves JWT seguras para producción
 * Uso: node scripts/generate-jwt-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generador de Claves JWT Seguras\n');
console.log('═'.repeat(60));
console.log('\nGenera claves aleatorias y seguras para usar en producción.\n');

// Generar claves
const accessSecret = crypto.randomBytes(64).toString('hex');
const refreshSecret = crypto.randomBytes(64).toString('hex');

console.log('📝 Copia estas claves en tu archivo backend/.env.production:\n');
console.log('─'.repeat(60));
console.log(`JWT_ACCESS_SECRET=${accessSecret}`);
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
console.log('─'.repeat(60));

console.log('\n⚠️  IMPORTANTE:');
console.log('   • Guarda estas claves en un lugar seguro');
console.log('   • NO las compartas con nadie');
console.log('   • NO las subas a Git');
console.log('   • Usa claves diferentes para desarrollo y producción');
console.log('   • Si cambias las claves, todos los tokens existentes serán inválidos\n');

console.log('✅ Claves generadas exitosamente!\n');
