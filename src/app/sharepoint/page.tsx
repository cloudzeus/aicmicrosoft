import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SharePointBrowser } from "@/components/sharepoint/sharepoint-browser"
import { Button } from "@/components/ui/button"
import { FaArrowLeft } from "react-icons/fa"

export default async function SharePointPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">SHAREPOINT</h1>
          <a href="/dashboard">
            <Button variant="outline">
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </a>
        </div>
        <SharePointBrowser />
      </div>
    </div>
  )
}
