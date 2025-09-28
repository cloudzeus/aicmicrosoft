import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  HelpCircle, 
  BookOpen, 
  MessageSquare, 
  Phone, 
  Mail,
  ChevronRight,
  ExternalLink
} from "lucide-react"

const faqItems = [
  {
    question: "How do I access my email?",
    answer: "Navigate to the Email section in the sidebar to access your Microsoft 365 inbox. You can view, compose, and manage your emails directly from the application.",
    category: "Email"
  },
  {
    question: "Can I schedule meetings with colleagues?",
    answer: "Yes! Use the Calendar section to view your schedule and the Group Calendar to see colleague availability. You can schedule new meetings and manage existing ones.",
    category: "Calendar"
  },
  {
    question: "How do I share files on SharePoint?",
    answer: "Go to the SharePoint section to browse and manage your files. You can upload new files, share existing ones, and organize them in folders.",
    category: "SharePoint"
  },
  {
    question: "What user roles are available?",
    answer: "The system supports three main roles: User (basic access), Manager (enhanced permissions), and Admin (full system access). Contact your administrator to change roles.",
    category: "Users"
  }
]

const supportOptions = [
  {
    title: "Documentation",
    description: "Comprehensive guides and tutorials",
    icon: BookOpen,
    action: "Browse Docs",
    href: "#"
  },
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: MessageSquare,
    action: "Start Chat",
    href: "#"
  },
  {
    title: "Phone Support",
    description: "Call us for urgent issues",
    icon: Phone,
    action: "Call Now",
    href: "tel:+1-800-123-4567"
  },
  {
    title: "Email Support",
    description: "Send us a detailed message",
    icon: Mail,
    action: "Send Email",
    href: "mailto:support@company.com"
  }
]

export default async function HelpPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="Help & Support" 
      pageDescription="Get help with your Microsoft 365 integration and find answers to common questions"
    >
      <div className="space-y-6">
        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Search Help
            </CardTitle>
            <CardDescription>
              Find answers to your questions quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input placeholder="Search for help topics..." className="flex-1" />
              <Button>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Options */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {supportOptions.map((option, index) => (
            <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <option.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {option.description}
                </CardDescription>
                <Button variant="outline" size="sm" className="w-full">
                  {option.action}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Common questions and answers about using the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{item.question}</h3>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.answer}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Get in touch with our support team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Business Hours</h4>
                <p className="text-sm text-gray-600">
                  Monday - Friday: 8:00 AM - 6:00 PM EST<br />
                  Saturday: 9:00 AM - 2:00 PM EST<br />
                  Sunday: Closed
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Emergency Support</h4>
                <p className="text-sm text-gray-600">
                  For critical issues outside business hours,<br />
                  please call our emergency line:<br />
                  <strong>+1-800-911-SUPPORT</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
