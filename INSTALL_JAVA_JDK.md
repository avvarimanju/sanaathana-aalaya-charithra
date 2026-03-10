# Install Java JDK - Quick Guide

**Why**: You need Java JDK to generate Android keystores  
**Time**: 5-10 minutes

---

## Option 1: Install via Winget (Fastest!)

Open PowerShell and run:

```powershell
winget install Microsoft.OpenJDK.17
```

After installation, close and reopen PowerShell, then verify:

```powershell
java -version
keytool
```

---

## Option 2: Download from Microsoft

1. Go to: https://learn.microsoft.com/en-us/java/openjdk/download
2. Download: **Microsoft Build of OpenJDK 17** (Windows x64 MSI)
3. Run the installer
4. Follow the installation wizard (use default settings)
5. Close and reopen PowerShell
6. Verify installation:

```powershell
java -version
keytool
```

---

## Option 3: Download from Oracle

1. Go to: https://www.oracle.com/java/technologies/downloads/#java17
2. Download: **Windows x64 Installer**
3. Run the installer
4. Follow the installation wizard
5. Close and reopen PowerShell
6. Verify installation:

```powershell
java -version
keytool
```

---

## After Installation

Once Java is installed, run the keystore generator again:

```powershell
cd C:\Users\avvar\OneDrive\LEARNING\MANJU_PROJECTS\Sanaathana-Aalaya-Charithra
.\scripts\generate-android-keystore.ps1
```

---

## Troubleshooting

### "java is not recognized"

If you get this error after installing:

1. Close PowerShell completely
2. Open a NEW PowerShell window
3. Try again

If still not working:

1. Search for "Environment Variables" in Windows
2. Click "Environment Variables" button
3. Under "System variables", find "Path"
4. Click "Edit"
5. Add Java bin directory (usually: `C:\Program Files\Microsoft\jdk-17.0.x\bin`)
6. Click OK
7. Close and reopen PowerShell

---

## Quick Install Command

**Recommended**: Use Microsoft's OpenJDK via winget:

```powershell
winget install Microsoft.OpenJDK.17
```

Then close and reopen PowerShell!

---

**Next**: After Java is installed, run the keystore generator script again.
