# Script para limpiar el repositorio y resubir sin archivos grandes
# Ejecutar con: .\limpiar_y_resubir.ps1

Write-Host "=== Limpieza y Resubida del Repositorio ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path ".git")) {
    Write-Host "Error: No estás en un repositorio Git" -ForegroundColor Red
    exit 1
}

# Obtener la URL del remoto
$remoteUrl = git config --get remote.origin.url
if (-not $remoteUrl) {
    Write-Host "Error: No hay un remoto configurado" -ForegroundColor Red
    Write-Host "Configura el remoto con: git remote add origin <URL>" -ForegroundColor Yellow
    exit 1
}

Write-Host "URL del remoto: $remoteUrl" -ForegroundColor Green
Write-Host ""

# Preguntar confirmación
Write-Host "Este script va a:" -ForegroundColor Yellow
Write-Host "  1. Crear un nuevo repositorio limpio sin historial"
Write-Host "  2. Copiar solo los archivos necesarios"
Write-Host "  3. Hacer push --force al remoto (sobrescribirá el repositorio)"
Write-Host ""
$confirm = Read-Host "¿Continuar? (s/n)"

if ($confirm -ne "s") {
    Write-Host "Operación cancelada" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Iniciando limpieza..." -ForegroundColor Green

# Paso 1: Guardar el directorio actual
$currentDir = Get-Location

# Paso 2: Ir al directorio padre
Set-Location ..

# Paso 3: Crear carpeta temporal
$tempDir = "invitaciones-clean-temp"
if (Test-Path $tempDir) {
    Write-Host "Eliminando carpeta temporal anterior..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $tempDir
}

Write-Host "Creando carpeta limpia..." -ForegroundColor Cyan
New-Item -ItemType Directory -Name $tempDir | Out-Null

# Paso 4: Copiar archivos necesarios
Write-Host "Copiando archivos..." -ForegroundColor Cyan

# Copiar backend (sin node_modules y uploads)
Write-Host "  - backend/"
Copy-Item -Recurse "invitaciones\backend" "$tempDir\" -Exclude "node_modules","uploads"
New-Item -ItemType Directory -Path "$tempDir\backend\uploads" -Force | Out-Null
New-Item -ItemType File -Path "$tempDir\backend\uploads\.gitkeep" -Force | Out-Null

# Copiar frontend (sin node_modules y .next)
Write-Host "  - frontend/"
Copy-Item -Recurse "invitaciones\frontend" "$tempDir\" -Exclude "node_modules",".next","out"

# Copiar archivos de configuración
Write-Host "  - archivos de configuración"
Copy-Item "invitaciones\.gitignore" "$tempDir\" -ErrorAction SilentlyContinue
Copy-Item "invitaciones\package.json" "$tempDir\" -ErrorAction SilentlyContinue
Copy-Item "invitaciones\*.md" "$tempDir\" -ErrorAction SilentlyContinue
Copy-Item "invitaciones\*.ps1" "$tempDir\" -ErrorAction SilentlyContinue
Copy-Item "invitaciones\*.sh" "$tempDir\" -ErrorAction SilentlyContinue

# Paso 5: Limpiar archivos innecesarios en la copia
Write-Host "Limpiando archivos innecesarios..." -ForegroundColor Cyan

# Limpiar .next si existe
if (Test-Path "$tempDir\frontend\.next") {
    Remove-Item -Recurse -Force "$tempDir\frontend\.next"
}

# Limpiar uploads
if (Test-Path "$tempDir\backend\uploads") {
    Get-ChildItem "$tempDir\backend\uploads" -Filter "*.webp" -ErrorAction SilentlyContinue | Remove-Item -Force
}

# Paso 6: Inicializar nuevo repositorio
Write-Host "Inicializando nuevo repositorio..." -ForegroundColor Cyan
Set-Location $tempDir

git init
git add .
git commit -m "Proyecto optimizado - sin archivos grandes (3MB)"

# Paso 7: Conectar con el remoto
Write-Host "Conectando con el remoto..." -ForegroundColor Cyan
git remote add origin $remoteUrl
git branch -M main

# Paso 8: Mostrar estadísticas
Write-Host ""
Write-Host "=== Estadísticas del Nuevo Repositorio ===" -ForegroundColor Cyan
$stats = git count-objects -v
Write-Host $stats

# Calcular tamaño aproximado
$size = (Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host ""
Write-Host "Tamaño total: $([math]::Round($size, 2)) MB" -ForegroundColor Green

# Paso 9: Preguntar si hacer push
Write-Host ""
Write-Host "=== Listo para Push ===" -ForegroundColor Cyan
Write-Host "El repositorio limpio está en: $tempDir" -ForegroundColor Yellow
Write-Host "Remoto: $remoteUrl" -ForegroundColor Yellow
Write-Host ""
$pushConfirm = Read-Host "¿Hacer push --force ahora? (s/n)"

if ($pushConfirm -eq "s") {
    Write-Host ""
    Write-Host "Haciendo push..." -ForegroundColor Green
    git push -u origin main --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== ¡Push Exitoso! ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "Próximos pasos:" -ForegroundColor Cyan
        Write-Host "  1. Verifica el repositorio en GitLab"
        Write-Host "  2. Si todo está bien, puedes eliminar la carpeta 'invitaciones' antigua"
        Write-Host "  3. Renombra 'invitaciones-clean-temp' a 'invitaciones'"
        Write-Host ""
        Write-Host "Comandos:" -ForegroundColor Yellow
        Write-Host "  cd .."
        Write-Host "  Remove-Item -Recurse -Force invitaciones"
        Write-Host "  Rename-Item invitaciones-clean-temp invitaciones"
        Write-Host "  cd invitaciones"
    } else {
        Write-Host ""
        Write-Host "Error al hacer push" -ForegroundColor Red
        Write-Host "Revisa el error y vuelve a intentar con: git push -u origin main --force" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Push cancelado" -ForegroundColor Yellow
    Write-Host "Para hacer push manualmente:" -ForegroundColor Cyan
    Write-Host "  cd $tempDir"
    Write-Host "  git push -u origin main --force"
}

Write-Host ""
Write-Host "Ubicación actual: $(Get-Location)" -ForegroundColor Cyan
