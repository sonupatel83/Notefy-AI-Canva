"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Save, LogOut, Home } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DashboardHeaderProps {
  title?: string
  onTitleChange?: (title: string) => void
  onSave?: () => void
  isSaving?: boolean
  showSaveButton?: boolean
  isCanvasPage?: boolean
}

export default function DashboardHeader({ 
  title, 
  onTitleChange, 
  onSave, 
  isSaving = false,
  showSaveButton = false,
  isCanvasPage = false
}: DashboardHeaderProps) {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Notefy</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {title !== undefined && onTitleChange && (
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="max-w-xs font-medium"
                placeholder="Note title"
              />
            </div>
          )}
          {showSaveButton && onSave && (
              <Button onClick={onSave} disabled={isSaving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          <div className="flex items-center gap-2">
            {isCanvasPage ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-8">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-gray-100 hover:bg-gray-200">
                    <span className="text-sm font-medium">U</span>
                    <span className="sr-only">User Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
          </div>
        </div>
      </div>
    </header>
  )
}
