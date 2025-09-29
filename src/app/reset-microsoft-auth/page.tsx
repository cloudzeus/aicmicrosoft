import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function ResetMicrosoftAuthPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Reset Microsoft Authentication
          </CardTitle>
          <CardDescription>
            Complete reset of your Microsoft authentication to fix token issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>This will completely reset your Microsoft authentication.</strong> 
              You&apos;ll need to sign in with Microsoft again, but this should fix the refresh token issue.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What this will do:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Remove your current Microsoft account from the database
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                Clear all stored tokens (access and refresh)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                Force you to re-authenticate with Microsoft
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                Create fresh tokens with the updated configuration
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Steps after reset:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Sign in with Microsoft</p>
                  <p className="text-sm text-gray-600">Use the updated authentication configuration</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Verify tokens</p>
                  <p className="text-sm text-gray-600">Check that refresh token is now available</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Test features</p>
                  <p className="text-sm text-gray-600">Try emails, department resources, etc.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild className="flex-1 bg-red-600 hover:bg-red-700">
              <a href="/api/reset-microsoft-auth">
                <Trash2 className="h-4 w-4 mr-2" />
                Reset Microsoft Auth
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/test-microsoft-auth">
                Check Current Status
              </a>
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Note:</strong> This is a complete reset. Your user account and role will be preserved, 
            but all Microsoft authentication data will be cleared and you&apos;ll need to re-authenticate.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
