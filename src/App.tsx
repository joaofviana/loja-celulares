import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Wallet, Package, Smartphone, Truck,
  Users, Building2, CreditCard, Receipt, FileText, Settings, LogOut,
  Menu, X
} from 'lucide-react'
import './types'
import Dashboard from './pages/Dashboard'
import Vendas from './pages/Vendas'
import PDV from './pages/PDV'
import Caixa from './pages/Caixa'
import Estoque from './pages/Estoque'
import Produtos from './pages/Produtos'
import Celulares from './pages/Celulares'
import Compras from './pages/Compras'
import Clientes from './pages/Clientes'
import Fornecedores from './pages/Fornecedores'
import ContasPagar from './pages/ContasPagar'
import ContasReceber from './pages/ContasReceber'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pdv', icon: ShoppingCart, label: 'PDV / Venda Rápida' },
  { path: '/vendas', icon: Receipt, label: 'Vendas' },
  { path: '/caixa', icon: Wallet, label: 'Caixa' },
  { path: '/estoque', icon: Package, label: 'Estoque' },
  { path: '/produtos', icon: Package, label: 'Produtos' },
  { path: '/celulares', icon: Smartphone, label: 'Celulares (IMEI)' },
  { path: '/compras', icon: Truck, label: 'Compras' },
  { path: '/clientes', icon: Users, label: 'Clientes' },
  { path: '/fornecedores', icon: Building2, label: 'Fornecedores' },
  { path: '/contas-pagar', icon: CreditCard, label: 'Contas a Pagar' },
  { path: '/contas-receber', icon: Receipt, label: 'Contas a Receber' },
  { path: '/relatorios', icon: FileText, label: 'Relatórios' },
  { path: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export function formatMoney(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function Shell({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); navigate('/pdv') }
      if (e.key === 'F4') { e.preventDefault(); navigate('/caixa') }
      if (e.key === 'F5') { e.preventDefault(); window.location.reload() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-900 text-white transition-all duration-200 flex flex-col shrink-0`}>
        <div className="h-14 flex items-center px-4 border-b border-slate-700 gap-3">
          <Smartphone className="w-7 h-7 text-cyan-400 shrink-0" />
          {sidebarOpen && <span className="font-semibold text-lg tracking-tight">Loja Celulares</span>}
        </div>
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {menuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          {sidebarOpen && (
            <div className="text-xs text-slate-400 mb-2 px-1">
              {user?.nome} · {user?.perfil}
            </div>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && 'Sair'}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="text-sm text-slate-500 hidden md:block">
            Atalhos: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">F2</kbd> PDV
            <kbd className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-xs">F4</kbd> Caixa
            <kbd className="ml-2 px-1.5 py-0.5 bg-slate-100 rounded text-xs">F5</kbd> Atualizar
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<PDV user={user} />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/caixa" element={<Caixa user={user} />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/celulares" element={<Celulares />} />
            <Route path="/compras" element={<Compras />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('loja_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setLoading(false)
  }, [])

  const handleLogin = (u: any) => {
    setUser(u)
    localStorage.setItem('loja_user', JSON.stringify(u))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('loja_user')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-500">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Shell user={user} onLogout={handleLogout} />
    </BrowserRouter>
  )
}
