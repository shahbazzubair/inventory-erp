"use client"

import { useState, useEffect } from "react"
import type { Transaction, Product, Contact } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Download } from "lucide-react"

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [form, setForm] = useState({
    productId: "",
    contactId: "", 
    type: "IN" as "IN" | "OUT",
    quantity: 1,
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    const token = localStorage.getItem("token")
    try {
      const [txnRes, prodRes, custRes, suppRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/transactions/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch("http://127.0.0.1:8000/products/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch("http://127.0.0.1:8000/customers/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch("http://127.0.0.1:8000/suppliers/", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ])
      
      if (txnRes && txnRes.ok) setTransactions(await txnRes.json())
      if (prodRes && prodRes.ok) setProducts(await prodRes.json())
      
      let allContacts: Contact[] = []
      if (custRes && custRes.ok) {
        const data = await custRes.json()
        allContacts = [...allContacts, ...data.map((c: any) => ({ ...c, type: "customer" }))]
      }
      if (suppRes && suppRes.ok) {
        const data = await suppRes.json()
        allContacts = [...allContacts, ...data.map((s: any) => ({ ...s, type: "supplier" }))]
      }
      setContacts(allContacts)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableContacts = contacts.filter(c => 
    form.type === "IN" ? c.type === "supplier" : c.type === "customer"
  )

  const filtered = transactions.filter((t) => String(t.id).toLowerCase().includes(search.toLowerCase()))

  function openCreate() {
    setForm({ productId: "", contactId: "", type: "IN", quantity: 1 })
    setDialogOpen(true)
  }

  async function handleCreate() {
    const token = localStorage.getItem("token")
    
    const payload = {
      product_id: parseInt(form.productId), 
      transaction_type: form.type,
      quantity: form.quantity,
      supplier_id: form.type === "IN" && form.contactId ? parseInt(form.contactId) : null,
      customer_id: form.type === "OUT" && form.contactId ? parseInt(form.contactId) : null,
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/transactions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        alert(`FastAPI Error: ${JSON.stringify(errorData)}`)
        return 
      }
      
      fetchData()
      setDialogOpen(false)
      setForm({ productId: "", contactId: "", type: "IN", quantity: 1 })
    } catch (error) {
      alert("Network error: Check if your Python backend is running.")
    }
  }

  // --- NEW SECURE PDF DOWNLOAD FUNCTION ---
  async function downloadInvoice(transactionId: number) {
    const token = localStorage.getItem("token")
    
    try {
      // 1. Fetch the file securely from your FastAPI backend
      const res = await fetch(`http://127.0.0.1:8000/transactions/${transactionId}/invoice`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        alert("Failed to generate invoice. Make sure the transaction exists.")
        return
      }

      // 2. Convert the secure response into a file Blob
      const blob = await res.blob()
      
      // 3. Create a temporary URL for the Blob
      const url = window.URL.createObjectURL(blob)
      
      // 4. Create a hidden link, click it to trigger the download, and remove it
      const a = document.createElement("a")
      a.href = url
      a.download = `Invoice_${transactionId}.pdf` // Suggests a filename to the browser
      document.body.appendChild(a)
      a.click()
      
      // 5. Clean up memory
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error("Download failed:", error)
      alert("Network error: Could not download the invoice.")
    }
  }

  const getProductName = (id: number) => products.find(p => p.id === String(id) || p.id === id as any)?.name || `Product #${id}`
  const getContactName = (txn: any) => {
    if (txn.transaction_type === "IN" && txn.supplier_id) return contacts.find(c => c.type === "supplier" && String(c.id) === String(txn.supplier_id))?.name || "Supplier"
    if (txn.transaction_type === "OUT" && txn.customer_id) return contacts.find(c => c.type === "customer" && String(c.id) === String(txn.customer_id))?.name || "Customer"
    return "-"
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h1>
        <p className="text-sm text-muted-foreground">Track stock movements and issue invoices. Records are immutable for transparency.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Transaction</Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="text-right">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow> : 
            filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center h-24">No transactions found.</TableCell></TableRow> :
            filtered.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell className="font-mono text-xs">{txn.id}</TableCell>
                <TableCell className="font-medium">{getProductName(txn.product_id)}</TableCell>
                <TableCell className="text-muted-foreground">{getContactName(txn)}</TableCell>
                <TableCell><Badge variant={txn.transaction_type === "IN" ? "default" : "secondary"}>{txn.transaction_type}</Badge></TableCell>
                <TableCell className="text-right font-mono">{txn.quantity}</TableCell>
                <TableCell className="text-right text-muted-foreground">{txn.date ? String(txn.date).split('T')[0] : "-"}</TableCell>
                <TableCell className="text-right">
                  {/* --- BUTTON NOW TRIGGERS THE PDF DOWNLOAD --- */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadInvoice(txn.id)}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription>
              Record a new stock movement. This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(val) => setForm({ ...form, type: val as "IN" | "OUT", contactId: "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock IN (Purchase from Supplier)</SelectItem>
                  <SelectItem value="OUT">Stock OUT (Sale to Customer)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{form.type === "IN" ? "Supplier *" : "Customer *"}</Label>
              <Select value={form.contactId} onValueChange={(val) => setForm({ ...form, contactId: val })}>
                <SelectTrigger><SelectValue placeholder={form.type === "IN" ? "Select a Supplier" : "Select a Customer"} /></SelectTrigger>
                <SelectContent>
                  {availableContacts.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <span className="font-medium">{c.name}</span>
                      {c.email && <span className="ml-2 text-xs text-muted-foreground">({c.email})</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Product *</Label>
              <Select value={form.productId} onValueChange={(val) => setForm({ ...form, productId: val })}>
                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      <span className="font-mono text-muted-foreground mr-2">[{p.sku || p.id}]</span> 
                      {p.name} - ${p.price?.toFixed(2) || "0.00"} 
                      <span className="ml-2 text-muted-foreground">(Stock: {p.stock})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} />
            </div>
            
            {form.productId && (
              <div className="rounded-md border bg-muted/50 p-3 mt-2">
                <p className="text-sm text-muted-foreground">
                  Estimated total:{" "}
                  <span className="font-mono font-medium text-foreground">
                    ${((products.find((p) => String(p.id) === form.productId)?.price ?? 0) * form.quantity).toFixed(2)}
                  </span>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.productId || !form.contactId}>
              Create Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}