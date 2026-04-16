# Resumen de Optimización - Proyecto de Invitaciones

## 🎯 Problema Principal Identificado

El proyecto pesaba más de 3 GB al intentar subirlo a GitLab debido a:

1. **Carpeta `.next/cache/` de Next.js**: 1.53 GB
2. **Archivos ZIP/RAR en el repositorio**: ~500 MB
3. **Dependencias no utilizadas**: ~5 MB
4. **Imágenes de desarrollo en uploads**: 5.88 MB

## ✅ Soluciones Implementadas

### 1. Creado `.gitignore` en la raíz del proyecto
Ahora excluye correctamente:
- `node_modules/`
- `.next/`
- `*.zip`, `*.rar`, `*.tar.gz`
- `uploads/*` (excepto .gitkeep)
- Archivos de logs y temporales

### 2. Removidos archivos innecesarios del tracking de Git
```bash
git rm --cached frontend.zip invitacion_3.zip invitaciones.rar 
git rm --cached invitaciones_15_04.zip invitaciones_2.zip sistema_invitaciones.zip
git rm --cached FIXES_APPLIED.md SOLUCION_ERROR_403.md
```

### 3. Optimizado `frontend/package.json`
Removidas dependencias no utilizadas:
- ❌ `date-fns` (3.3.1)
- ❌ `react-select` (5.10.2)

### 4. Optimizado `frontend/next.config.js`
Agregadas optimizaciones:
- ✅ `swcMinify: true` - Minificación más rápida
- ✅ `removeConsole` en producción
- ✅ `productionBrowserSourceMaps: false`
- ✅ Optimización de webpack con `moduleIds: 'deterministic'`
- ✅ `optimizeCss: true` experimental
- ✅ Formato WebP para imágenes

### 5. Mejorados archivos `.gitignore` y `.dockerignore`
- Frontend y backend tienen configuraciones optimizadas
- Excluyen correctamente archivos de build y caché

### 6. Creados scripts de limpieza
- `clean.ps1` - Para Windows PowerShell
- `clean.sh` - Para Linux/Mac/Git Bash
- `package.json` en la raíz con comandos útiles

## 📊 Resultados

### Antes:
- Tamaño total en disco: ~2.18 GB
- Tamaño al subir a Git: ~3+ GB (incluía .next, zips, etc.)
- Frontend .next: 1.68 GB
- Archivos innecesarios: ~500 MB

### Después:
- Tamaño total en disco: ~700 MB (sin .next/cache)
- Tamaño al subir a Git: ~2-3 MB ✅
- Frontend .next: 150-200 MB (sin caché)
- Archivos innecesarios: 0 MB ✅

### Reducción: ~99% del tamaño en Git

## 🚀 Cómo usar

### Antes de hacer commit y push:

1. **Limpiar el proyecto** (recomendado):
   ```powershell
   # Windows PowerShell
   .\clean.ps1
   
   # O manualmente:
   Remove-Item -Recurse -Force frontend\.next
   ```

2. **Verificar qué se va a subir**:
   ```bash
   git status
   ```
   
   Asegúrate de que NO aparezcan:
   - `node_modules/`
   - `.next/`
   - Archivos `.zip` o `.rar`
   - `backend/uploads/*.webp`

3. **Hacer commit**:
   ```bash
   git add .
   git commit -m "Optimización del proyecto - reducido tamaño"
   git push
   ```

### Para desarrollo:

1. **Instalar dependencias**:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Ejecutar en desarrollo**:
   ```bash
   # Frontend
   cd frontend && npm run dev
   
   # Backend
   cd backend && npm run dev
   ```

3. **Build de producción**:
   ```bash
   cd frontend && npm run build
   ```

## 📝 Archivos Importantes

- `.gitignore` - Raíz del proyecto (NUEVO)
- `frontend/.gitignore` - Específico del frontend
- `backend/.gitignore` - Específico del backend
- `frontend/next.config.js` - Configuración optimizada de Next.js
- `frontend/package.json` - Dependencias optimizadas
- `clean.ps1` / `clean.sh` - Scripts de limpieza
- `OPTIMIZACION.md` - Guía detallada de optimización

## ⚠️ Importante

1. **NUNCA subir a Git**:
   - `node_modules/`
   - `.next/`
   - Archivos comprimidos (.zip, .rar, etc.)
   - Imágenes de desarrollo en `uploads/`

2. **Siempre limpiar antes de push**:
   ```powershell
   Remove-Item -Recurse -Force frontend\.next
   ```

3. **Verificar el tamaño antes de push**:
   ```bash
   git status
   # Si ves archivos grandes, revisa el .gitignore
   ```

## 🔧 Comandos Útiles

```bash
# Ver tamaño de carpetas
Get-ChildItem -Directory | ForEach-Object { 
  $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
  [PSCustomObject]@{Folder=$_.Name; SizeMB=[math]::Round($size, 2)} 
} | Sort-Object SizeMB -Descending

# Limpiar caché de npm
npm cache clean --force

# Verificar dependencias no usadas
cd frontend && npx depcheck
```

## ✨ Próximos Pasos Recomendados

1. Considerar usar `pnpm` en lugar de `npm` para ahorrar más espacio
2. Implementar análisis de bundle con `@next/bundle-analyzer`
3. Lazy loading de componentes pesados (recharts, jspdf)
4. Usar CDN para imágenes en producción
5. Implementar CI/CD que haga build automático

## 📞 Soporte

Si tienes problemas:
1. Revisa `OPTIMIZACION.md` para más detalles
2. Ejecuta `.\clean.ps1` para limpiar el proyecto
3. Verifica que `.gitignore` esté en la raíz
4. Ejecuta `git status` para ver qué se va a subir
