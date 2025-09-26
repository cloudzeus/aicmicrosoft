# 🔐 Azure AD Permissions Setup Guide

## Overview
This guide will help you configure all necessary Microsoft Graph API permissions for your AIC CRM application to access Calendar, Email, OneDrive, Excel, and Word services.

## 📋 Required Permissions

### User & Directory Permissions
- `User.Read` - Read user profile
- `User.ReadBasic.All` - Read basic profiles of all users
- `User.ReadWrite.All` - Read and write all user profiles
- `Directory.Read.All` - Read directory data
- `Directory.ReadWrite.All` - Read and write directory data
- `Group.Read.All` - Read all groups
- `Group.ReadWrite.All` - Read and write all groups
- `Member.Read.Hidden` - Read hidden group members

### Calendar Permissions
- `Calendars.Read` - Read user calendars
- `Calendars.ReadWrite` - Read and write user calendars
- `Calendars.ReadWrite.Shared` - Read and write shared calendars
- `Calendars.Read.All` - Read all user calendars (NEW)
- `Calendars.ReadWrite.All` - Read and write all user calendars (NEW)

### Email Permissions  
- `Mail.Read` - Read user mail
- `Mail.ReadWrite` - Read and write user mail
- `Mail.Send` - Send mail as user
- `Mail.ReadWrite.Shared` - Read and write shared mailboxes
- `MailboxSettings.Read` - Read mailbox settings
- `MailboxSettings.ReadWrite` - Read and write mailbox settings

### SharePoint & Sites Permissions
- `Sites.Read.All` - Read all SharePoint sites
- `Sites.ReadWrite.All` - Read and write all SharePoint sites
- `Sites.Manage.All` - Manage all SharePoint sites
- `Sites.FullControl.All` - Full control of all SharePoint sites

### Files & OneDrive Permissions
- `Files.Read` - Read user files
- `Files.ReadWrite` - Read and write user files
- `Files.ReadWrite.All` - Read and write all files (Excel, Word, etc.)

### Teams Permissions
- `Team.ReadBasic.All` - Read basic team information
- `TeamMember.Read.All` - Read team members
- `TeamMember.ReadWrite.All` - Read and write team members
- `TeamSettings.Read.All` - Read team settings
- `TeamSettings.ReadWrite.All` - Read and write team settings
- `Channel.ReadBasic.All` - Read basic channel information
- `ChannelMember.Read.All` - Read channel members
- `ChannelMember.ReadWrite.All` - Read and write channel members
- `ChannelSettings.Read.All` - Read channel settings
- `ChannelSettings.ReadWrite.All` - Read and write channel settings
- `ChannelMessage.Read.All` - Read all channel messages
- `ChannelMessage.Send` - Send channel messages

## 🛠️ Step-by-Step Setup

### Step 1: Access Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your administrator account
3. Navigate to **Azure Active Directory**
4. Click **App registrations** in the left menu
5. Find your application: **AIC-CRM** (ID: `c03bef53-43af-4d5e-be22-da859317086c`)

### Step 2: Add API Permissions
1. Click on your **AIC-CRM** application
2. In the left menu, click **API permissions**
3. Click **Add a permission**
4. Select **Microsoft Graph**
5. Choose **Delegated permissions**

### Step 3: Add Each Permission
Add these permissions one by one by searching for each:

#### User & Directory Permissions:
- Search for `User.Read` → Select → Add permissions
- Search for `User.ReadBasic.All` → Select → Add permissions
- Search for `User.ReadWrite.All` → Select → Add permissions
- Search for `Directory.Read.All` → Select → Add permissions
- Search for `Directory.ReadWrite.All` → Select → Add permissions
- Search for `Group.Read.All` → Select → Add permissions
- Search for `Group.ReadWrite.All` → Select → Add permissions
- Search for `Member.Read.Hidden` → Select → Add permissions

#### Calendar Permissions:
- Search for `Calendars.Read` → Select → Add permissions
- Search for `Calendars.ReadWrite` → Select → Add permissions
- Search for `Calendars.ReadWrite.Shared` → Select → Add permissions
- Search for `Calendars.Read.All` → Select → Add permissions (NEW)
- Search for `Calendars.ReadWrite.All` → Select → Add permissions (NEW)

#### Email Permissions:
- Search for `Mail.Read` → Select → Add permissions
- Search for `Mail.ReadWrite` → Select → Add permissions
- Search for `Mail.Send` → Select → Add permissions
- Search for `Mail.ReadWrite.Shared` → Select → Add permissions
- Search for `MailboxSettings.Read` → Select → Add permissions
- Search for `MailboxSettings.ReadWrite` → Select → Add permissions

#### SharePoint & Sites Permissions:
- Search for `Sites.Read.All` → Select → Add permissions
- Search for `Sites.ReadWrite.All` → Select → Add permissions
- Search for `Sites.Manage.All` → Select → Add permissions
- Search for `Sites.FullControl.All` → Select → Add permissions

#### Files & OneDrive Permissions:
- Search for `Files.Read` → Select → Add permissions
- Search for `Files.ReadWrite` → Select → Add permissions
- Search for `Files.ReadWrite.All` → Select → Add permissions

#### Teams Permissions:
- Search for `Team.ReadBasic.All` → Select → Add permissions
- Search for `TeamMember.Read.All` → Select → Add permissions
- Search for `TeamMember.ReadWrite.All` → Select → Add permissions
- Search for `TeamSettings.Read.All` → Select → Add permissions
- Search for `TeamSettings.ReadWrite.All` → Select → Add permissions
- Search for `Channel.ReadBasic.All` → Select → Add permissions
- Search for `ChannelMember.Read.All` → Select → Add permissions
- Search for `ChannelMember.ReadWrite.All` → Select → Add permissions
- Search for `ChannelSettings.Read.All` → Select → Add permissions
- Search for `ChannelSettings.ReadWrite.All` → Select → Add permissions
- Search for `ChannelMessage.Read.All` → Select → Add permissions
- Search for `ChannelMessage.Send` → Select → Add permissions

### Step 4: Grant Admin Consent
1. After adding all permissions, you should see them listed
2. Click **Grant admin consent for [Your Organization]**
3. Click **Yes** to confirm
4. All permissions should show **✓ Granted for [Your Organization]**

### Step 5: Verify Permissions
Your API permissions page should show:
```
Microsoft Graph (40+ permissions)
✓ User.Read - Granted for [Your Organization]
✓ User.ReadBasic.All - Granted for [Your Organization]
✓ User.ReadWrite.All - Granted for [Your Organization]
✓ Directory.Read.All - Granted for [Your Organization]
✓ Directory.ReadWrite.All - Granted for [Your Organization]
✓ Group.Read.All - Granted for [Your Organization]
✓ Group.ReadWrite.All - Granted for [Your Organization]
✓ Member.Read.Hidden - Granted for [Your Organization]
✓ Calendars.Read - Granted for [Your Organization]
✓ Calendars.ReadWrite - Granted for [Your Organization]
✓ Calendars.ReadWrite.Shared - Granted for [Your Organization]
✓ Calendars.Read.All - Granted for [Your Organization]
✓ Calendars.ReadWrite.All - Granted for [Your Organization]
✓ Mail.Read - Granted for [Your Organization]
✓ Mail.ReadWrite - Granted for [Your Organization]
✓ Mail.Send - Granted for [Your Organization]
✓ Mail.ReadWrite.Shared - Granted for [Your Organization]
✓ MailboxSettings.Read - Granted for [Your Organization]
✓ MailboxSettings.ReadWrite - Granted for [Your Organization]
✓ Sites.Read.All - Granted for [Your Organization]
✓ Sites.ReadWrite.All - Granted for [Your Organization]
✓ Sites.Manage.All - Granted for [Your Organization]
✓ Sites.FullControl.All - Granted for [Your Organization]
✓ Files.Read - Granted for [Your Organization]
✓ Files.ReadWrite - Granted for [Your Organization]
✓ Files.ReadWrite.All - Granted for [Your Organization]
✓ Team.ReadBasic.All - Granted for [Your Organization]
✓ TeamMember.Read.All - Granted for [Your Organization]
✓ TeamMember.ReadWrite.All - Granted for [Your Organization]
✓ TeamSettings.Read.All - Granted for [Your Organization]
✓ TeamSettings.ReadWrite.All - Granted for [Your Organization]
✓ Channel.ReadBasic.All - Granted for [Your Organization]
✓ ChannelMember.Read.All - Granted for [Your Organization]
✓ ChannelMember.ReadWrite.All - Granted for [Your Organization]
✓ ChannelSettings.Read.All - Granted for [Your Organization]
✓ ChannelSettings.ReadWrite.All - Granted for [Your Organization]
✓ ChannelMessage.Read.All - Granted for [Your Organization]
✓ ChannelMessage.Send - Granted for [Your Organization]
```

## 🔄 After Setup

### 1. Update Your Application
The Auth.js configuration has been updated with all the new scopes. You'll need to:

1. **Sign out** from your application
2. **Sign in again** to get the new permissions
3. **Accept the new consent screen** when prompted

### 2. Test the Permissions
After re-authentication, you can test:

- **Calendar**: Click "VIEW CALENDAR" button
- **Email**: Will be available for future email features
- **OneDrive**: Will be available for file operations
- **Excel/Word**: Will be available for document operations

## 🚨 Important Notes

### Admin Consent Required
- All these permissions require **admin consent**
- Users will see a consent screen on first login
- Admin must grant consent for the entire organization

### Security Considerations
- `Files.ReadWrite.All` is a powerful permission - use carefully
- `Mail.Send` allows sending emails on behalf of users
- Consider using more restrictive permissions if possible

### Token Refresh
- After permission changes, users need to re-authenticate
- The application will automatically handle token refresh

## 🐛 Troubleshooting

### Permission Denied Errors
- Ensure admin consent is granted
- Check that all permissions are added correctly
- Verify the user has appropriate licenses

### Consent Screen Issues
- Users may need to sign out and sign in again
- Clear browser cache if consent screen doesn't appear
- Check that the redirect URI is correct

### API Call Failures
- Verify the access token includes the required scopes
- Check Microsoft Graph API documentation for endpoint requirements
- Ensure the user account has the necessary Office 365 licenses

## 📚 Additional Resources

- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)
- [Azure AD App Registration Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Microsoft Graph API Documentation](https://docs.microsoft.com/en-us/graph/)

## ✅ Verification Checklist

- [ ] All 11 permissions added to Azure AD app
- [ ] Admin consent granted for all permissions
- [ ] Auth.js configuration updated with new scopes
- [ ] User re-authenticated after permission changes
- [ ] Calendar functionality tested
- [ ] Ready for email, OneDrive, and Office integration

---

**Application ID**: `c03bef53-43af-4d5e-be22-da859317086c`  
**Tenant ID**: `a6b29ab6-6197-4ead-a41b-34c37add4307`


