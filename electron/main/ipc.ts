import { ipcMain, dialog } from 'electron'
import { getDatabase, backupDatabase, restoreDatabase, getBackupDir } from './db/database'

export function registerIpcHandlers() {
  const db = () => getDatabase()

  ipcMain.handle('dashboard:resumo', () => {
    const d = db()
    const hoje = new Date().toISOString().slice(0, 10)
    const vendasHoje = d.prepare(`SELECT COALESCE(SUM(valor_total), 0) as total, COUNT(*) as qtd FROM vendas WHERE date(data_venda) = ? AND status = 'finalizada'`).get(hoje) as any
    const caixaAberto = d.prepare(`SELECT * FROM caixas WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`).get() as any
    let entradas = 0, saidas = 0, saldoCaixa = 0
    if (caixaAberto) {
      const movs = d.prepare(`SELECT tipo, COALESCE(SUM(valor), 0) as total FROM movimentacoes_caixa WHERE caixa_id = ? GROUP BY tipo`).all(caixaAberto.id) as any[]
      for (const m of movs) { if (m.tipo === 'entrada') entradas = m.total; else saidas = m.total }
      saldoCaixa = (caixaAberto.valor_inicial || 0) + entradas - saidas
    }
    const contasPagar = d.prepare(`SELECT COALESCE(SUM(valor - valor_pago), 0) as total FROM contas_pagar WHERE status IN ('pendente', 'vencido', 'parcial')`).get() as any
    const contasReceber = d.prepare(`SELECT COALESCE(SUM(valor - valor_pago), 0) as total FROM contas_receber WHERE status IN ('pendente', 'vencido', 'parcial')`).get() as any
    const estoque = d.prepare(`SELECT COALESCE(SUM(CASE WHEN tipo = 'celular' THEN 0 ELSE estoque_atual * custo END), 0) + COALESCE((SELECT SUM(custo) FROM celulares WHERE status = 'em_estoque'), 0) as custo_total, COALESCE(SUM(CASE WHEN tipo = 'celular' THEN 0 ELSE estoque_atual * preco_venda END), 0) + COALESCE((SELECT SUM(preco_venda) FROM celulares WHERE status = 'em_estoque'), 0) as valor_venda FROM produtos WHERE ativo = 1`).get() as any
    const lucroHoje = d.prepare(`SELECT COALESCE(SUM(lucro), 0) as total FROM vendas WHERE date(data_venda) = ? AND status = 'finalizada'`).get(hoje) as any
    return { vendasHoje: vendasHoje.total || 0, qtdVendasHoje: vendasHoje.qtd || 0, entradas, saidas, saldoCaixa, contasPagar: contasPagar.total || 0, contasReceber: contasReceber.total || 0, valorEstoque: estoque.valor_venda || 0, custoEstoque: estoque.custo_total || 0, lucroHoje: lucroHoje.total || 0, caixaAberto: !!caixaAberto, caixaId: caixaAberto?.id }
  })

  ipcMain.handle('produtos:listar', (_e, filtros?: any) => {
    let sql = `SELECT p.*, c.nome as categoria_nome FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id WHERE p.ativo = 1`
    const params: any[] = []
    if (filtros?.busca) { sql += ` AND (p.nome LIKE ? OR p.codigo LIKE ? OR p.marca LIKE ?)`; const b = `%${filtros.busca}%`; params.push(b, b, b) }
    if (filtros?.tipo) { sql += ` AND p.tipo = ?`; params.push(filtros.tipo) }
    sql += ' ORDER BY p.nome'
    return db().prepare(sql).all(...params)
  })
  ipcMain.handle('produtos:salvar', (_e, produto: any) => {
    const d = db()
    if (produto.id) {
      d.prepare(`UPDATE produtos SET nome=?, codigo=?, descricao=?, categoria_id=?, marca=?, modelo=?, cor=?, armazenamento=?, tipo=?, custo=?, preco_venda=?, estoque_minimo=?, updated_at=datetime('now') WHERE id=?`).run(produto.nome, produto.codigo, produto.descricao, produto.categoria_id, produto.marca, produto.modelo, produto.cor, produto.armazenamento, produto.tipo, produto.custo, produto.preco_venda, produto.estoque_minimo, produto.id)
      return produto.id
    }
    const r = d.prepare(`INSERT INTO produtos (nome, codigo, descricao, categoria_id, marca, modelo, cor, armazenamento, tipo, custo, preco_venda, estoque_atual, estoque_minimo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(produto.nome, produto.codigo, produto.descricao, produto.categoria_id, produto.marca, produto.modelo, produto.cor, produto.armazenamento, produto.tipo || 'acessorio', produto.custo || 0, produto.preco_venda || 0, produto.estoque_atual || 0, produto.estoque_minimo || 5)
    return r.lastInsertRowid
  })

  ipcMain.handle('celulares:listar', (_e, filtros?: any) => {
    let sql = `SELECT c.*, f.nome as fornecedor_nome, cl.nome as cliente_nome FROM celulares c LEFT JOIN fornecedores f ON f.id = c.fornecedor_id LEFT JOIN clientes cl ON cl.id = c.cliente_id WHERE 1=1`
    const params: any[] = []
    if (filtros?.status) { sql += ' AND c.status = ?'; params.push(filtros.status) }
    if (filtros?.busca) { sql += ` AND (c.imei1 LIKE ? OR c.imei2 LIKE ? OR c.marca LIKE ? OR c.modelo LIKE ?)`; const b = `%${filtros.busca}%`; params.push(b, b, b, b) }
    sql += ' ORDER BY c.created_at DESC'
    return db().prepare(sql).all(...params)
  })
  ipcMain.handle('celulares:buscarPorImei', (_e, imei: string) => db().prepare(`SELECT c.*, f.nome as fornecedor_nome FROM celulares c LEFT JOIN fornecedores f ON f.id = c.fornecedor_id WHERE c.imei1 = ? OR c.imei2 = ?`).get(imei, imei))
  ipcMain.handle('celulares:cadastrar', (_e, celular: any) => {
    const d = db()
    const existe = d.prepare('SELECT id FROM celulares WHERE imei1 = ? OR imei2 = ?').get(celular.imei1, celular.imei1)
    if (existe) throw new Error('IMEI já cadastrado no sistema')
    const r = d.prepare(`INSERT INTO celulares (produto_id, imei1, imei2, numero_serie, marca, modelo, cor, armazenamento, custo, preco_venda, fornecedor_id, data_entrada, status, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_estoque', ?)`).run(celular.produto_id, celular.imei1, celular.imei2 || null, celular.numero_serie || null, celular.marca, celular.modelo, celular.cor, celular.armazenamento, celular.custo, celular.preco_venda, celular.fornecedor_id, celular.data_entrada || new Date().toISOString().slice(0, 10), celular.observacoes)
    const id = r.lastInsertRowid as number
    d.prepare(`INSERT INTO historico_celulares (celular_id, acao, descricao, usuario_id) VALUES (?, 'entrada', ?, ?)`).run(id, `Entrada - Custo R$ ${celular.custo}`, celular.usuario_id || 1)
    if (celular.produto_id) d.prepare(`UPDATE produtos SET estoque_atual = estoque_atual + 1 WHERE id = ?`).run(celular.produto_id)
    return id
  })
  ipcMain.handle('celulares:historico', (_e, celularId: number) => db().prepare(`SELECT h.*, u.nome as usuario_nome FROM historico_celulares h LEFT JOIN usuarios u ON u.id = h.usuario_id WHERE h.celular_id = ? ORDER BY h.created_at DESC`).all(celularId))

  ipcMain.handle('clientes:listar', (_e, busca?: string) => {
    if (busca) return db().prepare(`SELECT * FROM clientes WHERE ativo = 1 AND (nome LIKE ? OR cpf_cnpj LIKE ? OR telefone LIKE ?) ORDER BY nome`).all(`%${busca}%`, `%${busca}%`, `%${busca}%`)
    return db().prepare('SELECT * FROM clientes WHERE ativo = 1 ORDER BY nome').all()
  })
  ipcMain.handle('clientes:salvar', (_e, cliente: any) => {
    const d = db()
    if (cliente.id) { d.prepare(`UPDATE clientes SET nome=?, cpf_cnpj=?, telefone=?, email=?, endereco=?, cidade=?, observacoes=? WHERE id=?`).run(cliente.nome, cliente.cpf_cnpj, cliente.telefone, cliente.email, cliente.endereco, cliente.cidade, cliente.observacoes, cliente.id); return cliente.id }
    return d.prepare(`INSERT INTO clientes (nome, cpf_cnpj, telefone, email, endereco, cidade, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(cliente.nome, cliente.cpf_cnpj, cliente.telefone, cliente.email, cliente.endereco, cliente.cidade, cliente.observacoes).lastInsertRowid
  })

  ipcMain.handle('fornecedores:listar', () => db().prepare('SELECT * FROM fornecedores WHERE ativo = 1 ORDER BY nome').all())
  ipcMain.handle('fornecedores:salvar', (_e, f: any) => {
    const d = db()
    if (f.id) { d.prepare(`UPDATE fornecedores SET nome=?, cnpj=?, telefone=?, email=?, endereco=?, contato=?, observacoes=? WHERE id=?`).run(f.nome, f.cnpj, f.telefone, f.email, f.endereco, f.contato, f.observacoes, f.id); return f.id }
    return d.prepare(`INSERT INTO fornecedores (nome, cnpj, telefone, email, endereco, contato, observacoes) VALUES (?,?,?,?,?,?,?)`).run(f.nome, f.cnpj, f.telefone, f.email, f.endereco, f.contato, f.observacoes).lastInsertRowid
  })

  ipcMain.handle('vendas:listar', (_e, filtros?: any) => {
    let sql = `SELECT v.*, c.nome as cliente_nome, u.nome as vendedor_nome FROM vendas v LEFT JOIN clientes c ON c.id = v.cliente_id LEFT JOIN usuarios u ON u.id = v.usuario_id WHERE v.status = 'finalizada'`
    const params: any[] = []
    if (filtros?.de) { sql += ' AND date(v.data_venda) >= ?'; params.push(filtros.de) }
    if (filtros?.ate) { sql += ' AND date(v.data_venda) <= ?'; params.push(filtros.ate) }
    sql += ' ORDER BY v.data_venda DESC LIMIT 200'
    return db().prepare(sql).all(...params)
  })
  ipcMain.handle('vendas:detalhe', (_e, id: number) => {
    const venda = db().prepare(`SELECT v.*, c.nome as cliente_nome FROM vendas v LEFT JOIN clientes c ON c.id = v.cliente_id WHERE v.id = ?`).get(id)
    const itens = db().prepare(`SELECT i.*, p.nome as produto_nome, cel.imei1 FROM itens_venda i LEFT JOIN produtos p ON p.id = i.produto_id LEFT JOIN celulares cel ON cel.id = i.celular_id WHERE i.venda_id = ?`).all(id)
    const pagamentos = db().prepare('SELECT * FROM pagamentos_venda WHERE venda_id = ?').all(id)
    return { venda, itens, pagamentos }
  })

  ipcMain.handle('caixa:status', () => db().prepare(`SELECT * FROM caixas WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`).get())
  ipcMain.handle('caixa:abrir', (_e, valorInicial: number, usuarioId: number) => {
    const d = db()
    if (d.prepare(`SELECT id FROM caixas WHERE status = 'aberto'`).get()) throw new Error('Já existe um caixa aberto')
    return d.prepare(`INSERT INTO caixas (data_abertura, valor_inicial, status, usuario_abertura_id) VALUES (datetime('now'), ?, 'aberto', ?)`).run(valorInicial, usuarioId).lastInsertRowid
  })
  ipcMain.handle('caixa:fechar', (_e, dados: any) => {
    const d = db()
    const caixa = d.prepare(`SELECT * FROM caixas WHERE id = ? AND status = 'aberto'`).get(dados.caixaId) as any
    if (!caixa) throw new Error('Caixa não encontrado ou já fechado')
    const movs = d.prepare(`SELECT tipo, forma_pagamento, SUM(valor) as total FROM movimentacoes_caixa WHERE caixa_id = ? GROUP BY tipo, forma_pagamento`).all(dados.caixaId) as any[]
    let totalEntradas = 0, totalSaidas = 0
    const porForma: Record<string, number> = {}
    for (const m of movs) {
      if (m.tipo === 'entrada') { totalEntradas += m.total; porForma[m.forma_pagamento || 'outros'] = (porForma[m.forma_pagamento || 'outros'] || 0) + m.total }
      else totalSaidas += m.total
    }
    const esperado = caixa.valor_inicial + totalEntradas - totalSaidas
    const diferenca = (dados.valorContado || 0) - esperado
    d.prepare(`UPDATE caixas SET data_fechamento=datetime('now'), valor_esperado=?, valor_contado=?, diferenca=?, total_entradas=?, total_saidas=?, status='fechado', usuario_fechamento_id=?, observacoes=? WHERE id=?`).run(esperado, dados.valorContado, diferenca, totalEntradas, totalSaidas, dados.usuarioId, dados.observacoes || null, dados.caixaId)
    return { esperado, contado: dados.valorContado, diferenca, totalEntradas, totalSaidas, porForma }
  })
  ipcMain.handle('caixa:movimentacoes', (_e, caixaId: number) => db().prepare(`SELECT m.*, u.nome as usuario_nome FROM movimentacoes_caixa m LEFT JOIN usuarios u ON u.id = m.usuario_id WHERE m.caixa_id = ? ORDER BY m.created_at DESC`).all(caixaId))
  ipcMain.handle('caixa:adicionarMovimento', (_e, mov: any) => {
    const d = db()
    const caixa = d.prepare(`SELECT id FROM caixas WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`).get() as any
    if (!caixa) throw new Error('Nenhum caixa aberto')
    return d.prepare(`INSERT INTO movimentacoes_caixa (caixa_id, tipo, categoria, descricao, valor, forma_pagamento, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(caixa.id, mov.tipo, mov.categoria, mov.descricao, mov.valor, mov.forma_pagamento || null, mov.usuario_id || 1).lastInsertRowid
  })

  ipcMain.handle('contasPagar:listar', (_e, filtros?: any) => {
    let sql = `SELECT cp.*, f.nome as fornecedor_nome FROM contas_pagar cp LEFT JOIN fornecedores f ON f.id = cp.fornecedor_id WHERE 1=1`
    const params: any[] = []
    if (filtros?.status) { sql += ' AND cp.status = ?'; params.push(filtros.status) }
    sql += ' ORDER BY cp.data_vencimento'
    return db().prepare(sql).all(...params)
  })
  ipcMain.handle('contasPagar:salvar', (_e, conta: any) => {
    const d = db()
    if (conta.id) { d.prepare(`UPDATE contas_pagar SET descricao=?, fornecedor_id=?, categoria=?, valor=?, data_vencimento=?, status=?, observacoes=? WHERE id=?`).run(conta.descricao, conta.fornecedor_id, conta.categoria, conta.valor, conta.data_vencimento, conta.status, conta.observacoes, conta.id); return conta.id }
    return d.prepare(`INSERT INTO contas_pagar (descricao, fornecedor_id, categoria, valor, data_vencimento, status, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(conta.descricao, conta.fornecedor_id, conta.categoria, conta.valor, conta.data_vencimento, conta.status || 'pendente', conta.observacoes).lastInsertRowid
  })
  ipcMain.handle('contasPagar:pagar', (_e, id: number, valorPago: number, forma: string) => {
    const d = db()
    const conta = d.prepare('SELECT * FROM contas_pagar WHERE id = ?').get(id) as any
    if (!conta) throw new Error('Conta não encontrada')
    const novoPago = (conta.valor_pago || 0) + valorPago
    const status = novoPago >= conta.valor ? 'pago' : 'parcial'
    d.prepare(`UPDATE contas_pagar SET valor_pago=?, data_pagamento=date('now'), status=?, forma_pagamento=? WHERE id=?`).run(novoPago, status, forma, id)
    const caixa = d.prepare(`SELECT id FROM caixas WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`).get() as any
    if (caixa) d.prepare(`INSERT INTO movimentacoes_caixa (caixa_id, tipo, categoria, descricao, valor, forma_pagamento, conta_pagar_id) VALUES (?, 'saida', ?, ?, ?, ?, ?)`).run(caixa.id, conta.categoria || 'pagamento', `Pagamento: ${conta.descricao}`, valorPago, forma, id)
    return true
  })

  ipcMain.handle('contasReceber:listar', (_e, filtros?: any) => {
    let sql = `SELECT cr.*, c.nome as cliente_nome FROM contas_receber cr LEFT JOIN clientes c ON c.id = cr.cliente_id WHERE 1=1`
    const params: any[] = []
    if (filtros?.status) { sql += ' AND cr.status = ?'; params.push(filtros.status) }
    sql += ' ORDER BY cr.data_vencimento'
    return db().prepare(sql).all(...params)
  })
  ipcMain.handle('contasReceber:receber', (_e, id: number, valor: number, forma: string) => {
    const d = db()
    const conta = d.prepare('SELECT * FROM contas_receber WHERE id = ?').get(id) as any
    if (!conta) throw new Error('Conta não encontrada')
    const novoPago = (conta.valor_pago || 0) + valor
    const status = novoPago >= conta.valor ? 'pago' : 'parcial'
    d.prepare(`UPDATE contas_receber SET valor_pago=?, data_pagamento=date('now'), status=?, forma_pagamento=? WHERE id=?`).run(novoPago, status, forma, id)
    const caixa = d.prepare(`SELECT id FROM caixas WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`).get() as any
    if (caixa) d.prepare(`INSERT INTO movimentacoes_caixa (caixa_id, tipo, categoria, descricao, valor, forma_pagamento, conta_receber_id) VALUES (?, 'entrada', 'recebimento', ?, ?, ?, ?)`).run(caixa.id, `Recebimento: ${conta.descricao}`, valor, forma, id)
    return true
  })

  ipcMain.handle('compras:listar', () => db().prepare(`SELECT c.*, f.nome as fornecedor_nome FROM compras c LEFT JOIN fornecedores f ON f.id = c.fornecedor_id ORDER BY c.data_compra DESC LIMIT 100`).all())
  ipcMain.handle('compras:criar', (_e, compra: any) => {
    const d = db()
    return d.transaction(() => {
      const r = d.prepare(`INSERT INTO compras (fornecedor_id, numero_nota, data_compra, valor_total, desconto, status, observacoes, usuario_id) VALUES (?, ?, ?, ?, ?, 'confirmada', ?, ?)`).run(compra.fornecedor_id, compra.numero_nota, compra.data_compra || new Date().toISOString().slice(0, 10), compra.valor_total, compra.desconto || 0, compra.observacoes, compra.usuario_id || 1)
      const compraId = r.lastInsertRowid as number
      for (const item of compra.itens || []) {
        d.prepare(`INSERT INTO itens_compra (compra_id, produto_id, celular_id, quantidade, custo_unitario, total) VALUES (?, ?, ?, ?, ?, ?)`).run(compraId, item.produto_id || null, item.celular_id || null, item.quantidade, item.custo_unitario, item.total)
        if (item.produto_id && !item.celular_id) d.prepare(`UPDATE produtos SET estoque_atual = estoque_atual + ?, custo = ? WHERE id = ?`).run(item.quantidade, item.custo_unitario, item.produto_id)
      }
      if (compra.gerar_conta_pagar) d.prepare(`INSERT INTO contas_pagar (fornecedor_id, compra_id, descricao, categoria, valor, data_vencimento, status) VALUES (?, ?, ?, 'compra', ?, ?, 'pendente')`).run(compra.fornecedor_id, compraId, `Compra ${compra.numero_nota || compraId}`, compra.valor_total, compra.data_vencimento || new Date().toISOString().slice(0, 10))
      return compraId
    })()
  })

  ipcMain.handle('relatorios:vendasPeriodo', (_e, de: string, ate: string) => db().prepare(`SELECT date(data_venda) as data, COUNT(*) as qtd, SUM(valor_total) as total, SUM(lucro) as lucro FROM vendas WHERE status = 'finalizada' AND date(data_venda) BETWEEN ? AND ? GROUP BY date(data_venda) ORDER BY data`).all(de, ate))
  ipcMain.handle('relatorios:produtosMaisVendidos', (_e, de: string, ate: string) => db().prepare(`SELECT COALESCE(p.nome, i.descricao) as nome, SUM(i.quantidade) as qtd, SUM(i.total) as total FROM itens_venda i JOIN vendas v ON v.id = i.venda_id LEFT JOIN produtos p ON p.id = i.produto_id WHERE v.status = 'finalizada' AND date(v.data_venda) BETWEEN ? AND ? GROUP BY COALESCE(p.nome, i.descricao) ORDER BY qtd DESC LIMIT 20`).all(de, ate))
  ipcMain.handle('relatorios:formasPagamento', (_e, de: string, ate: string) => db().prepare(`SELECT pv.forma_pagamento, COUNT(*) as qtd, SUM(pv.valor) as total FROM pagamentos_venda pv JOIN vendas v ON v.id = pv.venda_id WHERE v.status = 'finalizada' AND date(v.data_venda) BETWEEN ? AND ? GROUP BY pv.forma_pagamento`).all(de, ate))

  ipcMain.handle('config:obter', () => db().prepare('SELECT * FROM configuracoes WHERE id = 1').get())
  ipcMain.handle('config:salvar', (_e, config: any) => {
    db().prepare(`UPDATE configuracoes SET nome_loja=?, cnpj=?, endereco=?, telefone=?, email=?, taxa_debito=?, taxa_credito=?, taxa_credito_parcelado=?, pasta_backup=?, backup_automatico=?, updated_at=datetime('now') WHERE id=1`).run(config.nome_loja, config.cnpj, config.endereco, config.telefone, config.email, config.taxa_debito, config.taxa_credito, config.taxa_credito_parcelado, config.pasta_backup, config.backup_automatico ? 1 : 0)
    return true
  })

  ipcMain.handle('backup:fazer', async (_e, pasta?: string) => backupDatabase(pasta || getBackupDir()))
  ipcMain.handle('backup:restaurar', async () => {
    const result = await dialog.showOpenDialog({ title: 'Selecionar backup para restaurar', filters: [{ name: 'Banco de dados', extensions: ['db'] }], properties: ['openFile'] })
    if (result.canceled || !result.filePaths[0]) return { success: false }
    restoreDatabase(result.filePaths[0])
    return { success: true }
  })
  ipcMain.handle('backup:escolherPasta', async () => {
    const result = await dialog.showOpenDialog({ title: 'Escolher pasta de backup', properties: ['openDirectory'] })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('categorias:listar', () => db().prepare('SELECT * FROM categorias ORDER BY nome').all())
  ipcMain.handle('auth:login', (_e, usuario: string, senha: string) => {
    const u = db().prepare('SELECT id, nome, usuario, perfil FROM usuarios WHERE usuario = ? AND senha_hash = ? AND ativo = 1').get(usuario, senha) as any
    if (!u) throw new Error('Usuário ou senha inválidos')
    return u
  })
  ipcMain.handle('usuarios:listar', () => db().prepare('SELECT id, nome, usuario, perfil, ativo FROM usuarios ORDER BY nome').all())

  // vendas:criar - critical for PDV
  ipcMain.handle('vendas:criar', (_e, dados: any) => {
    const d = db()
    return d.transaction(() => {
      const last = d.prepare(`SELECT numero FROM vendas ORDER BY id DESC LIMIT 1`).get() as any
      let num = 1
      if (last?.numero) { const n = parseInt(last.numero.replace(/\D/g, ''), 10); if (!isNaN(n)) num = n + 1 }
      const numero = `V${String(num).padStart(6, '0')}`
      let custoTotal = 0, subtotal = 0
      for (const item of dados.itens) { subtotal += item.total; custoTotal += (item.custo_unitario || 0) * item.quantidade }
      const desconto = dados.desconto || 0
      const valorTotal = subtotal - desconto
      const lucro = valorTotal - custoTotal
      const r = d.prepare(`INSERT INTO vendas (numero, cliente_id, usuario_id, data_venda, subtotal, desconto, valor_total, custo_total, lucro, status, observacoes) VALUES (?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, 'finalizada', ?)`).run(numero, dados.cliente_id || null, dados.usuario_id || 1, subtotal, desconto, valorTotal, custoTotal, lucro, dados.observacoes || null)
      const vendaId = r.lastInsertRowid as number
      for (const item of dados.itens) {
        d.prepare(`INSERT INTO itens_venda (venda_id, produto_id, celular_id, descricao, quantidade, preco_unitario, custo_unitario, desconto, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(vendaId, item.produto_id || null, item.celular_id || null, item.descricao, item.quantidade, item.preco_unitario, item.custo_unitario || 0, item.desconto || 0, item.total)
        if (item.celular_id) {
          const cel = d.prepare('SELECT status FROM celulares WHERE id = ?').get(item.celular_id) as any
          if (cel?.status !== 'em_estoque') throw new Error('Celular IMEI já não está disponível')
          d.prepare(`UPDATE celulares SET status='vendido', venda_id=?, cliente_id=?, data_venda=date('now'), valor_venda=?, updated_at=datetime('now') WHERE id=?`).run(vendaId, dados.cliente_id || null, item.preco_unitario, item.celular_id)
          d.prepare(`INSERT INTO historico_celulares (celular_id, acao, descricao, usuario_id) VALUES (?, 'venda', ?, ?)`).run(item.celular_id, `Vendido - Venda ${numero}`, dados.usuario_id || 1)
          if (item.produto_id) d.prepare(`UPDATE produtos SET estoque_atual = MAX(0, estoque_atual - 1) WHERE id = ?`).run(item.produto_id)
        } else if (item.produto_id) {
          d.prepare(`UPDATE produtos SET estoque_atual = MAX(0, estoque_atual - ?) WHERE id = ?`).run(item.quantidade, item.produto_id)
        }
      }
      for (const pag of dados.pagamentos) {
        d.prepare(`INSERT INTO pagamentos_venda (venda_id, forma_pagamento, valor, parcelas, taxa, valor_liquido) VALUES (?, ?, ?, ?, ?, ?)`).run(vendaId, pag.forma_pagamento, pag.valor, pag.parcelas || 1, pag.taxa || 0, pag.valor - (pag.taxa || 0))
        if (pag.forma_pagamento === 'credito_parcelado' && (pag.parcelas || 1) > 1) {
          const valorParcela = pag.valor / pag.parcelas
          for (let i = 1; i <= pag.parcelas; i++) {
            const venc = new Date(); venc.setMonth(venc.getMonth() + i)
            d.prepare(`INSERT INTO contas_receber (venda_id, cliente_id, descricao, numero_parcela, total_parcelas, valor, data_vencimento, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')`).run(vendaId, dados.cliente_id, `Parcela ${i}/${pag.parcelas} - Venda ${numero}`, i, pag.parcelas, valorParcela, venc.toISOString().slice(0, 10))
          }
        }
      }
      const caixa = d.prepare(`SELECT id FROM caixas WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`).get() as any
      if (caixa) {
        for (const pag of dados.pagamentos) {
          if (['dinheiro', 'pix', 'debito', 'transferencia'].includes(pag.forma_pagamento)) {
            d.prepare(`INSERT INTO movimentacoes_caixa (caixa_id, tipo, categoria, descricao, valor, forma_pagamento, venda_id, usuario_id) VALUES (?, 'entrada', 'venda', ?, ?, ?, ?, ?)`).run(caixa.id, `Venda ${numero}`, pag.valor, pag.forma_pagamento, vendaId, dados.usuario_id || 1)
          }
        }
      }
      return { id: vendaId, numero }
    })()
  })
}
