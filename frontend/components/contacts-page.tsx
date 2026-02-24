"use client"

import { useState, useEffect } from "react"
import type { Contact } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search } from "lucide-react"

const emptyContact = { name: "", email: "", phone: "", address: "" }

export function ContactsPage() {
  const [customers, setCustomers] = useState<Contact[]>([])
  const [suppliers, setSuppliers] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("customers")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyContact)
  const [isLoading, setIsLoading] = useState(true)

  const isCustomerTab = activeTab === "customers"
  const contacts = isCustomerTab ? customers : suppliers

  useEffect(() => {
    fetchContacts()
  }, [])

  async function fetchContacts() {
    setIsLoading(true)
    const token = localStorage.getItem("token")
    try {
      // Fetch from the exact tables FastAPI created
      const [custRes, suppRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/customers/", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://127.0.0.1:8000/suppliers/", { headers: { Authorization: `Bearer ${token}` } })
      ])
      
      if (custRes.ok) {
        const data = await custRes.json()
        setCustomers(data.map((c: any) => ({ ...c, type: "customer" })))
      }
      if (suppRes.ok) {
        const data = await suppRes.json()
        setSuppliers(data.map((s: any) => ({ ...s, type: "supplier" })))
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  )

  async function handleSave() {
    const token = localStorage.getItem("token")
    // Tell React which FastAPI door to knock on based on the active tab
    const endpoint = isCustomerTab ? "customers" : "suppliers"

    try {
      const res = await fetch(`http://127.0.0.1:8000/${endpoint}/`, {
        method: "POST",
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
      
      fetchContacts()
      setDialogOpen(false)
      setForm(emptyContact)
    } catch (error) {
      alert("Network error: Could not reach the server.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contacts</h1>
        <p className="text-sm text-muted-foreground">Manage your customers and suppliers.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearch("") }}>
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
          </TabsList>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add {isCustomerTab ? "Customer" : "Supplier"}
          </Button>
        </div>
        
        <div className="mt-4 relative max-w-sm">
           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
           <Input placeholder={`Search ${activeTab}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <TabsContent value="customers" className="mt-4">
          <ContactTable contacts={filtered} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <ContactTable contacts={filtered} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {isCustomerTab ? "Customer" : "Supplier"}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="flex flex-col gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="flex flex-col gap-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div className="flex flex-col gap-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContactTable({ contacts, isLoading }: any) {
  if (isLoading) return <div className="text-center py-10">Loading contacts...</div>
  if (contacts.length === 0) return <div className="text-center py-10 text-muted-foreground">No contacts found.</div>
  
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c: any) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>{c.email}</TableCell>
              <TableCell>{c.phone}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}