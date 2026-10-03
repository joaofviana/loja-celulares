export interface Usuario {
  id: number
  nome: string
  usuario: string
  perfil: 'admin' | 'gerente' | 'vendedor'
}

export interface DashboardResumo {
  vendasHoje: number
  qtdVendasHoje: number
  entradas: number
  saidas: number
  saldoCaixa: number
  contasPagar: number
  contasReceber: number
  valorEstoque: number
  custoEstoque: number
  lucroHoje: number
  caixaAberto: boolean
  caixaId?: number
}

declare global {
  interface Window {
    api: {
      dashboardResumo: () => Promise<DashboardResumo>
      produtosListar: (filtros?: any) => Promise<any[]>
      produtosSalvar: (produto: any) => Promise<number>
      celularesListar: (filtros?: any) => Promise<any[]>
      celularesBuscarPorImei: (imei: string) => Promise<any>
      celularesCadastrar: (celular: any) => Promise<number>
      celularesHistorico: (id: number) => Promise<any[]>
      clientesListar: (busca?: string) => Promise<any[]>
      clientesSalvar: (cliente: any) => Promise<number>
      fornecedoresListar: () => Promise<any[]>
      fornecedoresSalvar: (f: any) => Promise<number>
      vendasCriar: (dados: any) => Promise<{ id: number; numero: string }>
      vendasListar: (filtros?: any) => Promise<any[]>
      vendasDetalhe: (id: number) => Promise<any>
      caixaStatus: () => Promise<any>
      caixaAbrir: (valor: number, usuarioId: number) => Promise<number>
      caixaFechar: (dados: any) => Promise<any>
      caixaMovimentacoes: (caixaId: number) => Promise<any[]>
      caixaAdicionarMovimento: (mov: any) => Promise<number>
      contasPagarListar: (filtros?: any) => Promise<any[]>
      contasPagarSalvar: (conta: any) => Promise<number>
      contasPagarPagar: (id: number, valor: number, forma: string) => Promise<boolean>
      contasReceberListar: (filtros?: any) => Promise<any[]>
      contasReceberReceber: (id: number, valor: number, forma: string) => Promise<boolean>
      comprasListar: () => Promise<any[]>
      comprasCriar: (compra: any) => Promise<number>
      relVendasPeriodo: (de: string, ate: string) => Promise<any[]>
      relProdutosMaisVendidos: (de: string, ate: string) => Promise<any[]>
      relFormasPagamento: (de: string, ate: string) => Promise<any[]>
      configObter: () => Promise<any>
      configSalvar: (config: any) => Promise<boolean>
      backupFazer: (pasta?: string) => Promise<string>
      backupRestaurar: () => Promise<{ success: boolean }>
      backupEscolherPasta: () => Promise<string | null>
      categoriasListar: () => Promise<any[]>
      login: (usuario: string, senha: string) => Promise<Usuario>
      usuariosListar: () => Promise<any[]>
    }
  }
}

export {}
