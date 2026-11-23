"use client"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthGateCard } from "@/components/ui/auth-gate-card"
import { toast } from "sonner"
import apiClient from "@/lib/api-client"

export default function SettingsPage() {
  const { user, logout, updateUser, token, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: ""
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        full_name: user.full_name || ""
      })
    }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await apiClient.put("/auth/profile", formData, token)
      const updatedUser = response.data || response
      
      updateUser(updatedUser)
      setIsEditing(false)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Update error:", error)
      toast.error(error.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (!authLoading && !token) {
    return (
      <AuthGateCard
        title="Operator Account & Settings"
        description="Sign in with your operator credentials to view or edit your profile, role permissions, and session settings."
      />
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-3xl">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Manage your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium capitalize">
                  {user?.role}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="p-2 bg-muted rounded-md text-sm font-medium">
                  {user?.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                {isEditing ? (
                  <>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false)
                        // Reset form
                        if (user) {
                          setFormData({
                            username: user.username || "",
                            email: user.email || "",
                            full_name: user.full_name || ""
                          })
                        }
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button type="button" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </form>
            
            <div className="pt-4 border-t mt-4">
              <Button variant="outline" onClick={logout} className="w-full">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
