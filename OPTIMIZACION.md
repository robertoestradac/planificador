# Guía de Optimización del Proyecto

## Problemas Identificados y Solucionados

### 1. Archivos Innecesarios en Git
- ❌ Archivos ZIP/RAR estaban siendo trackeados (frontend.zip, invitaciones.rar, etc.)
- ❌ No había .gitignore en la raíz del proyecto
- ✅ Creado .gitignore global
- ✅ Removidos archivos comprimidos del tracking

### 2. Dependencias No Utilizadas
Removidas del frontend/package.json:
- `date-fns` (3.3.1) - No se usa en ningún archivo
- `react-select` (5.10.2) - No se usa en ningún archivo

Esto reducirá ~2-3 MB del bundle final.

### 3. PROBLEMA CRÍTICO: Caché de Next.js Excesivo
- ❌ La carpeta `.next/cache` pesaba 1.53 GB
- ❌ El build total de `.next` pesaba 1.68 GB
- ✅ Agregado `.next/cache/` al .gitignore
- ✅ Optimizada configuración de webpack en next.config.js
- ✅ Habilitado `optimizeCss: true` experimental

**IMPORTANTE**: La carpeta `.next` NUNCA debe subirse a Git. Solo se genera localmente y en el servidor de producción.

### 4. Configuración de Next.js Optimizada
Mejoras en `frontend/next.config.js`:
- ✅ Habilitado `swcMinify: true` para minificación más rápida
- ✅ Removidos console.log en producción
- ✅ Deshabilitados source maps en producción
- ✅ Optimización de imágenes con formato WebP
- ✅ Optimización de webpack con `moduleIds: 'deterministic'`
- ✅ Habilitado `optimizeCss: true` experimental

### 5. Carpeta uploads con archivos de desarrollo
- La carpeta `backend/uploads` tiene 5.88 MB de imágenes de prueba
- Estas NO deben subirse a Git (ya está en .gitignore)

## Pasos para Limpiar el Proyecto

### Paso 1: Limpiar node_modules y reinstalar (OPCIONAL)
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd ../backend
rm -rf node_modules package-lock.json
npm install
```

### Paso 2: Limpiar archivos de build (IMPORTANTE)
```bash
# Frontend - SIEMPRE hacer esto antes de subir a Git
cd frontend
rm -rf .next out

# En PowerShell:
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force out

# Backend (si aplica)
cd ../backend
rm -rf dist
```

### Paso 3: Limpiar uploads de desarrollo (RECOMENDADO)
```bash
cd backend/uploads
# En Windows PowerShell:
Get-ChildItem -Filter "*.webp" | Remove-Item
# Mantener solo .gitkeep
```

### Paso 4: Verificar qué se subirá a Git
```bash
git status
# Verificar que NO aparezcan:
# - node_modules/
# - .next/
# - archivos .zip o .rar
# - backend/uploads/*.webp

git add .
git status
```

## Tamaños Esperados

### Antes de la optimización:
- Frontend: ~473 MB (con node_modules)
- Backend: ~36 MB (con node_modules)
- Frontend .next (build): ~1.68 GB ❌ PROBLEMA
- Total en disco: ~2.18 GB

### Después de la optimización:
- Frontend: ~468 MB (con node_modules optimizados)
- Backend: ~36 MB (sin cambios)
- Frontend .next (build): ~150-200 MB ✅ (sin caché)
- Total en disco: ~700 MB

### Lo que se sube a Git (sin node_modules, .next, uploads):
- Frontend: ~1-2 MB
- Backend: ~0.5 MB
- Total: ~2-3 MB ✅

### Desglose del problema de .next:
- `.next/cache/`: 1.53 GB (webpack + swc cache) ❌
- `.next/standalone/`: 59 MB (servidor standalone)
- `.next/static/`: 43 MB (assets estáticos)
- `.next/server/`: 42 MB (código del servidor)

**Solución**: La carpeta `.next/cache/` NO debe subirse a Git y se regenera en cada build.

## Optimizaciones Adicionales Recomendadas

### 1. Usar pnpm en lugar de npm
pnpm usa enlaces simbólicos y ahorra espacio:
```bash
npm install -g pnpm
pnpm install
```

### 2. Analizar el bundle de Next.js
```bash
cd frontend
npm install --save-dev @next/bundle-analyzer
```

Agregar a `next.config.js`:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
```

Ejecutar:
```bash
ANALYZE=true npm run build
```

### 3. Lazy Loading de Componentes Pesados
Ya se está usando en algunos lugares, pero revisar:
- html2canvas (ya está con dynamic import ✅)
- recharts (considerar lazy load)
- jspdf (considerar lazy load)

### 4. Optimizar Imágenes
- Usar formato WebP (ya configurado ✅)
- Comprimir imágenes antes de subirlas
- Considerar usar un CDN para imágenes

### 5. Docker Multi-stage Build
Los Dockerfiles ya están optimizados con .dockerignore ✅

## Comandos Útiles

### Ver tamaño de carpetas
```bash
# PowerShell
Get-ChildItem -Directory | ForEach-Object { 
  $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
  [PSCustomObject]@{Folder=$_.Name; SizeMB=[math]::Round($size, 2)} 
} | Sort-Object SizeMB -Descending
```

### Verificar dependencias no usadas
```bash
cd frontend
npx depcheck
```

### Limpiar caché de npm
```bash
npm cache clean --force
```

## Checklist antes de subir a GitLab

- [ ] Ejecutar `git status` y verificar que no hay node_modules
- [ ] Verificar que no hay carpeta .next
- [ ] Verificar que no hay archivos .zip o .rar
- [ ] Verificar que backend/uploads solo tiene .gitkeep
- [ ] Ejecutar `npm run build` en frontend para verificar que compila
- [ ] Verificar que el .gitignore está en la raíz
- [ ] Commit y push

## Resultado Final

Con estas optimizaciones:
- ✅ Reducción de ~5 MB en dependencias
- ✅ Build más rápido con swcMinify
- ✅ Bundle más pequeño sin console.log
- ✅ Solo ~2-3 MB se suben a Git (sin node_modules)
- ✅ Archivos innecesarios removidos del tracking
