import { useEffect, useState } from 'react'
import { formatMoney } from '../App'

export default function Caixa({ user }: { user: any }) {
  const [caixa, setCaixa] = useState<any>(null)
  const [movs, setMovs] = useState<any[]>([])
  const [valorInicial, setValorInicial] = useState('100')
  const [valorContado, setValorContado] = useState('')
  const [msg, setMsg] = useState('')
  const [novaMov, setNovaMov] = useState({ tipo: 'saida', categoria: 'outras', descricao: '', valor: '' })

  const carregar = async () => {
    const c = await window.api.caixaStatus()
    setCaixa(c)
    if (c) {
      const m = await window.api.caixaMovimentacoes(c.id)
      setMovs(m)
    } else {
      setMovs([])
    }
  }

  useEffect(() => { carregar() }, [])

  const abrir = async () => {
    try {
      await window.api.caixaAbrir(parseFloat(valorInicial) || 0, user?.id || 1)
      setMsg('Caixa aberto com sucesso')
      carregar()
    } catch (e: any) {
      setMsg(e?.message || 'Erro')
    }
  }

  const fechar = async () => {
    if (!caixa) return
    try {
      const r = await window.api.caixaFechar({
        caixaId: caixa.id,
        valorContado: parseFloat(valorContado) || 0,
        usuarioId: user?.id || 1,
      })
      setMsg(`Caixa fechado. Esperado: ${formatMoney(r.esperado)} | Contado: ${formatMoney(r.contado)} | Diferença: ${formatMoney(r.diferenca)}`)
      carregar()
    } catch (e: any) {
      setMsg(e?.message || 'Erro')
    }
  }

  const addMov = async () => {
    try {
      await window.api.caixaAdicionarMovimento({
        tipo: novaMov.tipo,
        categoria: novaMov.categoria,
        descricao: novaMov.descricao,
        valor: parseFloat(novaMov.valor) || 0,
        usuario_id: user?.id || 1,
      })
      setNovaMov({ tipo: 'saida', categoria: 'outras', descricao: '', valor: '' })
      carregar()
    } catch (e: any) {
      setMsg(e?.message || 'Erro')
    }
  }

  const entradas = movs.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0)
  const saidas = movs.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0)
  const saldo = (caixa?.valor_inicial || 0) + entradas - saidas

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caixa</h1>
      {msg && <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm">{msg}</div>}

      {!caixa ? (
        <div className="bg-white rounded-xl border p-6 max-w-md">
          <h2 className="font-semibold mb-4">Abrir Caixa do Dia</h2>
          <label className="text-sm text-slate-600">Valor inicial (fundo de troco)</label>
          <input
            type="number"
            value={valorInicial}
            onChange={e => setValorInicial(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 mb-4"
          />
          <button onClick={abrir} className="w-full py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700">
            Abrir Caixa
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">Saldo Inicial</p>
              <p className="text-xl font-bold">{formatMoney(caixa.valor_inicial)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">+ Entradas</p>
              <p className="text-xl font-bold text-emerald-600">{formatMoney(entradas)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">- Saídas</p>
              <p className="text-xl font-bold text-rose-600">{formatMoney(saidas)}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-slate-500">= Saldo Final</p>
              <p className="text-xl font-bold text-cyan-600">{formatMoney(saldo)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Nova Movimentação</h3>
              <div className="space-y-2">
                <select value={novaMov.tipo} onChange={e => setNovaMov({ ...novaMov, tipo: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
                <input placeholder="Descrição" value={novaMov.descricao} onChange={e => setNovaMov({ ...novaMov, descricao: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                <input placeholder="Valor" value={novaMov.valor} onChange={e => setNovaMov({ ...novaMov, valor: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
                <select value={novaMov.categoria} onChange={e => setNovaMov({ ...novaMov, categoria: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="venda">Venda</option>
                  <option value="recebimento">Recebimento</option>
                  <option value="compra">Compra</option>
                  <option value="aluguel">Aluguel</option>
                  <option value="energia">Energia</option>
                  <option value="internet">Internet</option>
                  <option value="salarios">Salários</option>
                  <option value="marketing">Marketing</option>
                  <option value="impostos">Impostos</option>
                  <option value="outras">Outras</option>
                </select>
                <button onClick={addMov} className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm">Registrar</button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold mb-3">Fechar Caixa</h3>
              <p className="text-sm text-slate-500 mb-2">Saldo esperado: <strong>{formatMoney(saldo)}</strong></p>
              <label className="text-sm">Valor contado</label>
              <input type="number" value={valorContado} onChange={e => setValorContado(e.target.value)} className="w-full border rounded px-3 py-2 mt-1 mb-3" />
              <button onClick={fechar} className="w-full py-2.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700">
                Fechar Caixa
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3">Hora</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Descrição</th>
                  <th className="text-left px-4 py-3">Forma</th>
                  <th className="text-right px-4 py-3">Valor</th>
                </tr>
              </thead>
              <tbody>
                {movs.map((m: any) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">{m.created_at?.slice(11, 16)}</td>
                    <td className="px-4 py-2">
                      <span className={m.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}>{m.tipo}</span>
                    </td>
                    <td className="px-4 py-2">{m.descricao}</td>
                    <td className="px-4 py-2">{m.forma_pagamento || '-'}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatMoney(m.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
