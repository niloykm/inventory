"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { itemsApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ArrowLeft, Edit, Trash } from "lucide-react"
import { PageLoader } from "@/components/ui/loader"
import { SafeImage } from "@/components/ui/safe-image";

export default function ItemDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { token, user } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  const canEdit = user?.role === 'admin' || user?.role === 'manager'

  useEffect(() => {
    async function fetchItem() {
      if (!token || !params.id) return
      
      try {
        const data = await itemsApi.getById(params.id, token)
        setItem(data)
      } catch (error) {
        toast.error("Failed to load item")
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [token, params.id])

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return
    
    try {
      await itemsApi.delete(params.id, token)
      toast.success("Item deleted successfully")
      router.push("/inventory")
    } catch (error) {
      toast.error("Failed to delete item")
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!item) {
    return <div className="flex items-center justify-center h-full">Item not found</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">{item.name}</h2>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/inventory/${item.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{item.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-medium">{item.quantity} {item.unit_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge>{item.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price:</span>
              <span className="font-medium">${item.price?.toFixed(2) || "0.00"}</span>
            </div>
            {item.minimum_level && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Level:</span>
                <span className="font-medium">{item.minimum_level}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {item.serial_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serial Number:</span>
                <span className="font-medium">{item.serial_number}</span>
              </div>
            )}
            {item.asset_tag && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Asset Tag:</span>
                <span className="font-medium">{item.asset_tag}</span>
              </div>
            )}
            {item.purchase_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Date:</span>
                <span className="font-medium">{new Date(item.purchase_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
        
        {item.image_url && (
          <Card className="md:col-span-2 overflow-hidden">
            <CardHeader>
              <CardTitle>Item Image</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center bg-zinc-50 dark:bg-zinc-900/40 p-6">
              <SafeImage
                src={item.image_url}
                alt={item.name || "Inventory item"}
                fallbackText={item.sku || item.name || "IT"}
                className="h-48 w-48 max-h-[320px] rounded-md object-contain"
                fallbackClassName="h-32 w-32 text-xl"
              />
            </CardContent>
          </Card>
        )}

        {item.description && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  )
}
