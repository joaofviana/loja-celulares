import { useEffect, useState } from 'react'

export default function Fornecedores() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      setDados(await window.api.fornecedoresListar())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fornecedores</h1>
        <button onClick={carregar} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">Atualizar</button>
      </div>
      {loading ? <p className="text-slate-500">Carregando...</p> : (
        <div className="bg-white rounded-xl border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">CNPJ</th>
                <th className="text-left px-4 py-3 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 font-medium">Contato</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{row.nome}</td>
                  <td className="px-4 py-2.5">{row.cnpj || '-'}</td>
                  <td className="px-4 py-2.5">{row.telefone || '-'}</td>
                  <td className="px-4 py-2.5">{row.contato || '-'}</td>
                </tr>
              ))}
              {dados.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">Nenhum fornecedor</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
