# Frontend - Conexión con Backend Laravel

Este documento describe los cambios realizados para conectar el frontend Next.js con el backend Laravel.

## Cambios Realizados

### 1. Variables de Entorno

Se actualizó la URL del API en los archivos de configuración:

**Archivos modificados:**
- `.env.local.example`
- `.env.local`

**Cambio:**
```env
# Antes
NEXT_PUBLIC_API_URL=http://localhost:4000

# Ahora
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Configuración de Next.js

**Archivo:** `next.config.js`

Se actualizaron dos secciones:

#### a) Proxy/Rewrites
```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*', // Cambió de 4000 a 8000
    },
  ];
}
```

#### b) Configuración de Imágenes
```javascript
images: {
  remotePatterns: [
    {
      protocol: 'http',
      hostname: 'localhost',
      port: '8000', // Cambió de '4000' a '8000'
      pathname: '/uploads/**',
    },
    // ...
  ],
}
```

### 3. Cliente API (Axios)

**Archivo:** `src/lib/api.js`

**Cambios importantes:**

1. **URL base actualizada:**
   ```javascript
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
   ```

2. **withCredentials habilitado para Laravel Sanctum:**
   ```javascript
   const api = axios.create({
     baseURL: `${API_URL}/api/v1`,
     headers: { 'Content-Type': 'application/json' },
     withCredentials: true, // Importante para cookies CSRF de Laravel
   });
   ```

## Diferencias con Backend Node.js

### Autenticación

**Node.js (Express):**
- JWT puro con tokens en localStorage
- No requiere cookies CSRF
- `withCredentials: false`

**Laravel:**
- Soporta Laravel Sanctum (cookies + tokens)
- Puede requerir cookies CSRF para algunas operaciones
- `withCredentials: true` habilitado para compatibilidad

### Estructura de Respuestas

Ambos backends deberían mantener la misma estructura de respuesta JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

Si Laravel usa una estructura diferente, será necesario ajustar los interceptores de axios.

### Manejo de Errores

El interceptor de respuesta maneja automáticamente:
- Errores 401 (no autorizado)
- Refresh automático de tokens
- Redirección a login cuando falla la autenticación

## Instrucciones de Uso

### 1. Iniciar Backend Laravel

```bash
cd backend_laravel
php artisan serve
# El servidor inicia en http://localhost:8000
```

### 2. Iniciar Frontend

```bash
cd frontend
npm run dev
# El frontend inicia en http://localhost:3000
```

### 3. Verificar Conexión

1. Abre el navegador en `http://localhost:3000`
2. Intenta hacer login
3. Verifica en las DevTools (Network) que las peticiones van a `localhost:8000`

## Troubleshooting

### Error de CORS

Si recibes errores de CORS, verifica en Laravel:

**Archivo:** `backend_laravel/config/cors.php`

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:3000'],
'supports_credentials' => true,
```

### Tokens no se envían

Verifica que:
1. `withCredentials: true` esté configurado en `api.js`
2. Los tokens se guarden correctamente en localStorage
3. El interceptor de request esté agregando el header `Authorization`

### Imágenes no cargan

Verifica que:
1. El puerto en `next.config.js` sea `8000`
2. Laravel esté sirviendo archivos estáticos correctamente
3. La ruta `/uploads/**` esté accesible públicamente

## Notas Adicionales

- El frontend es compatible con ambos backends (Node.js y Laravel)
- Solo necesitas cambiar la variable `NEXT_PUBLIC_API_URL`
- Los interceptores de axios manejan automáticamente la autenticación
- Laravel Sanctum es compatible con el sistema de tokens JWT actual

## Próximos Pasos

Si necesitas migrar completamente a Laravel:

1. Verifica que todas las rutas del API estén implementadas
2. Prueba cada módulo del frontend (eventos, invitaciones, etc.)
3. Ajusta las respuestas del backend si es necesario
4. Actualiza la documentación del API si hay cambios
