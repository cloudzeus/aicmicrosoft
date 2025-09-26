"use client"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FaMicrosoft } from "react-icons/fa"

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, { id: string; name: string; type: string }> | null>(null)

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    fetchProviders()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <FaMicrosoft className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            WELCOME TO AIC CRM
          </CardTitle>
          <CardDescription className="text-gray-600">
            SIGN IN WITH YOUR MICROSOFT 365 ACCOUNT TO CONTINUE
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Debug info - remove this in production */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded">
                Providers: {providers ? JSON.stringify(Object.keys(providers)) : 'Loading...'}
              </div>
            )}
            
            <Button
              onClick={() => signIn("c03bef53-43af-4d5e-be22-da859317086c", { 
                callbackUrl: "/dashboard",
                prompt: "consent" // Force consent screen to get new scopes
              })}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              size="lg"
            >
              <FaMicrosoft className="w-5 h-5 mr-2" />
              SIGN IN WITH MICROSOFT 365
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              SECURE AUTHENTICATION POWERED BY MICROSOFT ENTRA ID
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
