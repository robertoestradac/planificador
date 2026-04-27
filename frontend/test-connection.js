#!/usr/bin/env node

/**
 * Script de prueba de conexión con el backend Laravel
 * 
 * Uso: node test-connection.js
 */

const axios = require('axios');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const BASE_URL = `${API_URL}/api/v1`;

console.log('🔍 Probando conexión con backend Laravel...\n');
console.log(`📍 URL: ${BASE_URL}\n`);

async function testConnection() {
  const tests = [];
  
  // Test 1: Health check
  tests.push({
    name: 'Health Check',
    test: async () => {
      const response = await axios.get(`${API_URL}/api/v1/health`);
      return response.data;
    }
  });

  // Test 2: Registro de usuario
  const randomEmail = `test${Date.now()}@example.com`;
  const randomSubdomain = `test${Date.now()}`;
  let accessToken = null;
  let refreshToken = null;

  tests.push({
    name: 'Registro de Usuario',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test User',
        email: randomEmail,
        password: 'password123',
        tenant_name: 'Test Company',
        subdomain: randomSubdomain
      });
      accessToken = response.data.data.access_token || response.data.data.accessToken;
      refreshToken = response.data.data.refresh_token || response.data.data.refreshToken;
      return response.data;
    }
  });

  // Test 3: Login
  tests.push({
    name: 'Login',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: randomEmail,
        password: 'password123'
      });
      return response.data;
    }
  });

  // Test 4: Get user info (autenticado)
  tests.push({
    name: 'Obtener Info de Usuario (autenticado)',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    }
  });

  // Test 5: Refresh token
  tests.push({
    name: 'Refresh Token',
    test: async () => {
      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken
      });
      return response.data;
    }
  });

  // Test 6: Listar planes
  tests.push({
    name: 'Listar Planes',
    test: async () => {
      const response = await axios.get(`${BASE_URL}/plans`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    }
  });

  // Ejecutar tests
  let passed = 0;
  let failed = 0;

  for (const { name, test } of tests) {
    try {
      console.log(`⏳ Ejecutando: ${name}...`);
      const result = await test();
      console.log(`✅ ${name}: PASÓ`);
      if (result.data) {
        console.log(`   Datos:`, JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
      }
      console.log('');
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: FALLÓ`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Error:`, error.response.data);
      } else {
        console.log(`   Error:`, error.message);
      }
      console.log('');
      failed++;
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(50));
  console.log(`✅ Pasaron: ${passed}/${tests.length}`);
  console.log(`❌ Fallaron: ${failed}/${tests.length}`);
  console.log('='.repeat(50) + '\n');

  if (failed === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron! La conexión con Laravel funciona correctamente.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa la configuración.\n');
    process.exit(1);
  }
}

// Ejecutar
testConnection().catch(error => {
  console.error('❌ Error fatal:', error.message);
  process.exit(1);
});
