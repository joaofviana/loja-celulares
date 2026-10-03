-- Schema do Sistema de Gestão Loja de Celulares
-- SQLite local

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS configuracoes (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nome_loja TEXT NOT NULL DEFAULT 'Minha Loja de Celulares',
  cnpj TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  logo_path TEXT,
  taxa_debito REAL DEFAULT 1.5,
  taxa_credito REAL DEFAULT 3.5,
  taxa_credito_parcelado REAL DEFAULT 4.0,
  pasta_backup TEXT,
  backup_automatico INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil TEXT NOT NULL CHECK (perfil IN ('admin', 'gerente', 'vendedor')),
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  contato TEXT,
  observacoes TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  observacoes TEXT,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id INTEGER REFERENCES categorias(id),
  marca TEXT,
  modelo TEXT,
  cor TEXT,
  armazenamento TEXT,
  tipo TEXT NOT NULL DEFAULT 'acessorio' CHECK (tipo IN ('celular', 'acessorio', 'servico')),
  custo REAL NOT NULL DEFAULT 0,
  preco_venda REAL NOT NULL DEFAULT 0,
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 5,
  ativo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS celulares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER REFERENCES produtos(id),
  imei1 TEXT NOT NULL UNIQUE,
  imei2 TEXT,
  numero_serie TEXT,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  cor TEXT,
  armazenamento TEXT,
  custo REAL NOT NULL,
  preco_venda REAL NOT NULL,
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  data_entrada TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'em_estoque' CHECK (status IN ('em_estoque', 'vendido', 'devolvido', 'perda', 'garantia')),
  venda_id INTEGER,
  cliente_id INTEGER REFERENCES clientes(id),
  data_venda TEXT,
  valor_venda REAL,
  observacoes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS historico_celulares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  celular_id INTEGER NOT NULL REFERENCES celulares(id),
  acao TEXT NOT NULL,
  descricao TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  dados_json TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  numero_nota TEXT,
  data_compra TEXT NOT NULL DEFAULT (date('now')),
  valor_total REAL NOT NULL DEFAULT 0,
  desconto REAL DEFAULT 0,
  status TEXT DEFAULT 'confirmada' CHECK (status IN ('rascunho', 'confirmada', 'cancelada')),
  observacoes TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itens_compra (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  celular_id INTEGER REFERENCES celulares(id),
  quantidade INTEGER NOT NULL DEFAULT 1,
  custo_unitario REAL NOT NULL,
  total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS vendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE,
  cliente_id INTEGER REFERENCES clientes(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  data_venda TEXT NOT NULL DEFAULT (datetime('now')),
  subtotal REAL NOT NULL DEFAULT 0,
  desconto REAL DEFAULT 0,
  valor_total REAL NOT NULL DEFAULT 0,
  custo_total REAL DEFAULT 0,
  lucro REAL DEFAULT 0,
  status TEXT DEFAULT 'finalizada' CHECK (status IN ('aberta', 'finalizada', 'cancelada', 'devolvida')),
  observacoes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  celular_id INTEGER REFERENCES celulares(id),
  descricao TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario REAL NOT NULL,
  custo_unitario REAL DEFAULT 0,
  desconto REAL DEFAULT 0,
  total REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS pagamentos_venda (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER NOT NULL REFERENCES vendas(id) ON DELETE CASCADE,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix', 'debito', 'credito', 'credito_parcelado', 'transferencia', 'outros')),
  valor REAL NOT NULL,
  parcelas INTEGER DEFAULT 1,
  taxa REAL DEFAULT 0,
  valor_liquido REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contas_receber (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venda_id INTEGER REFERENCES vendas(id),
  cliente_id INTEGER REFERENCES clientes(id),
  descricao TEXT NOT NULL,
  numero_parcela INTEGER DEFAULT 1,
  total_parcelas INTEGER DEFAULT 1,
  valor REAL NOT NULL,
  valor_pago REAL DEFAULT 0,
  data_vencimento TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado', 'parcial')),
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contas_pagar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fornecedor_id INTEGER REFERENCES fornecedores(id),
  compra_id INTEGER REFERENCES compras(id),
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor REAL NOT NULL,
  valor_pago REAL DEFAULT 0,
  data_vencimento TEXT NOT NULL,
  data_pagamento TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado', 'parcial')),
  forma_pagamento TEXT,
  observacoes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS caixas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_abertura TEXT NOT NULL,
  data_fechamento TEXT,
  valor_inicial REAL NOT NULL DEFAULT 0,
  valor_esperado REAL,
  valor_contado REAL,
  diferenca REAL,
  total_entradas REAL DEFAULT 0,
  total_saidas REAL DEFAULT 0,
  total_vendas REAL DEFAULT 0,
  status TEXT DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado')),
  usuario_abertura_id INTEGER REFERENCES usuarios(id),
  usuario_fechamento_id INTEGER REFERENCES usuarios(id),
  observacoes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caixa_id INTEGER NOT NULL REFERENCES caixas(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor REAL NOT NULL,
  forma_pagamento TEXT,
  venda_id INTEGER REFERENCES vendas(id),
  conta_receber_id INTEGER REFERENCES contas_receber(id),
  conta_pagar_id INTEGER REFERENCES contas_pagar(id),
  usuario_id INTEGER REFERENCES usuarios(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id INTEGER REFERENCES produtos(id),
  celular_id INTEGER REFERENCES celulares(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'venda', 'devolucao', 'perda', 'ajuste')),
  quantidade INTEGER NOT NULL,
  custo_unitario REAL,
  referencia_id INTEGER,
  referencia_tipo TEXT,
  observacoes TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id),
  acao TEXT NOT NULL,
  tabela TEXT,
  registro_id INTEGER,
  dados_anteriores TEXT,
  dados_novos TEXT,
  ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_celulares_imei1 ON celulares(imei1);
CREATE INDEX IF NOT EXISTS idx_celulares_status ON celulares(status);
CREATE INDEX IF NOT EXISTS idx_vendas_data ON vendas(data_venda);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_caixa_caixa ON movimentacoes_caixa(caixa_id);
