# 🛡️ AIC CRM STABILITY GUIDE

## 🚨 CRITICAL: STABLE CONFIGURATION

This guide ensures your AIC CRM application runs **STABLY** without breaking changes.

## 📁 STABLE FILES CREATED

### 1. **Stable Authentication** (`src/lib/auth-stable.ts`)
- ✅ **MINIMAL SCOPES**: Only tested, working permissions
- ✅ **JWT SESSION**: Reliable session management
- ✅ **ERROR HANDLING**: Comprehensive logging and error handling

### 2. **Stable Configuration** (`next.config.stable.ts`)
- ✅ **NO EXPERIMENTAL FEATURES**: Disabled unstable features
- ✅ **SIMPLE CONFIG**: Minimal, tested configuration
- ✅ **SECURITY HEADERS**: Basic security configurations

### 3. **Stable Scripts** (`package.json`)
- ✅ **DEFAULT DEV**: `npm run dev` (no turbopack by default)
- ✅ **TURBO OPTION**: `npm run dev:turbo` (if you want turbopack)
- ✅ **CLEAN COMMANDS**: `npm run clean` and `npm run reset`

### 4. **Stable Startup** (`start-stable.sh`)
- ✅ **AUTOMATED CLEANUP**: Kills existing processes
- ✅ **CACHE CLEARING**: Removes stale cache files
- ✅ **ENVIRONMENT CHECK**: Verifies .env.local exists

## 🚀 HOW TO START STABLY

### Option 1: Use the Stable Startup Script
```bash
./start-stable.sh
```

### Option 2: Manual Stable Start
```bash
# Clean up
pkill -f "next dev"
rm -rf .next
rm -rf node_modules/.cache

# Start stable
npm run dev
```

### Option 3: Reset Everything
```bash
npm run reset
```

## 🔧 CURRENT STABLE CONFIGURATION

### Authentication Scopes (WORKING)
```
openid profile email User.Read User.ReadBasic.All Calendars.Read Calendars.ReadWrite Mail.Read Mail.ReadWrite Mail.Send
```

### What's Disabled for Stability
- ❌ Complex experimental features
- ❌ Advanced calendar permissions (until verified)
- ❌ Turbopack by default (use `npm run dev:turbo` if needed)
- ❌ Unstable webpack configurations

## 📋 TROUBLESHOOTING

### If Authentication Fails
1. **Check .env.local** - Ensure all variables are set
2. **Verify Azure AD** - Check redirect URI matches exactly
3. **Clear Browser** - Clear cookies and cache
4. **Reset Session** - Sign out and sign in again

### If Development Server Fails
1. **Use Stable Script**: `./start-stable.sh`
2. **Clean Cache**: `npm run clean`
3. **Reset Everything**: `npm run reset`
4. **Check Ports**: Ensure port 3000 is free

### If Group Calendar Doesn't Work
- **Expected Behavior**: Group calendar shows helpful messages
- **Solution**: Ask colleagues to share calendars in Outlook
- **Future**: Will add proper permissions when verified

## 🎯 STABILITY PRINCIPLES

1. **MINIMAL CONFIG**: Only add what's absolutely necessary
2. **TESTED FEATURES**: Only use verified, working features
3. **GRACEFUL DEGRADATION**: Features fail gracefully with helpful messages
4. **CLEAR ERROR MESSAGES**: Always provide actionable error messages
5. **BACKUP CONFIGS**: Keep stable configurations as separate files

## 📞 SUPPORT

If you encounter issues:
1. **Check this guide first**
2. **Use stable startup script**
3. **Verify environment variables**
4. **Check browser console for errors**

## 🔄 UPDATING SAFELY

When updating:
1. **Backup current working configs**
2. **Test in development first**
3. **Update one component at a time**
4. **Keep stable versions as fallback**

---

**Remember**: Stability > Features. It's better to have a working basic system than a broken advanced system.


