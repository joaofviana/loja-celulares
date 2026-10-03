import { useEffect, useState } from 'react'
import { formatMoney } from '../App'

export default function Vendas() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      setDados(await window.api.vendasListar())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendas</h1>
        <button onClick={carregar} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">Atualizar</button>
      </div>
      {loading ? (
        <p className="text-slate-500">Carregando...</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Número</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">Data</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
                <th className="text-right px-4 py-3 font-medium">Lucro</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{row.numero}</td>
                  <td className="px-4 py-2.5">{row.cliente_nome || 'Avulso'}</td>
                  <td className="px-4 py-2.5">{row.data_venda?.slice(0, 16)}</td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(row.valor_total)}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-600">{formatMoney(row.lucro)}</td>
                  <td className="px-4 py-2.5">{row.status}</td>
                </tr>
              ))}
              {dados.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Nenhuma venda</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
