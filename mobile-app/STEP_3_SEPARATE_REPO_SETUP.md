# Step 3: Privacy Policy - Separate Public Repo Setup

**Strategy**: Create a small public repo just for the privacy policy, keep main repo private.

---

## Why This Approach?

✅ Main code stays private  
✅ Privacy policy is publicly accessible for Play Store  
✅ Hackathon judges get direct access to main repo (as collaborators)  
✅ Clean separation - no sensitive code exposed  
✅ Professional setup

---

## Quick Setup (5 minutes)

### 1. Create New Public Repository on GitHub

1. Go to: https://github.com/new
2. Repository name: `sanaathana-privacy-policy`
3. Description: `Privacy Policy for Sanaathana Aalaya Charithra Mobile App`
4. **Visibility: PUBLIC** ✅
5. Initialize with README: ✅ (check this)
6. Click "Create repository"

### 2. Add Privacy Policy File

**Option A: Upload via GitHub Web Interface (Easiest)**

1. In your new repo, click "Add file" → "Upload files"
2. Drag and drop: `docs/privacy-policy.html` from your local machine
3. Commit message: "Add privacy policy for Play Store"
4. Click "Commit changes"

**Option B: Push via Git (Command Line)**

```powershell
# Navigate to a temp directory
cd ~
mkdir sanaathana-privacy-policy
cd sanaathana-privacy-policy

# Copy the privacy policy file
cp "C:\Users\avvar\OneDrive\LEARNING\Hack2Skill\Sanaathana-Aalaya-Charithra\docs\privacy-policy.html" index.html

# Initialize git
git init
git add index.html
git commit -m "Add privacy policy for Play Store"

# Connect to GitHub repo
git remote add origin https://github.com/avvarimanju/sanaathana-privacy-policy.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to repo Settings
2. Click "Pages" in left sidebar
3. Under "Source":
   - Branch: `main`
   - Folder: `/ (root)`
4. Click "Save"
5. Wait 2-3 minutes for deployment

### 4. Get Your Privacy Policy URL

Your privacy policy will be live at:

```
https://avvarimanju.github.io/sanaathana-privacy-policy/
```

Or if you named the file `index.html`:
```
https://avvarimanju.github.io/sanaathana-privacy-policy/
```

Or if you kept it as `privacy-policy.html`:
```
https://avvarimanju.github.io/sanaathana-privacy-policy/privacy-policy.html
```

---

## Share Main Repo with Hackathon Judges

### Add Judges as Collaborators

1. Go to main repo: https://github.com/avvarimanju/sanaathana-aalaya-charithra
2. Click "Settings" tab
3. Click "Collaborators" in left sidebar
4. Click "Add people"
5. Enter judge's GitHub username or email
6. Select "Read" access (they can view but not modify)
7. Click "Add [username] to this repository"
8. They'll receive an invitation email

**Repeat for each judge.**

---

## Verification Checklist

Before proceeding to Step 4:

- [ ] New public repo created: `sanaathana-privacy-policy`
- [ ] Privacy policy file uploaded
- [ ] GitHub Pages enabled
- [ ] Privacy policy URL is accessible
- [ ] URL tested in incognito/private browser
- [ ] URL saved for Play Store submission
- [ ] Main repo stays private
- [ ] Judges added as collaborators to main repo (if needed)

---

## Your URLs

**Privacy Policy (Public):**
```
https://avvarimanju.github.io/sanaathana-privacy-policy/
```

**Main Repo (Private, for judges):**
```
https://github.com/avvarimanju/sanaathana-aalaya-charithra
```

---

## Next Step

Once privacy policy is live:

**Proceed to Step 4: Build Production APK/AAB**

See: `PLAY_STORE_INTERNAL_TESTING_GUIDE.md` - Step 4

---

**Time to Complete**: 5 minutes  
**Status**: ✅ Best approach for keeping code private while hosting privacy policy publicly
