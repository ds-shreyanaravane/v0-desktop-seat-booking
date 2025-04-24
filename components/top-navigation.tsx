"use client"

import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun, LogOut, User, HelpCircle, Settings, Menu, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TopNavigationProps {
  onToggleSidebar: () => void
}

export default function TopNavigation({ onToggleSidebar }: TopNavigationProps) {
  const { setTheme, theme } = useTheme()
  const router = useRouter()

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <header className="flex items-center justify-between h-16 px-5 border-b border-[#2A3042]/50 bg-gradient-to-r from-[#1A1F2E] to-[#131725]">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-3 text-[#D0D5E0] hover:bg-[#2A3042]/50"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
            </svg>
          </div>
          <h1 className="text-lg font-semibold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
              Workspace
            </span>
            <span className="text-white"> Booking</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-[#D0D5E0] hover:bg-[#2A3042]/50"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="text-[#D0D5E0] hover:bg-[#2A3042]/50 relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-700 text-[10px] text-white">
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 border border-[#2A3042]">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/abstract-headscape.png" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                  JD
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#1E2536] border-[#2A3042] text-[#D0D5E0]">
            <div className="flex items-center p-3 border-b border-[#2A3042]">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarImage src="/abstract-headscape.png" alt="User" />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white">
                  JD
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">John Doe</p>
                <p className="text-xs text-[#8A94A8]">john.doe@company.com</p>
              </div>
            </div>
            <DropdownMenuItem className="hover:bg-[#2A3042] focus:bg-[#2A3042] cursor-pointer">
              <User className="mr-2 h-4 w-4 text-purple-400" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2A3042] focus:bg-[#2A3042] cursor-pointer">
              <Settings className="mr-2 h-4 w-4 text-purple-400" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-[#2A3042] focus:bg-[#2A3042] cursor-pointer">
              <HelpCircle className="mr-2 h-4 w-4 text-purple-400" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="hover:bg-[#2A3042] focus:bg-[#2A3042] cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-purple-400" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
