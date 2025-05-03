import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default function LandingPage() {
  const { userId } = auth()

  // If user is already logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-2xl">Notefy</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Sign Up</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <div className="container px-4 md:px-6 h-[calc(100vh-4rem)]">
          <div className="grid gap-4 lg:grid-cols-2 lg:gap-8 h-full">
            {/* Left Side - Logo */}
            <div className="flex items-center justify-center h-full">
              <img
                alt="Notefy App Screenshot"
                className="w-full h-full object-contain"
                src="/landing_page_logo.jpg"
              />
            </div>

            {/* Right Side - Content */}
            <div className="flex flex-col justify-center space-y-6 h-full">
              

              {/* Features Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">Features</h2>
                  <p className="text-gray-500">
                    Everything you need to capture, analyze, and understand your handwritten notes.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-blue-600"
                      >
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M12 18v-6" />
                        <path d="m9 15 3 3 3-3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Digital Canvas</h3>
                      <p className="text-sm text-gray-500">
                        Draw, write, and erase on a responsive digital canvas that feels natural.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-blue-600"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="m16 10-4 4-4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">AI-Powered Analysis</h3>
                      <p className="text-sm text-gray-500">
                        Select any part of your notes and let our AI analyze and provide insights.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6 text-blue-600"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <path d="M17 12h.01" />
                        <path d="M13 12h.01" />
                        <path d="M9 12h.01" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Cloud Storage</h3>
                      <p className="text-sm text-gray-500">
                        All your notes are securely stored and accessible from any device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
