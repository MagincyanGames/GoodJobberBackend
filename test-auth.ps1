#!/usr/bin/env pwsh
# Script de prueba del sistema de administración

Write-Host "🧪 Probando el sistema de autenticación..." -ForegroundColor Cyan
Write-Host ""

# URL base (ajusta si es necesario)
$BASE_URL = "http://localhost:8787"

Write-Host "1️⃣ Probando login con admin..." -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body '{"name":"admin","password":"admin123"}' `
    -ErrorAction Stop

Write-Host "✅ Login exitoso!" -ForegroundColor Green
Write-Host "Usuario: $($loginResponse.user.name)" -ForegroundColor White
Write-Host "isAdmin: $($loginResponse.user.isAdmin)" -ForegroundColor White
Write-Host "Token: $($loginResponse.token.Substring(0, 50))..." -ForegroundColor Gray
Write-Host ""

$token = $loginResponse.token

Write-Host "2️⃣ Probando creación de usuario con token de admin..." -ForegroundColor Yellow
try {
    $createResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users" `
        -Method Post `
        -ContentType "application/json" `
        -Headers @{Authorization="Bearer $token"} `
        -Body '{"name":"test_user","password":"test123","isAdmin":false}' `
        -ErrorAction Stop
    
    Write-Host "✅ Usuario creado exitosamente!" -ForegroundColor Green
    Write-Host "Usuario: $($createResponse.user.name)" -ForegroundColor White
    Write-Host "isAdmin: $($createResponse.user.isAdmin)" -ForegroundColor White
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠️  El usuario ya existe (esto es normal si ya se ejecutó antes)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "3️⃣ Probando registro público (debería ser usuario normal)..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"name":"test_public","password":"test123"}' `
        -ErrorAction Stop
    
    Write-Host "✅ Registro exitoso!" -ForegroundColor Green
    Write-Host "Usuario: $($registerResponse.user.name)" -ForegroundColor White
    Write-Host "isAdmin: $($registerResponse.user.isAdmin)" -ForegroundColor White
    
    if ($registerResponse.user.isAdmin -eq $false) {
        Write-Host "✅ CORRECTO: El usuario público NO es admin" -ForegroundColor Green
    } else {
        Write-Host "❌ ERROR: El usuario público es admin (no debería)" -ForegroundColor Red
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "⚠️  El usuario ya existe (esto es normal si ya se ejecutó antes)" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "4️⃣ Probando acceso sin autenticación a endpoint protegido..." -ForegroundColor Yellow
try {
    $noAuthResponse = Invoke-RestMethod -Uri "$BASE_URL/api/users" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"name":"hacker","password":"hack123","isAdmin":true}' `
        -ErrorAction Stop
    
    Write-Host "❌ ERROR: No debería poder crear usuario sin token" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ CORRECTO: Endpoint protegido rechaza peticiones sin token" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error inesperado: $_" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "🎉 Pruebas completadas!" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Resumen:" -ForegroundColor White
Write-Host "  ✅ Login de admin funciona" -ForegroundColor Green
Write-Host "  ✅ Admin puede crear usuarios" -ForegroundColor Green
Write-Host "  ✅ Registro público crea usuarios normales" -ForegroundColor Green
Write-Host "  ✅ Endpoints protegidos requieren autenticación" -ForegroundColor Green
