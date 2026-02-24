"use client"

import { useState, useEffect } from "react"
import type { Product } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search } from "lucide-react"

// 1. ADDED 'sku' TO THE EMPTY PRODUCT STATE
const emptyProduct = { name: "", sku: "", description: "", price: 0, stock: 0 }

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setIsLoading(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://127.0.0.1:8000/products/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error("Failed to fetch products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      String(p.id).toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditingProduct(null)
    setForm(emptyProduct)
    setDialogOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    // 2. ADDED 'sku' TO THE EDIT STATE
    setForm({ 
      name: product.name, 
      sku: product.sku || "", 
      description: product.description, 
      price: product.price, 
      stock: product.stock 
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const token = localStorage.getItem("token")
    
    try {
      const url = editingProduct 
        ? `http://127.0.0.1:8000/products/${editingProduct.id}`
        : "http://127.0.0.1:8000/products/"
      
      const method = editingProduct ? "PUT" : "POST"

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(`FastAPI Error: ${JSON.stringify(errorData)}`)
        return 
      }
      
      fetchProducts()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to save product:", error)
      alert("Network error: Could not reach the server.")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const token = localStorage.getItem("token")

    try {
      await fetch(`http://127.0.0.1:8000/products/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      fetchProducts()
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to delete product:", error)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">Manage your product inventory and stock levels.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              {/* 3. ADDED SKU COLUMN HEADER */}
              <TableHead className="w-28 font-semibold">SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.id}</TableCell>
                  {/* 4. ADDED SKU DATA CELL */}
                  <TableCell className="font-mono text-xs font-medium text-primary">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                    {product.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${product.price?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell className="text-right">
                    {product.stock <= 10 ? (
                      <Badge variant="destructive" className="font-mono">
                        {product.stock}
                      </Badge>
                    ) : (
                      <span className="font-mono">{product.stock}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit {product.name}</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(product)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete {product.name}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below."
                : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="prod-name">Name</Label>
                <Input id="prod-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              {/* 5. ADDED SKU INPUT FIELD */}
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="prod-sku">SKU</Label>
                <Input id="prod-sku" placeholder="e.g. LAP-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="prod-desc">Description</Label>
              <Input id="prod-desc" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="prod-price">Price ($)</Label>
                <Input id="prod-price" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="prod-stock">Stock</Label>
                <Input id="prod-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingProduct ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{deleteTarget?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}