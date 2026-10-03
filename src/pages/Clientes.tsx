import { useEffect, useState } from 'react'

export default function Clientes() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    try {
      setDados(await window.api.clientesListar(busca || undefined))
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && carregar()}
            placeholder="Buscar..."
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={carregar} className="px-4 py-2 bg-white border rounded-lg text-sm hover:bg-slate-50">Buscar</button>
        </div>
      </div>
      {loading ? <p className="text-slate-500">Carregando...</p> : (
        <div className="bg-white rounded-xl border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-medium">CPF/CNPJ</th>
                <th className="text-left px-4 py-3 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 font-medium">E-mail</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((row: any) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium">{row.nome}</td>
                  <td className="px-4 py-2.5">{row.cpf_cnpj || '-'}</td>
                  <td className="px-4 py-2.5">{row.telefone || '-'}</td>
                  <td className="px-4 py-2.5">{row.email || '-'}</td>
                </tr>
              ))}
              {dados.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-slate-400">Nenhum cliente</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
