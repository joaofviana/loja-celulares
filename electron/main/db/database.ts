import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db: Database.Database | null = null

export function getDbPath(): string {
  const userData = app.getPath('userData')
  return path.join(userData, 'loja-celulares.db')
}

export function getBackupDir(): string {
  const userData = app.getPath('userData')
  const backupDir = path.join(userData, 'backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  return backupDir
}

export function initDatabase(): Database.Database {
  if (db) return db

  const dbPath = getDbPath()
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const schemaPath = path.join(__dirname, 'schema.sql')
  let schema = ''
  try {
    schema = fs.readFileSync(schemaPath, 'utf-8')
  } catch {
    console.warn('Schema file not found at', schemaPath)
  }

  if (schema) {
    db.exec(schema)
  }

  seedIfEmpty(db)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase()
  }
  return db
}

export function closeDatabase() {
  if (db) {
    db.close()
    db = null
  }
}

function seedIfEmpty(database: Database.Database) {
  const count = database.prepare('SELECT COUNT(*) as c FROM usuarios').get() as { c: number }
  if (count.c > 0) return

  database.prepare(`
    INSERT INTO configuracoes (id, nome_loja, cnpj, telefone, taxa_debito, taxa_credito, taxa_credito_parcelado)
    VALUES (1, 'TechCell Loja de Celulares', '12.345.678/0001-99', '(11) 99999-8888', 1.5, 3.5, 4.0)
  `).run()

  database.prepare(`
    INSERT INTO usuarios (nome, usuario, senha_hash, perfil)
    VALUES ('Administrador', 'admin', 'admin123', 'admin')
  `).run()

  database.prepare(`
    INSERT INTO usuarios (nome, usuario, senha_hash, perfil)
    VALUES ('Vendedor Demo', 'vendedor', 'vendedor123', 'vendedor')
  `).run()

  const cats = ['Smartphones', 'Acessórios', 'Capinhas', 'Carregadores', 'Fones de Ouvido', 'Películas']
  const insertCat = database.prepare('INSERT INTO categorias (nome) VALUES (?)')
  for (const c of cats) insertCat.run(c)

  database.prepare(`
    INSERT INTO fornecedores (nome, cnpj, telefone, contato)
    VALUES 
      ('Distribuidora Mobile Brasil', '11.111.111/0001-11', '(11) 3333-4444', 'Carlos'),
      ('Importados Tech', '22.222.222/0001-22', '(11) 5555-6666', 'Ana')
  `).run()

  database.prepare(`
    INSERT INTO clientes (nome, cpf_cnpj, telefone, email)
    VALUES 
      ('João Silva', '123.456.789-00', '(11) 98765-4321', 'joao@email.com'),
      ('Maria Santos', '987.654.321-00', '(11) 91234-5678', 'maria@email.com'),
      ('Pedro Oliveira', '456.789.123-00', '(11) 99876-5432', NULL)
  `).run()

  database.prepare(`
    INSERT INTO produtos (codigo, nome, categoria_id, marca, tipo, custo, preco_venda, estoque_atual, estoque_minimo)
    VALUES 
      ('CAP-001', 'Capinha Silicone Transparente', 3, 'Genérica', 'acessorio', 8.00, 29.90, 50, 10),
      ('CAR-001', 'Carregador Turbo 20W USB-C', 4, 'Anker', 'acessorio', 35.00, 89.90, 30, 5),
      ('FON-001', 'Fone Bluetooth TWS', 5, 'Xiaomi', 'acessorio', 45.00, 129.90, 20, 5),
      ('PEL-001', 'Película de Vidro 3D', 6, 'Genérica', 'acessorio', 5.00, 24.90, 100, 20)
  `).run()

  database.prepare(`
    INSERT INTO produtos (codigo, nome, categoria_id, marca, modelo, tipo, custo, preco_venda, estoque_atual, estoque_minimo)
    VALUES 
      ('CEL-IP15', 'iPhone 15 128GB', 1, 'Apple', 'iPhone 15', 'celular', 3500.00, 4499.00, 0, 2),
      ('CEL-S24', 'Samsung Galaxy S24 256GB', 1, 'Samsung', 'Galaxy S24', 'celular', 2800.00, 3699.00, 0, 2),
      ('CEL-RED13', 'Xiaomi Redmi Note 13 256GB', 1, 'Xiaomi', 'Redmi Note 13', 'celular', 900.00, 1399.00, 0, 3)
  `).run()

  const insertCel = database.prepare(`
    INSERT INTO celulares (produto_id, imei1, imei2, marca, modelo, cor, armazenamento, custo, preco_venda, fornecedor_id, data_entrada, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), 'em_estoque')
  `)

  insertCel.run(5, '356938035643809', '356938035643817', 'Apple', 'iPhone 15', 'Preto', '128GB', 3500, 4499, 1)
  insertCel.run(5, '356938035643825', '356938035643833', 'Apple', 'iPhone 15', 'Azul', '128GB', 3500, 4499, 1)
  insertCel.run(6, '359632078901234', '359632078901242', 'Samsung', 'Galaxy S24', 'Grafite', '256GB', 2800, 3699, 1)
  insertCel.run(6, '359632078901250', '359632078901268', 'Samsung', 'Galaxy S24', 'Violeta', '256GB', 2800, 3699, 2)
  insertCel.run(7, '867530912345678', null, 'Xiaomi', 'Redmi Note 13', 'Preto', '256GB', 900, 1399, 2)
  insertCel.run(7, '867530912345686', null, 'Xiaomi', 'Redmi Note 13', 'Verde', '256GB', 900, 1399, 2)
  insertCel.run(7, '867530912345694', null, 'Xiaomi', 'Redmi Note 13', 'Azul', '256GB', 900, 1399, 2)

  database.prepare(`UPDATE produtos SET estoque_atual = (SELECT COUNT(*) FROM celulares WHERE produto_id = produtos.id AND status = 'em_estoque') WHERE tipo = 'celular'`).run()

  const cels = database.prepare('SELECT id FROM celulares').all() as { id: number }[]
  const insertHist = database.prepare(`
    INSERT INTO historico_celulares (celular_id, acao, descricao, usuario_id)
    VALUES (?, 'entrada', 'Entrada no estoque - cadastro inicial', 1)
  `)
  for (const c of cels) insertHist.run(c.id)

  console.log('Banco de dados inicializado com dados de demonstração.')
}

export function backupDatabase(destPath?: string): string {
  const dbPath = getDbPath()
  const backupDir = destPath || getBackupDir()
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupFile = path.join(backupDir, `backup-loja-${timestamp}.db`)
  
  if (db) {
    db.pragma('wal_checkpoint(TRUNCATE)')
  }
  
  fs.copyFileSync(dbPath, backupFile)
  return backupFile
}

export function restoreDatabase(backupFile: string): boolean {
  if (!fs.existsSync(backupFile)) {
    throw new Error('Arquivo de backup não encontrado')
  }
  closeDatabase()
  const dbPath = getDbPath()
  const safety = dbPath + '.before-restore'
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, safety)
  }
  fs.copyFileSync(backupFile, dbPath)
  initDatabase()
  return true
}
