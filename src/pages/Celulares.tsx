import { useEffect, useState } from 'react'
import { formatMoney } from '../App'

export default function Celulares() {
  const [dados, setDados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ imei1: '', imei2: '', marca: '', modelo: '', cor: '', armazenamento: '', custo: '', preco_venda: '', fornecedor_id: '' })
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [msg, setMsg] = useState('')

  const carregar = async () => {
    setLoading(true)
    try {
      setDados(await window.api.celularesListar())
    } finally { setLoading(false) }
  }

  useEffect(() => {
    carregar()
    window.api.fornecedoresListar().then(setFornecedores)
  }, [])

  const salvar = async () => {
    try {
      await window.api.celularesCadastrar({
        ...form,
        custo: parseFloat(form.custo) || 0,
        preco_venda: parseFloat(form.preco_venda) || 0,
        fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
      })
      setMsg('Celular cadastrado com sucesso!')
      setShowForm(false)
      setForm({ imei1: '', imei2: '', marca: '', modelo: '', cor: '', armazenamento: '', custo: '', preco_venda: '', fornecedor_id: '' })
      carregar()
    } catch (e: any) {
      setMsg(e?.message || 'Erro ao cadastrar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Celulares (IMEI)</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm">Novo Celular</button>
          <button onClick={carregar} className="px-4 py-2 bg-white border rounded-lg text-sm">Atualizar</button>
        </div>
      </div>
      {msg && <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded text-sm">{msg}</div>}
      {showForm && (
        <div className="bg-white rounded-xl border p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="IMEI 1 *" value={form.imei1} onChange={e => setForm({...form, imei1: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="IMEI 2" value={form.imei2} onChange={e => setForm({...form, imei2: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Marca *" value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Modelo *" value={form.modelo} onChange={e => setForm({...form, modelo: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Cor" value={form.cor} onChange={e => setForm({...form, cor: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Armazenamento" value={form.armazenamento} onChange={e => setForm({...form, armazenamento: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Custo" value={form.custo} onChange={e => setForm({...form, custo: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Preço venda" value={form.preco_venda} onChange={e => setForm({...form, preco_venda: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          <select value={form.fornecedor_id} onChange={e => setForm({...form, fornecedor_id: e.target.value})} className="border rounded px-3 py-2 text-sm">
            <option value="">Fornecedor</option>
            {fornecedores.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <button onClick={salvar} className="bg-emerald-600 text-white rounded-lg text-sm font-medium col-span-2">Salvar Celular</button>
        </div>
      )}
      {loading ? <p>Carregando...</p> : (
        <div className="bg-white rounded-xl border overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3">IMEI</th>
                <th className="text-left px-4 py-3">Aparelho</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Custo</th>
                <th className="text-right px-4 py-3">Venda</th>
                <th className="text-left px-4 py-3">Fornecedor</th>
              </tr>
            </thead>
            <tbody>
              {dados.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">{c.imei1}</td>
                  <td className="px-4 py-2">{c.marca} {c.modelo} {c.armazenamento} {c.cor}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${c.status === 'em_estoque' ? 'bg-emerald-100 text-emerald-700' : c.status === 'vendido' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">{formatMoney(c.custo)}</td>
                  <td className="px-4 py-2 text-right">{formatMoney(c.preco_venda)}</td>
                  <td className="px-4 py-2">{c.fornecedor_nome || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
