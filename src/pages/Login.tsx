import { useState } from 'react'
import { Smartphone } from 'lucide-react'

export default function Login({ onLogin }: { onLogin: (u: any) => void }) {
  const [usuario, setUsuario] = useState('admin')
  const [senha, setSenha] = useState('admin123')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      const u = await window.api.login(usuario, senha)
      onLogin(u)
    } catch (err: any) {
      setErro(err?.message || 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cyan-600 rounded-2xl flex items-center justify-center mb-4">
            <Smartphone className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Loja Celulares</h1>
          <p className="text-slate-500 text-sm mt-1">Sistema de Gestão</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
            />
          </div>
          {erro && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{erro}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Demo: admin / admin123
        </p>
      </div>
    </div>
  )
}
