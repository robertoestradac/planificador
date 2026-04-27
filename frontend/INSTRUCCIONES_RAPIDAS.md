# 🚀 Instrucciones Rápidas - Frontend con Laravel

## ✅ El frontend ya está configurado para Laravel

No necesitas hacer nada más. Solo sigue estos pasos:

---

## 1️⃣ Iniciar Backend Laravel

```bash
cd backend_laravel
php artisan serve
```

✅ Backend corriendo en: `http://localhost:8000`

---

## 2️⃣ Iniciar Frontend Next.js

```bash
cd frontend
npm run dev
```

✅ Frontend corriendo en: `http://localhost:3000`

---

## 3️⃣ Probar la Aplicación

Abre tu navegador en: `http://localhost:3000`

### Primera vez:
1. Ve a **Registro**
2. Crea una cuenta nueva
3. Inicia sesión
4. ¡Listo! Ya puedes usar la aplicación

---

## 🧪 Probar Conexión (Opcional)

Si quieres verificar que todo funciona:

```bash
cd frontend
node test-connection.js
```

Este script probará:
- ✅ Health check
- ✅ Registro de usuario
- ✅ Login
- ✅ Obtener info de usuario
- ✅ Refresh token
- ✅ Listar planes

---

## 📝 Cambios Realizados

El frontend ya está configurado con:

✅ URL del API: `http://localhost:8000`
✅ Soporte para Laravel Sanctum
✅ Manejo de tokens (access + refresh)
✅ Soporte para 2FA
✅ Compatibilidad con respuestas de Laravel
✅ Configuración de CORS
✅ Configuración de imágenes

---

## 🐛 Si algo no funciona

### Backend no inicia:
```bash
# Verifica que la base de datos esté corriendo
# Verifica el archivo .env en backend_laravel
php artisan config:clear
php artisan cache:clear
php artisan serve
```

### Frontend no conecta:
```bash
# Verifica que el backend esté corriendo en puerto 8000
# Verifica el archivo .env.local en frontend
cd frontend
rm -rf .next
npm run dev
```

### Error de CORS:
```bash
# Verifica config/cors.php en backend_laravel
# Debe tener:
# 'allowed_origins' => ['http://localhost:3000']
# 'supports_credentials' => true
```

---

## 📚 Documentación Completa

Para más detalles, revisa:
- `CONEXION_LARAVEL.md` - Documentación completa de la conexión
- `README_LARAVEL.md` - Guía de migración
- `../MIGRACION_LARAVEL.md` - Documentación de la migración completa

---

## 🎯 ¡Eso es todo!

El frontend está listo. Solo necesitas:
1. Iniciar Laravel (`php artisan serve`)
2. Iniciar Next.js (`npm run dev`)
3. Abrir `http://localhost:3000`

**¡Disfruta tu aplicación! 🎉**
