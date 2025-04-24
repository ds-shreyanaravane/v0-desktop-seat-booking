import { redirect } from "next/navigation"
import LoginPage from "@/components/login-page"

export default function Home() {
  // In a real app, you would check for authentication here
  // For demo purposes, we'll just show the login page
  const isAuthenticated = false

  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return <LoginPage />
}
