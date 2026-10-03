import { useEffect, useState } from 'react'

export default function Configuracoes() {
  const [config, setConfig] = useState<any>({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    window.api.configObter().then(setConfig).catch(console.error)
  }, [])

  const salvar = async () => {
    await window.api.configSalvar(config)
    setMsg('Configurações salvas!')
  }

  const fazerBackup = async () => {
    const file = await window.api.backupFazer()
    setMsg(`Backup criado: ${file}`)
  }

  const restaurar = async () => {
    if (!confirm('Tem certeza? Os dados atuais serão substituídos pelo backup.')) return
    const r = await window.api.backupRestaurar()
    if (r.success) setMsg('Backup restaurado! Reinicie o programa.')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>
      {msg && <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded text-sm">{msg}</div>}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Nome da Loja</label>
          <input value={config.nome_loja || ''} onChange={e => setConfig({...config, nome_loja: e.target.value})} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">CNPJ</label>
          <input value={config.cnpj || ''} onChange={e => setConfig({...config, cnpj: e.target.value})} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Telefone</label>
          <input value={config.telefone || ''} onChange={e => setConfig({...config, telefone: e.target.value})} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Taxa Débito %</label>
            <input type="number" step="0.1" value={config.taxa_debito ?? ''} onChange={e => setConfig({...config, taxa_debito: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Taxa Crédito %</label>
            <input type="number" step="0.1" value={config.taxa_credito ?? ''} onChange={e => setConfig({...config, taxa_credito: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Taxa Parcelado %</label>
            <input type="number" step="0.1" value={config.taxa_credito_parcelado ?? ''} onChange={e => setConfig({...config, taxa_credito_parcelado: parseFloat(e.target.value)})} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
        </div>
        <button onClick={salvar} className="px-6 py-2 bg-cyan-600 text-white rounded-lg font-medium">Salvar</button>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h2 className="font-semibold">Backup e Restauração</h2>
        <p className="text-sm text-slate-500">O banco de dados fica 100% local no seu computador. Faça backups regularmente.</p>
        <div className="flex gap-3">
          <button onClick={fazerBackup} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm">Fazer Backup Agora</button>
          <button onClick={restaurar} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm">Restaurar Backup</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-2">Usuários Demo</h2>
        <p className="text-sm text-slate-500">admin / admin123 (Administrador)</p>
        <p className="text-sm text-slate-500">vendedor / vendedor123 (Vendedor)</p>
      </div>
    </div>
  )
}
