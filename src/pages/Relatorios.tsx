import { useState } from 'react'
import { formatMoney } from '../App'

export default function Relatorios() {
  const [de, setDe] = useState(new Date(Date.now() - 30*86400000).toISOString().slice(0,10))
  const [ate, setAte] = useState(new Date().toISOString().slice(0,10))
  const [vendas, setVendas] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [formas, setFormas] = useState<any[]>([])

  const gerar = async () => {
    setVendas(await window.api.relVendasPeriodo(de, ate))
    setProdutos(await window.api.relProdutosMaisVendidos(de, ate))
    setFormas(await window.api.relFormasPagamento(de, ate))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Relatórios</h1>
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-sm block">De</label>
          <input type="date" value={de} onChange={e => setDe(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm block">Até</label>
          <input type="date" value={ate} onChange={e => setAte(e.target.value)} className="border rounded px-3 py-2" />
        </div>
        <button onClick={gerar} className="px-4 py-2 bg-cyan-600 text-white rounded-lg">Gerar Relatórios</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Vendas por Dia</h3>
          {vendas.length === 0 && <p className="text-sm text-slate-400">Gere o relatório</p>}
          {vendas.map((v: any) => (
            <div key={v.data} className="flex justify-between text-sm py-1.5 border-b">
              <span>{v.data}</span>
              <span>{v.qtd} · {formatMoney(v.total)} · Lucro {formatMoney(v.lucro)}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Produtos Mais Vendidos</h3>
          {produtos.map((p: any, i: number) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b">
              <span className="truncate mr-2">{p.nome}</span>
              <span className="shrink-0">{p.qtd} · {formatMoney(p.total)}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold mb-3">Formas de Pagamento</h3>
          {formas.map((f: any) => (
            <div key={f.forma_pagamento} className="flex justify-between text-sm py-1.5 border-b">
              <span className="capitalize">{f.forma_pagamento?.replace('_', ' ')}</span>
              <span>{formatMoney(f.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
