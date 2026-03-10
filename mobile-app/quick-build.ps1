# Quick AAB Build Script
# Use this if keystore.properties is already configured

# Set JAVA_HOME to Android Studio's JDK
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Building AAB..." -ForegroundColor Cyan
Write-Host "Java version:" -ForegroundColor Yellow
java -version

cd android
.\gradlew bundleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "AAB location: android\app\build\outputs\bundle\release\app-release.aab" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Build failed" -ForegroundColor Red
}

cd ..
