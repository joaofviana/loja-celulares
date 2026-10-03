import { useState, useEffect, useRef } from 'react'
import { formatMoney } from '../App'
import { Search, Plus, Trash2, CreditCard, Banknote, QrCode, Smartphone } from 'lucide-react'

interface ItemCarrinho {
  key: string
  produto_id?: number
  celular_id?: number
  descricao: string
  quantidade: number
  preco_unitario: number
  custo_unitario: number
  total: number
  imei?: string
}

const FORMAS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'pix', label: 'PIX', icon: QrCode },
  { id: 'debito', label: 'Débito', icon: CreditCard },
  { id: 'credito', label: 'Crédito', icon: CreditCard },
  { id: 'credito_parcelado', label: 'Crédito Parcelado', icon: CreditCard },
  { id: 'transferencia', label: 'Transferência', icon: Banknote },
]

export default function PDV({ user }: { user: any }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [desconto, setDesconto] = useState(0)
  const [pagamentos, setPagamentos] = useState<{ forma: string; valor: number; parcelas: number }[]>([])
  const [formaAtual, setFormaAtual] = useState('pix')
  const [valorPag, setValorPag] = useState('')
  const [parcelas, setParcelas] = useState(1)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.clientesListar().then(setClientes).catch(console.error)
    inputRef.current?.focus()
  }, [])

  const subtotal = carrinho.reduce((s, i) => s + i.total, 0)
  const total = Math.max(0, subtotal - desconto)
  const totalPago = pagamentos.reduce((s, p) => s + p.valor, 0)
  const falta = total - totalPago

  const buscar = async () => {
    if (!busca.trim()) return
    if (busca.length >= 14) {
      try {
        const cel = await window.api.celularesBuscarPorImei(busca.trim())
        if (cel && cel.status === 'em_estoque') {
          adicionarCelular(cel)
          setBusca('')
          return
        }
      } catch {}
    }
    const prods = await window.api.produtosListar({ busca: busca.trim() })
    const cels = await window.api.celularesListar({ busca: busca.trim(), status: 'em_estoque' })
    setResultados([
      ...cels.map((c: any) => ({ ...c, _tipo: 'celular' })),
      ...prods.filter((p: any) => p.tipo !== 'celular').map((p: any) => ({ ...p, _tipo: 'produto' })),
    ])
  }

  const adicionarCelular = (cel: any) => {
    if (carrinho.some(i => i.celular_id === cel.id)) {
      setMsg('Este aparelho já está no carrinho')
      return
    }
    setCarrinho(prev => [...prev, {
      key: `cel-${cel.id}`,
      celular_id: cel.id,
      produto_id: cel.produto_id,
      descricao: `${cel.marca} ${cel.modelo} ${cel.armazenamento || ''} ${cel.cor || ''}`.trim() + ` (IMEI: ${cel.imei1})`,
      quantidade: 1,
      preco_unitario: cel.preco_venda,
      custo_unitario: cel.custo,
      total: cel.preco_venda,
      imei: cel.imei1,
    }])
    setResultados([])
    setMsg('')
  }

  const adicionarProduto = (prod: any) => {
    const exist = carrinho.find(i => i.produto_id === prod.id && !i.celular_id)
    if (exist) {
      setCarrinho(prev => prev.map(i => i.key === exist.key
        ? { ...i, quantidade: i.quantidade + 1, total: (i.quantidade + 1) * i.preco_unitario }
        : i
      ))
    } else {
      setCarrinho(prev => [...prev, {
        key: `prod-${prod.id}-${Date.now()}`,
        produto_id: prod.id,
        descricao: prod.nome,
        quantidade: 1,
        preco_unitario: prod.preco_venda,
        custo_unitario: prod.custo,
        total: prod.preco_venda,
      }])
    }
    setResultados([])
    setBusca('')
  }

  const removerItem = (key: string) => setCarrinho(prev => prev.filter(i => i.key !== key))

  const addPagamento = () => {
    const v = parseFloat(valorPag.replace(',', '.'))
    if (!v || v <= 0) return
    setPagamentos(prev => [...prev, { forma: formaAtual, valor: v, parcelas: formaAtual === 'credito_parcelado' ? parcelas : 1 }])
    setValorPag('')
  }

  const finalizar = async () => {
    if (carrinho.length === 0) { setMsg('Carrinho vazio'); return }
    if (Math.abs(falta) > 0.01) { setMsg(`Falta pagar ${formatMoney(falta)}`); return }
    setLoading(true)
    setMsg('')
    try {
      const result = await window.api.vendasCriar({
        cliente_id: clienteId,
        usuario_id: user?.id || 1,
        desconto,
        itens: carrinho.map(i => ({
          produto_id: i.produto_id,
          celular_id: i.celular_id,
          descricao: i.descricao,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          custo_unitario: i.custo_unitario,
          total: i.total,
        })),
        pagamentos: pagamentos.map(p => ({
          forma_pagamento: p.forma,
          valor: p.valor,
          parcelas: p.parcelas,
        })),
      })
      setMsg(`Venda ${result.numero} finalizada com sucesso!`)
      setCarrinho([])
      setPagamentos([])
      setDesconto(0)
      setClienteId(null)
      setBusca('')
    } catch (e: any) {
      setMsg(e?.message || 'Erro ao finalizar venda')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PDV - Venda Rápida</h1>
        <span className="text-sm text-slate-500">F3 busca · Enter adiciona</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') buscar() }}
                  placeholder="Buscar produto, código ou IMEI..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
              <button onClick={buscar} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">Buscar</button>
            </div>
            {resultados.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-48 overflow-auto">
                {resultados.map((r: any) => (
                  <button
                    key={r._tipo + r.id}
                    onClick={() => r._tipo === 'celular' ? adicionarCelular(r) : adicionarProduto(r)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex justify-between text-sm border-b last:border-0"
                  >
                    <span>
                      {r._tipo === 'celular' ? (
                        <><Smartphone className="inline w-4 h-4 mr-1" />{r.marca} {r.modelo} — IMEI {r.imei1}</>
                      ) : r.nome}
                    </span>
                    <span className="font-medium">{formatMoney(r.preco_venda || r.preco)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-center px-2 py-3 font-medium">Qtd</th>
                  <th className="text-right px-4 py-3 font-medium">Unit.</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {carrinho.map(item => (
                  <tr key={item.key} className="border-t">
                    <td className="px-4 py-3">{item.descricao}</td>
                    <td className="text-center px-2">{item.celular_id ? 1 : item.quantidade}</td>
                    <td className="text-right px-4">{formatMoney(item.preco_unitario)}</td>
                    <td className="text-right px-4 font-medium">{formatMoney(item.total)}</td>
                    <td>
                      <button onClick={() => removerItem(item.key)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {carrinho.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-slate-400">Nenhum item no carrinho</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-slate-600">Cliente</label>
            <select
              value={clienteId || ''}
              onChange={e => setClienteId(e.target.value ? Number(e.target.value) : null)}
              className="w-full mt-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Cliente avulso</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            <div className="flex justify-between items-center">
              <span>Desconto</span>
              <input type="number" value={desconto || ''} onChange={e => setDesconto(parseFloat(e.target.value) || 0)} className="w-28 text-right border rounded px-2 py-1" />
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span><span className="text-cyan-600">{formatMoney(total)}</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {FORMAS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormaAtual(f.id)}
                  className={`text-xs py-1.5 px-2 rounded border ${formaAtual === f.id ? 'bg-cyan-600 text-white border-cyan-600' : 'hover:bg-slate-50'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={valorPag} onChange={e => setValorPag(e.target.value)} placeholder="Valor" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              {formaAtual === 'credito_parcelado' && (
                <input type="number" min={1} max={18} value={parcelas} onChange={e => setParcelas(parseInt(e.target.value) || 1)} className="w-16 border rounded-lg px-2 py-2 text-sm" />
              )}
              <button onClick={addPagamento} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm"><Plus className="w-4 h-4" /></button>
            </div>
            {pagamentos.length > 0 && (
              <div className="mt-2 space-y-1">
                {pagamentos.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs bg-slate-50 px-2 py-1 rounded">
                    <span>{FORMAS.find(f => f.id === p.forma)?.label}{p.parcelas > 1 ? ` ${p.parcelas}x` : ''}</span>
                    <span className="font-medium">{formatMoney(p.valor)}
                      <button onClick={() => setPagamentos(prev => prev.filter((_, j) => j !== i))} className="ml-2 text-red-500">×</button>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex justify-between text-sm font-medium">
              <span>Falta</span>
              <span className={falta > 0.01 ? 'text-rose-600' : 'text-emerald-600'}>{formatMoney(falta)}</span>
            </div>
          </div>

          {msg && (
            <div className={`text-sm px-3 py-2 rounded-lg ${msg.includes('sucesso') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {msg}
            </div>
          )}

          <button
            onClick={finalizar}
            disabled={loading || carrinho.length === 0}
            className="mt-auto w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? 'Processando...' : 'Finalizar Venda'}
          </button>
        </div>
      </div>
    </div>
  )
}
