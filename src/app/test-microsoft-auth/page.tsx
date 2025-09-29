import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function TestMicrosoftAuthPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Get user's Microsoft account details
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { accounts: true }
  })

  const microsoftAccount = user?.accounts.find(account => 
    account.provider === "c03bef53-43af-4d5e-be22-da859317086c"
  )

  const hasRefreshToken = !!microsoftAccount?.refresh_token
  const hasAccessToken = !!microsoftAccount?.access_token
  const isTokenExpired = microsoftAccount?.expires_at ? 
    new Date(Number(microsoftAccount.expires_at)) < new Date() : 
    true

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Microsoft Authentication Test
          </CardTitle>
          <CardDescription>
            Check your Microsoft authentication status and tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Overview */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {hasRefreshToken ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="font-medium">Refresh Token</p>
                <p className="text-sm text-gray-600">
                  {hasRefreshToken ? "Available" : "Missing"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {hasAccessToken ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="font-medium">Access Token</p>
                <p className="text-sm text-gray-600">
                  {hasAccessToken ? "Available" : "Missing"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              {!isTokenExpired ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <p className="font-medium">Token Status</p>
                <p className="text-sm text-gray-600">
                  {!isTokenExpired ? "Valid" : "Expired"}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Details</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600">User Email</label>
                <p className="text-sm">{session.user.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">User Role</label>
                <Badge className="ml-2">{user?.role || 'Unknown'}</Badge>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Microsoft Account ID</label>
                <p className="text-sm font-mono text-xs">
                  {microsoftAccount?.providerAccountId || 'Not found'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Token Type</label>
                <p className="text-sm">{microsoftAccount?.token_type || 'Not available'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Scope</label>
                <p className="text-sm text-xs break-all">
                  {microsoftAccount?.scope || 'Not available'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Token Expires</label>
                <p className="text-sm">
                  {microsoftAccount?.expires_at ? 
                    new Date(Number(microsoftAccount.expires_at)).toLocaleString() : 
                    'Not available'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Actions</h3>
            
            {!hasRefreshToken ? (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No refresh token found!</strong> You need to re-authenticate with Microsoft to get a refresh token.
                  The authentication configuration has been updated to include the `offline_access` scope.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Refresh token found!</strong> Your Microsoft authentication is properly configured.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-3">
              <Button asChild>
                <a href="/auth/signin">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Re-authenticate with Microsoft
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">
                  Back to Dashboard
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
