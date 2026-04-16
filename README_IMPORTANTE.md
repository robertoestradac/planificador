# ⚠️ IMPORTANTE - LEER ANTES DE HACER PUSH

## 🎯 Problema Resuelto

El proyecto pesaba más de 3 GB debido a:
- Carpeta `.next/cache/` (1.53 GB)
- Archivos ZIP/RAR trackeados por Git
- Dependencias no utilizadas

## ✅ Solución Implementada

Se han realizado las siguientes optimizaciones:

1. ✅ Creado `.gitignore` en la raíz
2. ✅ Removidos archivos ZIP/RAR del tracking
3. ✅ Optimizado `frontend/package.json` (removidas dependencias no usadas)
4. ✅ Optimizado `frontend/next.config.js` (mejoras de performance)
5. ✅ Creados scripts de limpieza (`clean.ps1` y `clean.sh`)

## 🚨 ANTES DE HACER PUSH A GITLAB

### Paso 1: Limpiar la carpeta .next
```powershell
# Windows PowerShell
Remove-Item -Recurse -Force frontend\.next

# O usar el script:
.\clean.ps1
```

### Paso 2: Verificar qué se va a subir
```bash
git status
```

**Asegúrate de que NO aparezcan:**
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ Archivos `.zip` o `.rar`
- ❌ `backend/uploads/*.webp`

### Paso 3: Hacer commit y push
```bash
git add .
git commit -m "Optimización del proyecto - reducido de 3GB a 3MB"
git push origin main
```

## 📊 Resultado Esperado

- **Antes**: ~3+ GB
- **Después**: ~2-3 MB ✅
- **Reducción**: 99%

## 📚 Documentación

Lee los siguientes archivos para más información:

1. **RESUMEN_OPTIMIZACION.md** - Resumen ejecutivo de los cambios
2. **OPTIMIZACION.md** - Guía detallada de optimización
3. **clean.ps1** / **clean.sh** - Scripts de limpieza automatizada

## 🔧 Comandos Rápidos

```bash
# Limpiar proyecto
.\clean.ps1

# Ver tamaño de carpetas
Get-ChildItem -Directory | ForEach-Object { 
  $size = (Get-ChildItem $_.FullName -Recurse -ErrorAction SilentlyContinue | 
    Measure-Object -Property Length -Sum).Sum / 1MB
  [PSCustomObject]@{Folder=$_.Name; SizeMB=[math]::Round($size, 2)} 
} | Sort-Object SizeMB -Descending

# Verificar estado de Git
git status

# Limpiar .next manualmente
Remove-Item -Recurse -Force frontend\.next
```

## ✨ Próximos Pasos

1. Ejecutar `.\clean.ps1` para limpiar el proyecto
2. Verificar con `git status` que no hay archivos grandes
3. Hacer commit y push
4. En el servidor de producción, ejecutar `npm install` y `npm run build`

---

**¿Dudas?** Revisa `OPTIMIZACION.md` para más detalles.
