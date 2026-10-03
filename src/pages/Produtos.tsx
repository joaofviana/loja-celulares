import { useEffect, useState } from 'react'
import { formatMoney } from '../App'

export default function Produtos() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      setDados(await window.api.produtosListar())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <button onClick={carregar} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">Atualizar</button>
      </div>
      {loading ? <p className="text-slate-500">Carregando...</p> : (
        <div className="bg-white rounded-xl border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Código</th>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">Marca</th>
                <th className="text-left px-4 py-3 font-medium">Tipo</th>
                <th className="text-right px-4 py-3 font-medium">Custo</th>
                <th className="text-right px-4 py-3 font-medium">Preço</th>
                <th className="text-right px-4 py-3 font-medium">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5">{row.codigo || '-'}</td>
                  <td className="px-4 py-2.5">{row.nome}</td>
                  <td className="px-4 py-2.5">{row.marca || '-'}</td>
                  <td className="px-4 py-2.5">{row.tipo}</td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(row.custo)}</td>
                  <td className="px-4 py-2.5 text-right">{formatMoney(row.preco_venda)}</td>
                  <td className="px-4 py-2.5 text-right">{row.estoque_atual}</td>
                </tr>
              ))}
              {dados.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Nenhum produto</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
