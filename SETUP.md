# AIC CRM - Microsoft 365 RBAC Setup

This project implements a Role-Based Access Control (RBAC) system for Microsoft 365 users using Next.js 15.5, Auth.js 5, and Prisma with MySQL.

## Features

- ✅ Microsoft 365 authentication via Auth.js 5
- ✅ Role-based access control (ADMIN, MANAGER, USER)
- ✅ MySQL database with Prisma ORM
- ✅ Modern UI with shadcn/ui components
- ✅ Protected routes with middleware
- ✅ User profile display with Office 365 details

## Prerequisites

1. **Microsoft Entra ID (Azure AD) App Registration**
   - Create an app registration in Azure Portal
   - Note down the Tenant ID, Application ID, and Client Secret
   - Configure redirect URIs: `http://localhost:3000/api/auth/callback/microsoft-entra-id`

2. **MySQL Database**
   - Set up a MySQL database
   - Note the connection string

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Tenant (Directory) ID — NOT the Object ID
TENANT_ID=your-tenant-id-here

# Application (client) ID
AUTH_MICROSOFT_ENTRA_ID_ID=your-client-id-here

# Client secret VALUE
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-client-secret-here

# NextAuth basics
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Useful when behind a proxy / Coolify / Nginx
AUTH_TRUST_HOST=true

# Database
DATABASE_URL="mysql://username:password@localhost:3306/aic_crm"

# Auth.js Configuration
AUTH_SECRET=your-auth-secret-here
AUTH_URL=http://localhost:3000
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Push Database Schema**
   ```bash
   npx prisma db push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # Auth.js API routes
│   ├── auth/
│   │   ├── signin/page.tsx              # Sign-in page
│   │   └── error/page.tsx               # Auth error page
│   ├── dashboard/page.tsx               # Protected dashboard
│   └── layout.tsx                       # Root layout with SessionProvider
├── components/
│   ├── auth/
│   │   ├── session-provider.tsx         # Auth.js session provider
│   │   └── sign-out-button.tsx          # Sign-out component
│   └── ui/                              # shadcn/ui components
├── lib/
│   └── auth.ts                          # Auth.js configuration
├── types/
│   └── auth.ts                          # Auth.js type definitions
└── middleware.ts                        # Route protection middleware
```

## Authentication Flow

1. User visits the application
2. Redirected to `/auth/signin` if not authenticated
3. Click "Sign in with Microsoft 365" button
4. Redirected to Microsoft Entra ID for authentication
5. After successful authentication, redirected to `/dashboard`
6. Dashboard displays user profile and Office 365 details

## RBAC Implementation

The system includes three user roles:
- **ADMIN**: Full access to all features
- **MANAGER**: Limited administrative access
- **USER**: Basic user access

Roles are stored in the database and can be managed through the User model.

## Database Schema

The Prisma schema includes:
- `User`: User profile with role information
- `Account`: OAuth account details
- `Session`: Active user sessions
- `VerificationToken`: Email verification tokens

## Security Features

- Route protection via middleware
- Session-based authentication
- Secure token handling
- CSRF protection via Auth.js
- Environment variable protection

## Troubleshooting

1. **Authentication Issues**
   - Verify environment variables are correct
   - Check Microsoft Entra ID app registration settings
   - Ensure redirect URIs match exactly

2. **Database Issues**
   - Verify MySQL connection string
   - Run `npx prisma db push` to apply schema changes
   - Check database permissions

3. **Build Issues**
   - Run `npx prisma generate` after schema changes
   - Clear `.next` folder and rebuild

## Production Deployment

1. Set up production MySQL database
2. Update environment variables for production
3. Push database schema to production with `npx prisma db push`
4. Configure proper CORS and security headers
5. Use HTTPS in production

## Support

For issues or questions, please check the documentation:
- [Auth.js Documentation](https://authjs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
