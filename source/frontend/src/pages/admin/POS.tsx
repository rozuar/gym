import { useState, useEffect } from 'react'
import { products as productsApi, sales as salesApi, users as usersApi } from '../../lib/api'
import type { Product, Sale, SaleItem, User } from '../../types'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input, Select, Textarea } from '../../components/ui/Input'

function fmtCLP(n: number) { return '$' + n.toLocaleString('es-CL') }
function fmt(d: string) { return new Date(d).toLocaleDateString('es-CL') }

type ProductForm = { name: string; description: string; category: string; price: string; stock: string }
const emptyProductForm = (): ProductForm => ({ name: '', description: '', category: 'other', price: '0', stock: '-1' })

export default function AdminPOS() {
  const [tab, setTab] = useState<'products' | 'sales' | 'new-sale'>('products')
  const [prods, setProds] = useState<Product[]>([])
  const [salesList, setSalesList] = useState<Sale[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showProdForm, setShowProdForm] = useState(false)
  const [editProdId, setEditProdId] = useState<number | null>(null)
  const [prodForm, setProdForm] = useState<ProductForm>(emptyProductForm())

  // POS cart
  const [cart, setCart] = useState<SaleItem[]>([])
  const [saleUserId, setSaleUserId] = useState('')
  const [saleMethod, setSaleMethod] = useState('cash')
  const [saleNotes, setSaleNotes] = useState('')

  const loadProds = () => productsApi.list(false).then(r => { setProds(r.products || []); setLoading(false) })
  const loadSales = () => salesApi.list().then(r => setSalesList(r.sales || []))

  useEffect(() => { loadProds() }, [])
  useEffect(() => { if (tab === 'sales') loadSales() }, [tab])
  useEffect(() => { if (tab === 'new-sale' && users.length === 0) usersApi.list(200).then(r => setUsers(r.users || [])) }, [tab])

  const openNewProd = () => { setEditProdId(null); setProdForm(emptyProductForm()); setShowProdForm(true) }
  const openEditProd = (p: Product) => {
    setEditProdId(p.id)
    setProdForm({ name: p.name, description: p.description, category: p.category, price: String(p.price), stock: String(p.stock) })
    setShowProdForm(true)
  }
  const submitProd = async () => {
    if (!prodForm.name.trim()) return alert('Nombre requerido')
    const data = { name: prodForm.name, description: prodForm.description, category: prodForm.category, price: Number(prodForm.price), stock: Number(prodForm.stock) }
    try {
      if (editProdId) await productsApi.update(editProdId, data)
      else await productsApi.create(data)
      setShowProdForm(false); loadProds()
    } catch (e: any) { alert(e.message) }
  }
  const delProd = async (id: number) => { if (!confirm('Eliminar?')) return; await productsApi.remove(id); loadProds() }

  const addToCart = (p: Product) => {
    setCart(c => {
      const existing = c.find(i => i.product_id === p.id)
      if (existing) return c.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...c, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: p.price }]
    })
  }
  const removeFromCart = (productId: number) => setCart(c => c.filter(i => i.product_id !== productId))
  const cartTotal = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  const submitSale = async () => {
    if (cart.length === 0) return alert('Carrito vacío')
    try {
      await salesApi.create({ user_id: saleUserId ? Number(saleUserId) : undefined, payment_method: saleMethod, notes: saleNotes, items: cart })
      setCart([]); setSaleUserId(''); setSaleNotes(''); setTab('sales'); loadProds()
    } catch (e: any) { alert(e.message) }
  }

  const pf = (k: keyof ProductForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setProdForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Retail / POS</h2>
        <div className="flex gap-2">
          {(['products','sales','new-sale'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded text-sm ${tab === t ? 'bg-accent text-white' : 'bg-border text-muted hover:text-white'}`}>
              {t === 'products' ? 'Productos' : t === 'sales' ? 'Ventas' : 'Nueva venta'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'products' && (
        <>
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={openNewProd}>+ Producto</Button>
          </div>
          {loading ? <p className="text-muted text-center py-8">Cargando...</p> : prods.length === 0 ? (
            <p className="text-muted text-center py-8">Sin productos</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {prods.map(p => (
                <Card key={p.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        {!p.active && <Badge variant="danger">Inactivo</Badge>}
                      </div>
                      <p className="text-sm text-accent font-bold">{fmtCLP(p.price)}</p>
                      <p className="text-xs text-muted">Stock: {p.stock === -1 ? '∞' : p.stock}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditProd(p)} className="text-xs text-muted hover:text-white">Editar</button>
                      <button onClick={() => delProd(p.id)} className="text-xs text-danger">Eliminar</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'new-sale' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-semibold text-muted mb-2">Productos</h3>
            <div className="space-y-2">
              {prods.filter(p => p.active).map(p => (
                <Card key={p.id} className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => addToCart(p)}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-sm text-accent">{fmtCLP(p.price)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted mb-2">Carrito</h3>
            {cart.length === 0 ? (
              <p className="text-muted text-sm text-center py-4">Haz clic en un producto para agregar</p>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {cart.map(item => (
                    <div key={item.product_id} className="flex items-center justify-between text-sm bg-card rounded px-3 py-2 border border-border">
                      <div>
                        <span className="font-medium">{item.product_name}</span>
                        <span className="text-muted ml-2">×{item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{fmtCLP(item.unit_price * item.quantity)}</span>
                        <button onClick={() => removeFromCart(item.product_id!)} className="text-danger text-xs">×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span><span className="text-accent">{fmtCLP(cartTotal)}</span>
                  </div>
                  <Select value={saleUserId} onChange={e => setSaleUserId(e.target.value)}>
                    <option value="">Cliente (opcional)</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </Select>
                  <Select value={saleMethod} onChange={e => setSaleMethod(e.target.value)}>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                  </Select>
                  <Textarea placeholder="Notas" value={saleNotes} onChange={e => setSaleNotes(e.target.value)} rows={2} />
                  <Button className="w-full" onClick={submitSale}>Confirmar venta</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'sales' && (
        <div className="space-y-2">
          {salesList.length === 0 ? (
            <p className="text-muted text-center py-8">Sin ventas</p>
          ) : salesList.map(s => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-accent">{fmtCLP(s.total)}</span>
                    <Badge variant="default">{s.payment_method}</Badge>
                  </div>
                  {s.user_name && <p className="text-xs text-muted">{s.user_name}</p>}
                  <p className="text-xs text-muted">{fmt(s.created_at)}</p>
                </div>
                <div className="text-right text-xs text-muted">
                  {s.items?.map(i => <p key={i.id}>{i.product_name} ×{i.quantity}</p>)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showProdForm} onClose={() => setShowProdForm(false)} title={editProdId ? 'Editar producto' : 'Nuevo producto'}>
        <div className="space-y-3">
          <Input placeholder="Nombre *" value={prodForm.name} onChange={pf('name')} />
          <Select value={prodForm.category} onChange={pf('category')}>
            <option value="clothing">Ropa</option>
            <option value="supplements">Suplementos</option>
            <option value="equipment">Equipamiento</option>
            <option value="other">Otro</option>
          </Select>
          <Textarea placeholder="Descripción" value={prodForm.description} onChange={pf('description')} rows={2} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Precio (CLP)" value={prodForm.price} onChange={pf('price')} type="number" min="0" />
            <Input placeholder="Stock (-1=∞)" value={prodForm.stock} onChange={pf('stock')} type="number" min="-1" />
          </div>
          <Button className="w-full" onClick={submitProd}>Guardar</Button>
        </div>
      </Modal>
    </div>
  )
}
