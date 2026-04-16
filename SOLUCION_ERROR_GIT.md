# Solución al Error de Git - 6.17 GB

## 🔴 Problema

El error muestra:
```
Writing objects: 100% (350/350), 6.17 GiB | 3.20 MiB/s
error: RPC failed; curl 55 Send failure: Connection was reset
```

Esto significa que Git está intentando subir **6.17 GB** aunque solo deberías subir ~3 MB.

## 🔍 Causa

Los archivos ZIP/RAR que eliminaste siguen en el **historial de Git**:
- `invitaciones.rar` - 1.25 GB
- `invitaciones_15_04.zip` - 1.11 GB
- `sistema_invitaciones.zip` - 1.06 GB
- `frontend.zip` - 767 MB
- `invitacion_3.zip` - 149 MB
- `invitaciones_2.zip` - (tamaño desconocido)

**Total**: ~4.3 GB en archivos que ya no necesitas

## ✅ Solución: Limpiar el Historial de Git

### Opción 1: Usar git filter-repo (RECOMENDADO)

Esta es la forma moderna y más rápida:

```bash
# 1. Instalar git-filter-repo (si no lo tienes)
pip install git-filter-repo

# 2. Hacer backup del repositorio
cd ..
cp -r invitaciones invitaciones-backup

# 3. Volver al repositorio
cd invitaciones

# 4. Limpiar los archivos grandes del historial
git filter-repo --path invitaciones.rar --invert-paths
git filter-repo --path invitaciones_15_04.zip --invert-paths
git filter-repo --path sistema_invitaciones.zip --invert-paths
git filter-repo --path frontend.zip --invert-paths
git filter-repo --path invitacion_3.zip --invert-paths
git filter-repo --path invitaciones_2.zip --invert-paths
git filter-repo --path FIXES_APPLIED.md --invert-paths
git filter-repo --path SOLUCION_ERROR_403.md --invert-paths

# 5. Forzar push al remoto
git remote add origin <tu-url-de-gitlab>
git push origin --force --all
```

### Opción 2: Usar BFG Repo-Cleaner (MÁS FÁCIL)

```bash
# 1. Descargar BFG
# Ir a: https://rtyley.github.io/bfg-repo-cleaner/
# Descargar bfg.jar

# 2. Hacer backup
cd ..
cp -r invitaciones invitaciones-backup
cd invitaciones

# 3. Limpiar archivos grandes
java -jar bfg.jar --delete-files "*.{zip,rar}" .

# 4. Limpiar referencias
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Forzar push
git push origin --force --all
```

### Opción 3: Empezar de Cero (MÁS SIMPLE)

Si no te importa perder el historial:

```bash
# 1. Hacer backup de los archivos actuales
cd ..
mkdir invitaciones-clean
cp -r invitaciones/backend invitaciones-clean/
cp -r invitaciones/frontend invitaciones-clean/
cp invitaciones/.gitignore invitaciones-clean/
cp invitaciones/package.json invitaciones-clean/
cp invitaciones/*.md invitaciones-clean/
cp invitaciones/*.ps1 invitaciones-clean/
cp invitaciones/*.sh invitaciones-clean/

# 2. Ir a la carpeta limpia
cd invitaciones-clean

# 3. Inicializar nuevo repositorio
git init
git add .
git commit -m "Proyecto optimizado - sin archivos grandes"

# 4. Conectar con GitLab
git remote add origin <tu-url-de-gitlab>
git branch -M main
git push -u origin main --force
```

## 🚀 Opción Recomendada: Empezar de Cero

Te recomiendo la **Opción 3** porque es la más simple y rápida. Aquí están los comandos exactos:

```powershell
# En PowerShell

# 1. Ir al directorio padre
cd ..

# 2. Crear carpeta limpia
New-Item -ItemType Directory -Name "invitaciones-clean"

# 3. Copiar solo lo necesario
Copy-Item -Recurse "invitaciones\backend" "invitaciones-clean\"
Copy-Item -Recurse "invitaciones\frontend" "invitaciones-clean\"
Copy-Item "invitaciones\.gitignore" "invitaciones-clean\"
Copy-Item "invitaciones\package.json" "invitaciones-clean\"
Copy-Item "invitaciones\*.md" "invitaciones-clean\"
Copy-Item "invitaciones\*.ps1" "invitaciones-clean\"
Copy-Item "invitaciones\*.sh" "invitaciones-clean\"

# 4. Ir a la carpeta limpia
cd invitaciones-clean

# 5. Limpiar .next si existe
if (Test-Path "frontend\.next") { Remove-Item -Recurse -Force "frontend\.next" }

# 6. Limpiar uploads
Get-ChildItem "backend\uploads" -Filter "*.webp" | Remove-Item -Force

# 7. Inicializar Git
git init
git add .
git commit -m "Proyecto optimizado - sin archivos grandes"

# 8. Conectar con GitLab (reemplaza con tu URL)
git remote add origin https://gitlab.com/tu-usuario/tu-repo.git
git branch -M main

# 9. Push (esto sobrescribirá el repositorio remoto)
git push -u origin main --force
```

## ⚠️ Importante

Después de hacer esto:

1. **Verifica el tamaño**:
   ```bash
   git count-objects -vH
   ```
   Debería mostrar ~3 MB

2. **Verifica qué se va a subir**:
   ```bash
   git status
   git log --oneline
   ```

3. **Haz el push**:
   ```bash
   git push origin main --force
   ```

## 📊 Resultado Esperado

Después de limpiar:
- Tamaño del repositorio: ~3 MB ✅
- Tiempo de push: ~5-10 segundos ✅
- Sin errores de conexión ✅

## 🔧 Si Sigues Teniendo Problemas

Si después de limpiar el historial sigues teniendo problemas:

1. **Aumentar el buffer de Git**:
   ```bash
   git config --global http.postBuffer 524288000
   git config --global http.maxRequestBuffer 100M
   git config --global core.compression 0
   ```

2. **Verificar límites de GitLab**:
   - GitLab tiene un límite de ~5 GB por push
   - Verifica en Settings > General > Repository size limit

3. **Subir en partes**:
   ```bash
   git push origin main --no-verify
   ```

## 📝 Resumen

El problema es que los archivos ZIP/RAR están en el historial de Git. La solución más simple es:

1. Crear una carpeta limpia
2. Copiar solo los archivos necesarios
3. Inicializar un nuevo repositorio
4. Hacer push con --force

Esto eliminará todo el historial pero resolverá el problema de tamaño.
