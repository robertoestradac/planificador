# 🚨 Solución Rápida al Error de 6.17 GB

## El Problema

Git está intentando subir **6.17 GB** porque los archivos ZIP/RAR están en el historial, aunque los hayas eliminado.

## ✅ Solución en 3 Pasos (5 minutos)

### Paso 1: Ejecutar el Script de Limpieza

```powershell
.\limpiar_y_resubir.ps1
```

Este script:
1. Crea una copia limpia del proyecto (sin historial)
2. Copia solo los archivos necesarios
3. Inicializa un nuevo repositorio Git
4. Hace push --force a GitLab

### Paso 2: Seguir las Instrucciones del Script

El script te preguntará:
- ¿Continuar? → Responde `s`
- ¿Hacer push --force ahora? → Responde `s`

### Paso 3: Verificar en GitLab

Abre tu repositorio en GitLab y verifica que:
- El tamaño es ~3 MB ✅
- Todos los archivos están presentes ✅
- No hay archivos ZIP/RAR ✅

## 🔧 Solución Manual (si prefieres hacerlo paso a paso)

```powershell
# 1. Ir al directorio padre
cd ..

# 2. Crear carpeta limpia
New-Item -ItemType Directory -Name "invitaciones-clean"

# 3. Copiar archivos necesarios
Copy-Item -Recurse "invitaciones\backend" "invitaciones-clean\" -Exclude "node_modules"
Copy-Item -Recurse "invitaciones\frontend" "invitaciones-clean\" -Exclude "node_modules",".next"
Copy-Item "invitaciones\.gitignore" "invitaciones-clean\"
Copy-Item "invitaciones\package.json" "invitaciones-clean\"
Copy-Item "invitaciones\*.md" "invitaciones-clean\"
Copy-Item "invitaciones\*.ps1" "invitaciones-clean\"
Copy-Item "invitaciones\*.sh" "invitaciones-clean\"

# 4. Crear carpeta uploads vacía
New-Item -ItemType Directory -Path "invitaciones-clean\backend\uploads" -Force
New-Item -ItemType File -Path "invitaciones-clean\backend\uploads\.gitkeep" -Force

# 5. Ir a la carpeta limpia
cd invitaciones-clean

# 6. Inicializar Git
git init
git add .
git commit -m "Proyecto optimizado - sin archivos grandes"

# 7. Conectar con GitLab
git remote add origin https://gitlab.com/robertoestradac/invitaciones.git
git branch -M main

# 8. Push con --force
git push -u origin main --force
```

## 📊 Verificación

Después del push, verifica:

```powershell
# Ver tamaño del repositorio
git count-objects -vH

# Debería mostrar algo como:
# size: 2-3 MB
```

## ⚠️ Importante

- El `--force` sobrescribirá el repositorio en GitLab
- Esto eliminará el historial anterior (pero no lo necesitas)
- Después del push exitoso, puedes eliminar la carpeta `invitaciones` antigua

## 🎯 Resultado Esperado

```
Enumerating objects: 350, done.
Counting objects: 100% (350/350), done.
Delta compression using up to 8 threads
Compressing objects: 100% (310/310), done.
Writing objects: 100% (350/350), 2.87 MiB | 1.50 MiB/s, done.
Total 350 (delta 46), reused 0 (delta 0)
To https://gitlab.com/robertoestradac/invitaciones.git
 + 11e148f...abc1234 main -> main (forced update)
```

Tamaño: **~3 MB** en lugar de 6.17 GB ✅

## 🆘 Si Algo Sale Mal

1. **Error de permisos**:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Error de conexión**:
   ```bash
   git config --global http.postBuffer 524288000
   ```

3. **Repositorio remoto no existe**:
   - Verifica la URL: `git remote -v`
   - Actualiza si es necesario: `git remote set-url origin <nueva-url>`

## 📞 Resumen

1. Ejecuta: `.\limpiar_y_resubir.ps1`
2. Responde `s` a las preguntas
3. Espera ~30 segundos
4. ¡Listo! Tu repositorio ahora pesa 3 MB

---

**Tiempo estimado**: 5 minutos  
**Dificultad**: Fácil  
**Resultado**: Repositorio limpio de 3 MB en GitLab ✅
