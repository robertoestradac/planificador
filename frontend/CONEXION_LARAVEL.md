# Conexión Frontend → Backend Laravel

## ✅ Configuración Completada

El frontend Next.js está completamente configurado para conectarse al backend Laravel.

---

## 🔧 Cambios Realizados

### 1. Variables de Entorno

**Archivo:** `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_DOMAIN=localhost
NEXT_PUBLIC_APP_NAME=InvitApp
```

### 2. Cliente API (Axios)

**Archivo:** `frontend/src/lib/api.js`

**Cambios:**
- ✅ URL base: `http://localhost:8000/api/v1`
- ✅ `withCredentials: true` para Laravel Sanctum
- ✅ Interceptor de request: agrega token Bearer
- ✅ Interceptor de response: maneja refresh automático
- ✅ Soporte para snake_case y camelCase en respuestas

### 3. Store de Autenticación

**Archivo:** `frontend/src/store/authStore.js`

**Cambios:**
- ✅ Soporte para `access_token` y `accessToken`
- ✅ Soporte para `refresh_token` y `refreshToken`
- ✅ Soporte para `require2fa` y `requires_2fa`
- ✅ Manejo de 2FA con Laravel

### 4. Configuración de Next.js

**Archivo:** `frontend/next.config.js`

**Cambios:**
- ✅ Proxy/rewrites apuntando a puerto 8000
- ✅ Configuración de imágenes para puerto 8000
- ✅ Remote patterns para `/uploads/**`

---

## 🚀 Cómo Usar

### 1. Iniciar Backend Laravel

```bash
cd backend_laravel
php artisan serve
```

El servidor estará disponible en: `http://localhost:8000`

### 2. Iniciar Frontend Next.js

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

### 3. Probar la Conexión

1. Abre `http://localhost:3000` en tu navegador
2. Ve a la página de registro o login
3. Intenta registrar una nueva cuenta
4. Verifica en las DevTools (Network) que las peticiones van a `localhost:8000`

---

## 🔍 Verificación de Conexión

### Endpoints Disponibles

**Públicos:**
- `POST /api/v1/auth/register` - Registro de usuarios
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/invitations/public/{slug}` - Vista pública de invitación

**Protegidos (requieren autenticación):**
- `GET /api/v1/auth/me` - Información del usuario
- `GET /api/v1/events` - Listar eventos
- `POST /api/v1/events` - Crear evento
- `GET /api/v1/invitations` - Listar invitaciones
- Y muchos más...

### Probar con cURL

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Registro
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "tenant_name": "Test Company",
    "subdomain": "testcompany"
  }'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## 📊 Formato de Respuestas

Laravel devuelve las respuestas en el siguiente formato:

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "user": {...},
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Validation error"]
  }
}
```

### Compatibilidad

El frontend ahora soporta ambos formatos:
- **snake_case**: `access_token`, `refresh_token`, `requires_2fa`
- **camelCase**: `accessToken`, `refreshToken`, `require2fa`

---

## 🔐 Autenticación

### Flujo de Autenticación

1. **Login:**
   - Usuario envía email y password
   - Laravel valida credenciales
   - Si tiene 2FA: devuelve `temp_token`
   - Si no: devuelve `access_token` y `refresh_token`

2. **2FA (si está habilitado):**
   - Usuario envía `temp_token` y código 2FA
   - Laravel valida código
   - Devuelve `access_token` y `refresh_token`

3. **Requests Autenticados:**
   - Frontend agrega header: `Authorization: Bearer {access_token}`
   - Laravel valida token con Sanctum

4. **Refresh Token:**
   - Cuando `access_token` expira (401)
   - Frontend automáticamente llama `/auth/refresh`
   - Obtiene nuevo `access_token` y `refresh_token`
   - Reintenta request original

### Tokens

- **Access Token:** Expira en 15 minutos
- **Refresh Token:** Expira en 30 días
- Almacenados en: `localStorage` y cookies

---

## 🐛 Troubleshooting

### Error: "Network Error" o "CORS Error"

**Solución:**
1. Verifica que Laravel esté corriendo en puerto 8000
2. Verifica configuración CORS en `backend_laravel/config/cors.php`:
   ```php
   'allowed_origins' => [
       'http://localhost:3000',
       'http://localhost:3001',
   ],
   'supports_credentials' => true,
   ```

### Error: "401 Unauthorized"

**Solución:**
1. Verifica que el token esté en localStorage: `localStorage.getItem('access_token')`
2. Verifica que el header Authorization se esté enviando
3. Intenta hacer logout y login nuevamente

### Error: "Invalid credentials"

**Solución:**
1. Verifica que el usuario exista en la base de datos
2. Verifica que la contraseña sea correcta
3. Verifica que el tenant_id sea correcto (si aplica)

### Error: "Tenant not found"

**Solución:**
1. Verifica que el header `X-Tenant-Subdomain` se esté enviando
2. Verifica que el tenant exista en la base de datos
3. Para usuarios globales (SuperAdmin), no se requiere tenant

### Imágenes no cargan

**Solución:**
1. Verifica que Laravel esté sirviendo archivos estáticos
2. Ejecuta: `php artisan storage:link`
3. Verifica permisos de carpeta `storage/app/public`
4. Verifica configuración en `next.config.js`:
   ```javascript
   remotePatterns: [
     {
       protocol: 'http',
       hostname: 'localhost',
       port: '8000',
       pathname: '/uploads/**',
     },
   ]
   ```

### Refresh token no funciona

**Solución:**
1. Verifica que el refresh_token esté en localStorage
2. Verifica que no haya expirado (30 días)
3. Verifica que no haya sido revocado
4. Intenta hacer logout y login nuevamente

---

## 📝 Notas Importantes

### Diferencias con Backend Node.js

1. **Puerto:**
   - Node.js: 4000
   - Laravel: 8000

2. **Autenticación:**
   - Node.js: JWT puro
   - Laravel: Sanctum (compatible con JWT)

3. **Formato de Respuestas:**
   - Ambos usan el mismo formato JSON
   - Laravel usa snake_case por defecto
   - Frontend soporta ambos formatos

4. **CORS:**
   - Laravel requiere `withCredentials: true`
   - Configuración más estricta

### Ventajas de Laravel

- ✅ Mejor manejo de errores
- ✅ Validación más robusta
- ✅ ORM Eloquent
- ✅ Middleware más potente
- ✅ Cache integrado
- ✅ Testing más fácil

---

## ✅ Checklist de Verificación

Antes de usar en producción, verifica:

- [ ] Backend Laravel corriendo en puerto 8000
- [ ] Frontend Next.js corriendo en puerto 3000
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada y seeded
- [ ] CORS configurado correctamente
- [ ] Storage link creado (`php artisan storage:link`)
- [ ] Login funciona correctamente
- [ ] Registro funciona correctamente
- [ ] Refresh token funciona
- [ ] 2FA funciona (si está habilitado)
- [ ] Imágenes cargan correctamente
- [ ] Todos los módulos funcionan (eventos, invitaciones, etc.)

---

## 🎯 Próximos Pasos

1. **Testing:**
   - Probar todos los módulos del frontend
   - Verificar que todas las funcionalidades funcionen
   - Probar en diferentes navegadores

2. **Optimización:**
   - Implementar cache en frontend
   - Optimizar queries en backend
   - Implementar lazy loading

3. **Seguridad:**
   - Configurar rate limiting
   - Implementar HTTPS en producción
   - Configurar CSP headers

4. **Deployment:**
   - Configurar servidor de producción
   - Configurar CI/CD
   - Configurar backups

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Laravel: `storage/logs/laravel.log`
2. Revisa la consola del navegador (DevTools)
3. Revisa la pestaña Network en DevTools
4. Verifica que ambos servidores estén corriendo

---

## 🎉 ¡Listo!

El frontend está completamente configurado y listo para conectarse al backend Laravel. Solo necesitas:

1. Iniciar Laravel: `php artisan serve`
2. Iniciar Next.js: `npm run dev`
3. Abrir `http://localhost:3000`

¡Disfruta tu aplicación con Laravel! 🚀
