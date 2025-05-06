"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Save, LogOut, Home, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth, useUser } from "@clerk/nextjs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

interface DashboardHeaderProps {
  title?: string
  onTitleChange?: (title: string) => void
  onSave?: () => void
  isSaving?: boolean
  showSaveButton?: boolean
  isCanvasPage?: boolean
  onSearch?: (query: string) => void
}

export default function DashboardHeader({ 
  title, 
  onTitleChange, 
  onSave, 
  isSaving = false,
  showSaveButton = false,
  isCanvasPage = false,
  onSearch
}: DashboardHeaderProps) {
  const router = useRouter()
  const { signOut } = useAuth()
  const { user } = useUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim()) {
        setIsSearching(true)
        onSearch?.(searchQuery)
        setIsSearching(false)
      } else {
        onSearch?.("")
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, onSearch])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Notefy</span>
        </Link>

        {/* Right side elements */}
        <div className="flex items-center gap-4">
          {!isCanvasPage && (
            <div className="w-full max-w-md">
              <div className="relative">
                {isSearching ? (
                  <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  type="search"
                  placeholder="Search notes..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}

          {title !== undefined && onTitleChange && (
            <div className="w-full md:w-auto md:flex-none">
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                    <AvatarFallback>
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
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
    </header>
  )
}
