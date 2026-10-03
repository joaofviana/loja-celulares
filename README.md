# Loja Celulares - Sistema de Gestão Desktop

Software desktop completo para gerenciamento de loja de celulares e eletrônicos.

## Características

- **100% Offline** - Funciona sem internet, banco SQLite local
- **PDV Rápido** - Venda com busca por IMEI, pagamento misto
- **Controle de IMEI** - Cada celular com histórico individual
- **Caixa Diário** - Abertura, fechamento e conferência
- **Fluxo de Caixa** - Entradas e saídas
- **Contas a Pagar / Receber** - Com parcelas automáticas
- **Estoque** - Alertas de mínimo, custo e margem
- **Relatórios** - Vendas, lucro, formas de pagamento
- **Backup** - Manual e automático
- **Usuários** - Admin, Gerente, Vendedor

## Requisitos para desenvolvimento

- Node.js 18+
- Windows, macOS ou Linux

## Instalação (desenvolvimento)

```bash
cd loja-celulares
npm install
npm run dev
```

## Build do instalador Windows (Setup.exe)

```bash
npm run build:win
```

O instalador será gerado em `release/Setup-LojaCelulares-1.0.0.exe`

Após instalar, o programa aparece no Menu Iniciar e pode criar atalho na área de trabalho.

## Login Demo

- **Admin:** usuario `admin` / senha `admin123`
- **Vendedor:** usuario `vendedor` / senha `vendedor123`

## Estrutura

```
loja-celulares/
├── electron/
│   ├── main/           # Processo principal Electron
│   │   ├── db/         # SQLite schema + database
│   │   ├── ipc.ts      # Handlers de comunicação
│   │   └── index.ts
│   └── preload/        # Bridge segura para o frontend
├── src/
│   ├── pages/          # Telas do sistema
│   ├── components/
│   ├── types/
│   └── App.tsx         # Layout + rotas
├── package.json
└── README.md
```

## Banco de Dados

O arquivo SQLite fica em:
- Windows: `%APPDATA%/loja-celulares/loja-celulares.db`
- Backups: `%APPDATA%/loja-celulares/backups/`

## Atalhos de Teclado

| Tecla | Ação        |
|-------|-------------|
| F2    | PDV / Venda |
| F4    | Caixa       |
| F5    | Atualizar   |
| ESC   | Fechar modal|

## Tecnologias

- Electron
- React + TypeScript
- Tailwind CSS
- better-sqlite3
- Vite
- electron-builder (gerador de Setup.exe)

## Licença

MIT
