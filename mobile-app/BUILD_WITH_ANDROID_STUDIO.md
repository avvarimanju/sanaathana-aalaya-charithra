# Build APK/AAB Using Android Studio

## Prerequisites
- ✅ Android Studio installed at: `C:\Program Files\Android\Android Studio`
- ✅ Java JDK installed (you already have JDK 25.0.2)
- ✅ Signing key created (sanaathana-release-key.keystore)

## Step 1: Generate Native Android Project

Run this from the mobile-app directory:

```powershell
cd C:\Users\avvar\OneDrive\LEARNING\MANJU_PROJECTS\Sanaathana-Aalaya-Charithra\mobile-app

# Generate native Android project
npx expo prebuild --platform android
```

This creates an `android/` folder with the native Android project.

## Step 2: Configure Signing in Android Studio

### 2a. Create keystore.properties file

Create `mobile-app/android/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=sanaathana-key
storeFile=../sanaathana-release-key.keystore
```

Replace `YOUR_KEYSTORE_PASSWORD` and `YOUR_KEY_PASSWORD` with your actual passwords.

### 2b. Update build.gradle

The file `mobile-app/android/app/build.gradle` needs signing configuration.

Add this BEFORE the `android {` block:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add this INSIDE the `android {` block, after `buildTypes`:

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

## Step 3: Build Using Command Line (Faster)

### Build AAB (for Play Store):

```powershell
cd android
.\gradlew bundleRelease
```

The AAB file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Build APK (for direct installation):

```powershell
cd android
.\gradlew assembleRelease
```

The APK file will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

## Step 4: Build Using Android Studio (GUI)

### 4a. Open Project in Android Studio

1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to: `C:\Users\avvar\OneDrive\LEARNING\MANJU_PROJECTS\Sanaathana-Aalaya-Charithra\mobile-app\android`
4. Click "OK"

### 4b. Wait for Gradle Sync

Android Studio will automatically sync Gradle dependencies. This may take 5-10 minutes the first time.

### 4c. Build AAB

1. In Android Studio menu: **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Next**
4. Key store path: Browse to `sanaathana-release-key.keystore`
5. Key store password: [YOUR_PASSWORD]
6. Key alias: `sanaathana-key`
7. Key password: [YOUR_PASSWORD]
8. Click **Next**
9. Select **release** build variant
10. Check **V2 (Full APK Signature)**
11. Click **Finish**

The AAB will be generated at:
```
android/app/release/app-release.aab
```

### 4d. Build APK (Alternative)

Follow same steps but select **APK** instead of **Android App Bundle** in step 2.

## Troubleshooting

### Issue: Gradle sync fails

**Solution:**
```powershell
cd android
.\gradlew clean
.\gradlew --refresh-dependencies
```

### Issue: "SDK location not found"

**Solution:**
Create `android/local.properties`:
```properties
sdk.dir=C\:\\Users\\avvar\\AppData\\Local\\Android\\Sdk
```

### Issue: Build fails with "JAVA_HOME not set"

**Solution:**
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.2"
```

### Issue: Out of memory during build

**Solution:**
Edit `android/gradle.properties`, add:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
```

## Comparison: Android Studio vs EAS Build

| Feature | Android Studio | EAS Build |
|---------|---------------|-----------|
| Build time | 10-20 min | 30-60 min (with queue) |
| Internet required | No | Yes |
| Disk space | ~5 GB | Minimal |
| Setup complexity | Medium | Easy |
| Cost | Free | Free (100 builds/month) |
| Control | Full | Limited |

## Recommended Approach

**For quick builds**: Use Android Studio command line (`gradlew bundleRelease`)

**For CI/CD**: Use EAS Build (automated, no local setup needed)

**For debugging**: Use Android Studio GUI (better error messages)

## Quick Commands Reference

```powershell
# Generate native project
npx expo prebuild --platform android

# Build AAB
cd android
.\gradlew bundleRelease

# Build APK
cd android
.\gradlew assembleRelease

# Clean build
cd android
.\gradlew clean

# View all tasks
cd android
.\gradlew tasks
```

## Next Steps After Building

1. Locate your AAB file: `android/app/build/outputs/bundle/release/app-release.aab`
2. Upload to Google Play Console (Internal Testing)
3. Test with testers
4. Iterate and rebuild as needed

---

**Note**: After running `expo prebuild`, your project structure changes. If you make changes to `app.json` or install new packages, you may need to run `expo prebuild` again or manually update the Android project.
