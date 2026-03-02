# Step 1: Generate App Signing Key

**Time**: 15 minutes  
**Difficulty**: Easy  
**Prerequisites**: Java JDK installed (comes with Android Studio)

---

## What is an App Signing Key?

An app signing key is like a digital signature that proves you're the legitimate developer of your app. Google Play requires all apps to be signed with a unique key.

**Important**: You'll need this key for ALL future updates. If you lose it, you can never update your app!

---

## Quick Start

### Option 1: Using PowerShell Script (Easiest)

I've created a script that will guide you through the process:

```powershell
cd mobile-app
./generate-signing-key.ps1
```

### Option 2: Manual Command (If script doesn't work)

```powershell
cd mobile-app

keytool -genkeypair -v -storetype PKCS12 `
  -keystore sanaathana-release-key.keystore `
  -alias sanaathana-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000
```

---

## Step-by-Step Instructions

### 1. Open PowerShell

- Press `Win + X`
- Select "Windows PowerShell" or "Terminal"

### 2. Navigate to mobile-app directory

```powershell
cd C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\mobile-app
```

### 3. Check if keytool is available

```powershell
keytool -help
```

**If you see "command not found":**
- You need to install Java JDK
- Download from: https://www.oracle.com/java/technologies/downloads/
- Or install via: `choco install openjdk`

### 4. Run the keytool command

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore sanaathana-release-key.keystore -alias sanaathana-key -keyalg RSA -keysize 2048 -validity 10000
```

### 5. Answer the prompts

You'll be asked several questions. Here's what to enter:

**Keystore password:**
```
Enter a strong password (minimum 6 characters)
Example: SanaathanaSecure2026!
WRITE THIS DOWN IMMEDIATELY!
```

**Re-enter password:**
```
Enter the same password again
```

**What is your first and last name?**
```
Your Name
Example: Avvaru Venkata
```

**What is the name of your organizational unit?**
```
Your team or department
Example: Development Team
```

**What is the name of your organization?**
```
Sanaathana Aalaya Charithra
```

**What is the name of your City or Locality?**
```
Your city
Example: Hyderabad
```

**What is the name of your State or Province?**
```
Your state
Example: Telangana
```

**What is the two-letter country code for this unit?**
```
IN
```

**Is CN=..., OU=..., O=..., L=..., ST=..., C=IN correct?**
```
yes
```

**Key password (RETURN if same as keystore password):**
```
Just press ENTER (uses same password as keystore)
```

### 6. Verify the key was created

```powershell
dir sanaathana-release-key.keystore
```

You should see the file listed.

---

## Save Your Credentials IMMEDIATELY!

**CRITICAL**: Create a file to store your credentials securely.

Create `mobile-app/KEYSTORE_CREDENTIALS.txt`:

```
===========================================
SANAATHANA AALAYA CHARITHRA
APP SIGNING KEY CREDENTIALS
===========================================

⚠️ KEEP THIS FILE SECURE AND PRIVATE! ⚠️
⚠️ DO NOT COMMIT TO GIT! ⚠️
⚠️ BACKUP TO MULTIPLE LOCATIONS! ⚠️

Keystore File: sanaathana-release-key.keystore
Keystore Password: [YOUR_PASSWORD_HERE]
Key Alias: sanaathana-key
Key Password: [SAME_AS_KEYSTORE_PASSWORD]

Created Date: March 1, 2026
Created By: [Your Name]

Organization Details:
- Name: Sanaathana Aalaya Charithra
- City: [Your City]
- State: [Your State]
- Country: IN

===========================================
BACKUP LOCATIONS:
===========================================
1. [ ] USB Drive
2. [ ] Cloud Storage (encrypted)
3. [ ] Password Manager
4. [ ] Physical Paper (in safe)

===========================================
IMPORTANT NOTES:
===========================================
- This key is required for ALL future app updates
- If you lose this key, you CANNOT update your app
- You'll have to create a new app with a new package name
- All existing users will have to uninstall and reinstall
- Keep multiple backups in secure locations
```

---

## Add to .gitignore

**IMPORTANT**: Make sure the keystore file is NOT committed to Git!

Check if `mobile-app/.gitignore` contains:

```
# Keystores
*.keystore
*.jks
KEYSTORE_CREDENTIALS.txt
```

If not, add these lines.

---

## Backup Your Key

**Do this NOW before continuing:**

1. **Copy to USB Drive**
   ```powershell
   Copy-Item sanaathana-release-key.keystore E:\Backups\
   Copy-Item KEYSTORE_CREDENTIALS.txt E:\Backups\
   ```

2. **Upload to Cloud (Encrypted)**
   - Use Google Drive, OneDrive, or Dropbox
   - Put in a password-protected ZIP file first
   - Upload the ZIP file

3. **Save to Password Manager**
   - Use LastPass, 1Password, or Bitwarden
   - Store the password and file location

4. **Print on Paper**
   - Print the credentials
   - Store in a safe or locked drawer

---

## Verify the Key

Test that your key works:

```powershell
keytool -list -v -keystore sanaathana-release-key.keystore -alias sanaathana-key
```

Enter your keystore password when prompted.

You should see details about your key including:
- Alias name: sanaathana-key
- Creation date
- Entry type: PrivateKeyEntry
- Certificate fingerprints

---

## Troubleshooting

### Error: "keytool: command not found"

**Solution**: Install Java JDK

**Option 1: Using Chocolatey**
```powershell
choco install openjdk
```

**Option 2: Manual Download**
1. Go to: https://www.oracle.com/java/technologies/downloads/
2. Download JDK for Windows
3. Install
4. Restart PowerShell

### Error: "Keystore file already exists"

**Solution**: You already have a keystore file

```powershell
# List existing keystores
dir *.keystore

# If you want to create a new one, delete the old one first
# WARNING: Only do this if you haven't used it yet!
Remove-Item sanaathana-release-key.keystore
```

### Error: "Invalid keystore format"

**Solution**: Make sure you're using PKCS12 format

```powershell
# Use this exact command
keytool -genkeypair -v -storetype PKCS12 -keystore sanaathana-release-key.keystore -alias sanaathana-key -keyalg RSA -keysize 2048 -validity 10000
```

---

## What's Next?

After generating your signing key:

✅ **Step 1 Complete!**

**Next Steps:**
- [ ] Step 2: Configure EAS Build
- [ ] Step 3: Create Privacy Policy
- [ ] Step 4: Build Production APK/AAB
- [ ] Step 5: Upload to Play Store

---

## Quick Reference

**Keystore Location:**
```
mobile-app/sanaathana-release-key.keystore
```

**Key Details:**
- Alias: `sanaathana-key`
- Algorithm: RSA
- Key size: 2048 bits
- Validity: 10,000 days (~27 years)
- Format: PKCS12

**To view key info:**
```powershell
keytool -list -v -keystore sanaathana-release-key.keystore
```

**To export certificate (if needed):**
```powershell
keytool -export -alias sanaathana-key -keystore sanaathana-release-key.keystore -file sanaathana-cert.cer
```

---

## Security Checklist

Before moving to Step 2, verify:

- [ ] Keystore file created successfully
- [ ] Password saved in KEYSTORE_CREDENTIALS.txt
- [ ] KEYSTORE_CREDENTIALS.txt added to .gitignore
- [ ] Keystore file added to .gitignore
- [ ] Backed up to USB drive
- [ ] Backed up to cloud storage (encrypted)
- [ ] Saved to password manager
- [ ] Printed on paper (optional but recommended)

---

**Ready for Step 2?**

Once you've completed this step and backed up your key, you're ready to configure EAS Build!

Let me know when you're done, and we'll move to Step 2.

---

**Last Updated**: March 1, 2026  
**Status**: Step 1 of 10 - Generate Signing Key
