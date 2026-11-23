"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { livestockApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Edit, Trash } from "lucide-react"
import { PageLoader } from "@/components/ui/loader";
import { AuthGateCard } from "@/components/ui/auth-gate-card";
import { useRouter } from "next/navigation"

const healthColors = {
  healthy: "bg-green-100 text-green-800",
  sick: "bg-red-100 text-red-800",
  under_treatment: "bg-yellow-100 text-yellow-800",
  quarantined: "bg-orange-100 text-orange-800",
}

export default function LivestockPage() {
  const {token, user, isLoading: authLoading } = useAuth();
  const router = useRouter()
  const [livestock, setLivestock] = useState([])
  const [loading, setLoading] = useState(true)

  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    fetchLivestock()
  }, [token])

  async function fetchLivestock() {
    if (!token) { if (!authLoading) setLoading(false); return; }
    
    try {
      const data = await livestockApi.getAll(token)
      // Normalize response to always be an array
      const list = Array.isArray(data) ? data : (data && data.data ? data.data : []);
      // Ensure each item has an `id` property for client-side usage
      const normalized = list.map((a) => ({ ...a, id: a.id || a._id }));
      setLivestock(normalized)
    } catch (error) {
      toast.error("Failed to load livestock")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this livestock?")) return
    
    try {
      await livestockApi.delete(id, token)
      toast.success("Livestock deleted successfully")
      fetchLivestock()
    } catch (error) {
      toast.error("Failed to delete livestock")
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!token) {
    return <AuthGateCard title="Livestock Records" />;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Livestock</h2>
          {canEdit && (
            <Button asChild>
              <Link href="/livestock/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Livestock
              </Link>
            </Button>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {livestock?.map((animal) => (
          <Card key={animal.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{animal.name}</CardTitle>
                  <CardDescription>{animal.species} - {animal.breed || 'Unknown Breed'}</CardDescription>
                </div>
                <Badge className={healthColors[animal.health_status] || ""} variant="outline">
                  {animal.health_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gender:</span>
                <span>{animal.gender}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Age:</span>
                <span>{animal.age} months</span>
              </div>
              {animal.weight && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weight:</span>
                  <span>{animal.weight} kg</span>
                </div>
              )}
              {animal.tag_number && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tag:</span>
                  <span>{animal.tag_number}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{animal.status}</Badge>
              </div>
              
              {canEdit && (
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/livestock/${animal.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(animal.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {(!livestock || livestock.length === 0) && (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No livestock found
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
