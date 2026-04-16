# Script de limpieza para el proyecto de invitaciones
# Ejecutar con: .\clean.ps1

Write-Host "=== Limpieza del Proyecto ===" -ForegroundColor Cyan
Write-Host ""

# Función para mostrar tamaño de carpeta
function Get-FolderSize {
    param($path)
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -ErrorAction SilentlyContinue | 
                 Measure-Object -Property Length -Sum).Sum / 1MB
        return [math]::Round($size, 2)
    }
    return 0
}

# Mostrar tamaños antes de limpiar
Write-Host "Tamaños antes de limpiar:" -ForegroundColor Yellow
$frontendNextSize = Get-FolderSize "frontend\.next"
$frontendNodeSize = Get-FolderSize "frontend\node_modules"
$backendNodeSize = Get-FolderSize "backend\node_modules"
$backendUploadsSize = Get-FolderSize "backend\uploads"

Write-Host "  Frontend .next: $frontendNextSize MB"
Write-Host "  Frontend node_modules: $frontendNodeSize MB"
Write-Host "  Backend node_modules: $backendNodeSize MB"
Write-Host "  Backend uploads: $backendUploadsSize MB"
Write-Host ""

# Preguntar qué limpiar
$cleanNext = Read-Host "¿Limpiar frontend/.next? (s/n)"
$cleanFrontendNode = Read-Host "¿Limpiar frontend/node_modules? (s/n)"
$cleanBackendNode = Read-Host "¿Limpiar backend/node_modules? (s/n)"
$cleanUploads = Read-Host "¿Limpiar backend/uploads/*.webp? (s/n)"

Write-Host ""
Write-Host "Limpiando..." -ForegroundColor Green

# Limpiar .next
if ($cleanNext -eq "s") {
    if (Test-Path "frontend\.next") {
        Write-Host "  Eliminando frontend/.next..."
        Remove-Item -Recurse -Force "frontend\.next" -ErrorAction SilentlyContinue
        Write-Host "  ✓ frontend/.next eliminado" -ForegroundColor Green
    }
}

# Limpiar frontend node_modules
if ($cleanFrontendNode -eq "s") {
    if (Test-Path "frontend\node_modules") {
        Write-Host "  Eliminando frontend/node_modules..."
        Remove-Item -Recurse -Force "frontend\node_modules" -ErrorAction SilentlyContinue
        Write-Host "  ✓ frontend/node_modules eliminado" -ForegroundColor Green
    }
    if (Test-Path "frontend\package-lock.json") {
        Remove-Item -Force "frontend\package-lock.json" -ErrorAction SilentlyContinue
        Write-Host "  ✓ frontend/package-lock.json eliminado" -ForegroundColor Green
    }
}

# Limpiar backend node_modules
if ($cleanBackendNode -eq "s") {
    if (Test-Path "backend\node_modules") {
        Write-Host "  Eliminando backend/node_modules..."
        Remove-Item -Recurse -Force "backend\node_modules" -ErrorAction SilentlyContinue
        Write-Host "  ✓ backend/node_modules eliminado" -ForegroundColor Green
    }
    if (Test-Path "backend\package-lock.json") {
        Remove-Item -Force "backend\package-lock.json" -ErrorAction SilentlyContinue
        Write-Host "  ✓ backend/package-lock.json eliminado" -ForegroundColor Green
    }
}

# Limpiar uploads
if ($cleanUploads -eq "s") {
    if (Test-Path "backend\uploads") {
        Write-Host "  Eliminando backend/uploads/*.webp..."
        Get-ChildItem "backend\uploads" -Filter "*.webp" | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Archivos .webp eliminados (manteniendo .gitkeep)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Limpieza completada ===" -ForegroundColor Cyan

# Mostrar tamaños después de limpiar
Write-Host ""
Write-Host "Tamaños después de limpiar:" -ForegroundColor Yellow
$frontendNextSizeAfter = Get-FolderSize "frontend\.next"
$frontendNodeSizeAfter = Get-FolderSize "frontend\node_modules"
$backendNodeSizeAfter = Get-FolderSize "backend\node_modules"
$backendUploadsSizeAfter = Get-FolderSize "backend\uploads"

Write-Host "  Frontend .next: $frontendNextSizeAfter MB"
Write-Host "  Frontend node_modules: $frontendNodeSizeAfter MB"
Write-Host "  Backend node_modules: $backendNodeSizeAfter MB"
Write-Host "  Backend uploads: $backendUploadsSizeAfter MB"

$totalFreed = ($frontendNextSize - $frontendNextSizeAfter) + 
              ($frontendNodeSize - $frontendNodeSizeAfter) + 
              ($backendNodeSize - $backendNodeSizeAfter) + 
              ($backendUploadsSize - $backendUploadsSizeAfter)

Write-Host ""
Write-Host "Espacio liberado: $([math]::Round($totalFreed, 2)) MB" -ForegroundColor Green

# Preguntar si reinstalar dependencias
if ($cleanFrontendNode -eq "s" -or $cleanBackendNode -eq "s") {
    Write-Host ""
    $reinstall = Read-Host "¿Reinstalar dependencias? (s/n)"
    if ($reinstall -eq "s") {
        if ($cleanFrontendNode -eq "s") {
            Write-Host ""
            Write-Host "Instalando dependencias del frontend..." -ForegroundColor Cyan
            Set-Location frontend
            npm install
            Set-Location ..
        }
        if ($cleanBackendNode -eq "s") {
            Write-Host ""
            Write-Host "Instalando dependencias del backend..." -ForegroundColor Cyan
            Set-Location backend
            npm install
            Set-Location ..
        }
    }
}

Write-Host ""
Write-Host "¡Listo! Ahora puedes hacer commit y push a GitLab." -ForegroundColor Green
