import { useEffect, useState } from 'react'
import { formatMoney } from '../App'
import {
  TrendingUp, TrendingDown, Wallet, Package, CreditCard, Receipt,
  DollarSign, ShoppingBag
} from 'lucide-react'

export default function Dashboard() {
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    try {
      const r = await window.api.dashboardResumo()
      setDados(r)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  if (loading) return <div className="text-slate-500">Carregando dashboard...</div>
  if (!dados) return <div className="text-red-500">Erro ao carregar dados</div>

  const cards = [
    { title: 'Vendas Hoje', value: formatMoney(dados.vendasHoje), sub: `${dados.qtdVendasHoje} venda(s)`, icon: ShoppingBag, color: 'bg-emerald-500' },
    { title: 'Entradas', value: formatMoney(dados.entradas), sub: 'Caixa atual', icon: TrendingUp, color: 'bg-green-500' },
    { title: 'Saídas', value: formatMoney(dados.saidas), sub: 'Caixa atual', icon: TrendingDown, color: 'bg-rose-500' },
    { title: 'Saldo do Caixa', value: formatMoney(dados.saldoCaixa), sub: dados.caixaAberto ? 'Caixa aberto' : 'Caixa fechado', icon: Wallet, color: 'bg-cyan-500' },
    { title: 'Contas a Pagar', value: formatMoney(dados.contasPagar), sub: 'Pendentes', icon: CreditCard, color: 'bg-orange-500' },
    { title: 'Contas a Receber', value: formatMoney(dados.contasReceber), sub: 'Pendentes', icon: Receipt, color: 'bg-blue-500' },
    { title: 'Valor do Estoque', value: formatMoney(dados.valorEstoque), sub: `Custo: ${formatMoney(dados.custoEstoque)}`, icon: Package, color: 'bg-violet-500' },
    { title: 'Lucro Estimado (hoje)', value: formatMoney(dados.lucroHoje), sub: 'Após custos', icon: DollarSign, color: 'bg-teal-500' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Visão geral do negócio em tempo real</p>
        </div>
        <button onClick={carregar} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{c.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{c.value}</p>
                <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
              </div>
              <div className={`${c.color} p-2.5 rounded-lg`}>
                <c.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-3">Resumo Rápido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Quanto vendi hoje?</p>
            <p className="text-xl font-bold text-emerald-600">{formatMoney(dados.vendasHoje)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Quanto tenho no caixa?</p>
            <p className="text-xl font-bold text-cyan-600">{formatMoney(dados.saldoCaixa)}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-slate-500">Quanto estou lucrando hoje?</p>
            <p className="text-xl font-bold text-teal-600">{formatMoney(dados.lucroHoje)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
