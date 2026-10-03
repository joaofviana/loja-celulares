import { useEffect, useState } from 'react'
import { formatMoney } from '../App'

export default function ContasPagar() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      setDados(await window.api.contasPagarListar())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contas a Pagar</h1>
        <button onClick={carregar} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">Atualizar</button>
      </div>
      {loading ? <p className="text-slate-500">Carregando...</p> : (
        <div className="bg-white rounded-xl border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 font-medium">Fornecedor</th>
                <th className="text-left px-4 py-3 font-medium">Vencimento</th>
                <th className="text-right px-4 py-3 font-medium">Valor</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5">{row.descricao}</td>
                  <td className="px-4 py-2.5">{row.fornecedor_nome || '-'}</td>
                  <td className="px-4 py-2.5">{row.data_vencimento}</td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(row.valor)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      row.status === 'pago' ? 'bg-emerald-100 text-emerald-700' :
                      row.status === 'vencido' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
              {dados.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">Nenhuma conta</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
