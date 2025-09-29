import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default async function FixMicrosoftAuthPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Microsoft Authentication Issue
          </CardTitle>
          <CardDescription>
            Your Microsoft tokens need to be refreshed to access Microsoft 365 features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Issue:</strong> Your Microsoft refresh token is missing or expired. This affects:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Email loading from Microsoft Graph</li>
                <li>SharePoint sites access</li>
                <li>Microsoft 365 Groups</li>
                <li>Shared mailboxes</li>
                <li>Microsoft To Do integration</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Solution:</h3>
            <p className="text-sm text-gray-600">
              You need to re-authenticate with Microsoft to get fresh tokens. This is a one-time fix.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Sign out completely</p>
                  <p className="text-sm text-gray-600">Click the sign out button in your application</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Sign back in with Microsoft</p>
                  <p className="text-sm text-gray-600">Go to the sign-in page and authenticate with Microsoft</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Test the features</p>
                  <p className="text-sm text-gray-600">Try accessing emails, department resources, and Microsoft To Do</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button asChild className="flex-1">
              <a href="/auth/signin">
                <RefreshCw className="h-4 w-4 mr-2" />
                Go to Sign In
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">
                Back to Dashboard
              </a>
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Technical Details:</strong> This happens when Microsoft refresh tokens expire (typically after 90 days) 
            or when the initial authentication didn&apos;t properly store the refresh token. Re-authentication creates fresh tokens.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
