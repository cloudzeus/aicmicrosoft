# 🚀 Azure AD Quick Reference

## 🔗 Direct Links

### Your Application
- **Azure Portal**: https://portal.azure.com
- **Your App**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/c03bef53-43af-4d5e-be22-da859317086c
- **API Permissions**: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallApiOverView/appId/c03bef53-43af-4d5e-be22-da859317086c

## 📋 Permission Names to Search

Copy and paste these exact names in the Azure permission search:

```
User.Read
User.ReadBasic.All
User.ReadWrite.All
Directory.Read.All
Directory.ReadWrite.All
Group.Read.All
Group.ReadWrite.All
Member.Read.Hidden
Calendars.Read
Calendars.ReadWrite
Calendars.ReadWrite.Shared
Mail.Read
Mail.ReadWrite
Mail.Send
Mail.ReadWrite.Shared
MailboxSettings.Read
MailboxSettings.ReadWrite
Sites.Read.All
Sites.ReadWrite.All
Sites.Manage.All
Sites.FullControl.All
Files.Read
Files.ReadWrite
Files.ReadWrite.All
Team.ReadBasic.All
TeamMember.Read.All
TeamMember.ReadWrite.All
TeamSettings.Read.All
TeamSettings.ReadWrite.All
Channel.ReadBasic.All
ChannelMember.Read.All
ChannelMember.ReadWrite.All
ChannelSettings.Read.All
ChannelSettings.ReadWrite.All
ChannelMessage.Read.All
ChannelMessage.Send
```

## 🎯 Quick Setup Steps

1. **Click**: API permissions
2. **Click**: Add a permission
3. **Select**: Microsoft Graph
4. **Select**: Delegated permissions
5. **Search**: Each permission name above
6. **Add**: Each permission
7. **Click**: Grant admin consent

## ✅ Final Result

After setup, you should see:
- 40+ Microsoft Graph permissions
- All marked as "✓ Granted for [Your Organization]"
- Ready for comprehensive enterprise integration:
  - ✅ All mailboxes (including shared mailboxes)
  - ✅ All calendars (including shared calendars)
  - ✅ All SharePoint sites and files
  - ✅ Teams integration
  - ✅ Directory and user management
  - ✅ Full Office 365 ecosystem access

## 🔄 Next Steps

1. **Sign out** from your app
2. **Sign in again** to get new permissions
3. **Accept consent screen**
4. **Test calendar functionality**
5. **Ready for full Office 365 integration**


