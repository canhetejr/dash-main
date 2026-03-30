# Dashboard de Pesquisa de Satisfação

Dashboard analítico web para visualização e análise de dados de pesquisa de satisfação acadêmica, alimentado por Google Sheets.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS |
| Componentes UI | shadcn/ui + Radix UI |
| Gráficos | Recharts |
| Tabela | TanStack Table |
| Validação | Zod |
| Datas | dayjs |
| Ícones | lucide-react |
| Exportação | SheetJS (xlsx) |
| Fonte de dados | Google Sheets API v4 |

## Funcionalidades

### Visão Executiva
- 8 KPIs com cards temáticos (total de respostas, disciplinas, média geral, satisfação positiva, etc.)

### Filtros Dinâmicos
- Filtro por centro, disciplina, ID, sentimento, data, score
- Busca textual global
- Filtros sincronizados com URL (compartilháveis por link)
- Chips de filtros ativos com remoção individual
- Painel expansível para filtros avançados

### Gráficos
- Respostas por Centro (barras verticais)
- Evolução Temporal (área + linha com duplo eixo Y)
- Distribuição de Sentimento (donut)
- Média por Pergunta (barras horizontais)
- Top 10 Disciplinas (ranking por média)
- Disciplinas com Menor Avaliação (alerta visual)

### Tabela Analítica
- Ordenação por qualquer coluna
- Busca global integrada
- Paginação com seletor de tamanho de página
- Exportação CSV e XLSX dos dados filtrados
- Badges de sentimento com cores semânticas

### Painel de Comentários
- Busca textual nos comentários
- Filtro por sentimento e centro
- Alerta para comentários críticos
- Truncamento inteligente com expandir/recolher
- Carregamento progressivo

### Exportações
- CSV com encoding UTF-8 BOM (compatível com Excel)
- XLSX com abas de dados + resumo executivo
- Relatório executivo em texto

## Arquitetura

```
src/
├── app/
│   ├── layout.tsx                 # Layout raiz
│   ├── page.tsx                   # Redirect → /dashboard
│   ├── dashboard/
│   │   ├── layout.tsx             # Layout do dashboard (header)
│   │   └── page.tsx               # Página principal
│   └── api/
│       └── survey/
│           └── route.ts           # API route (GET)
├── components/
│   ├── ui/                        # Componentes base (shadcn-style)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── skeleton.tsx
│   │   ├── separator.tsx
│   │   ├── tooltip.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── checkbox.tsx
│   └── dashboard/                 # Componentes do dashboard
│       ├── filters-bar.tsx        # Barra de filtros dinâmicos
│       ├── kpi-grid.tsx           # Grid de KPIs executivos
│       ├── charts-section.tsx     # Seção de gráficos
│       ├── data-table.tsx         # Tabela analítica
│       └── comments-panel.tsx     # Painel de comentários
├── lib/
│   ├── sheets.ts                  # Integração Google Sheets
│   ├── mock-data.ts               # Mock para desenvolvimento
│   ├── transform.ts               # Transformação e agregação
│   ├── scoring.ts                 # Regras de scoring
│   ├── filters.ts                 # Lógica de filtros + URL
│   ├── export.ts                  # Exportação CSV/XLSX
│   ├── formatters.ts              # Formatação de dados
│   ├── validations.ts             # Validações Zod
│   ├── constants.ts               # Constantes e configuração
│   └── utils.ts                   # Utilitários (cn)
├── types/
│   ├── survey.ts                  # Tipos do domínio
│   └── dashboard.ts               # Tipos da interface
└── hooks/
    └── use-dashboard-data.ts      # Hook de fetch de dados
```

### Fluxo de Dados

```
Google Sheets → lib/sheets.ts → SurveyRawRow[]
    ↓
lib/transform.ts → SurveyRow[] (com scores, datas, sentimento)
    ↓
lib/filters.ts → SurveyRow[] (filtrado)
    ↓
lib/transform.ts → DashboardData (agregações)
    ↓
API route → JSON response
    ↓
hooks/use-dashboard-data.ts → React components
```

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

### 3. Modo desenvolvimento (dados mock)

Para rodar sem Google Sheets, mantenha no `.env.local`:

```env
USE_MOCK_DATA=true
```

### 4. Modo produção (Google Sheets real)

Configure as variáveis no `.env.local`:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=id_da_sua_planilha
GOOGLE_SHEETS_RANGE=TRATAMENTO!A:L
GOOGLE_SERVICE_ACCOUNT_EMAIL=email@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
USE_MOCK_DATA=false
```

#### Criando uma Service Account no Google Cloud:

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Ative a **Google Sheets API**
4. Vá em **IAM & Admin > Service Accounts**
5. Crie uma service account
6. Gere uma chave JSON
7. Copie o `client_email` e `private_key` para o `.env.local`
8. Compartilhe a planilha com o email da service account (permissão de leitura)

### 5. Executar

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## Regras de Negócio

### Mapeamento de Respostas → Score

| Resposta | Score |
|----------|-------|
| Concordo Totalmente | 5 |
| Concordo Parcialmente | 4 |
| Indiferente | 3 |
| Discordo Parcialmente | 2 |
| Discordo Totalmente | 1 |

### Classificação de Sentimento

| Faixa de Média | Classificação |
|----------------|---------------|
| >= 4.5 | Excelente |
| >= 4.0 | Bom |
| >= 3.0 | Regular |
| < 3.0 | Crítico |

### Métricas Derivadas por Linha

- **averageScore**: Média das 6 questões objetivas
- **positiveAnswers**: Quantidade de respostas com score >= 4
- **positiveRate**: positiveAnswers / 6

## Estrutura da Planilha (aba TRATAMENTO)

| Coluna | Campo |
|--------|-------|
| A | Carimbo de data/hora |
| B | Identificação do Curso |
| C | Satisfação geral (q1) |
| D | Material didático (q2) |
| E | Atividades propostas (q3) |
| F | Videoaulas (q4) |
| G | Mediador (q5) |
| H | Materiais complementares (q6) |
| I | Sugestão/recomendação (texto) |
| J | Disciplina |
| K | ID |
| L | Centro |

## Deploy

Este projeto já está preparado para deploy via **GitHub + Coolify** usando **Dockerfile** (modo `next start` em porta 3000).

## Deploy no Coolify (Docker)

1. Garanta que você subiu o repositório no GitHub **sem** `README` alterado para incluir segredos nem `*.env.local`.
2. No Coolify:
   1. Crie uma aplicação a partir do repositório Git.
   2. Selecione Dockerfile (ele existe na raiz do projeto).
   3. Em **Environment Variables**, configure:
      - `USE_MOCK_DATA` (tipicamente `false` em produção)
      - `GOOGLE_SHEETS_SPREADSHEET_ID`
      - `GOOGLE_SHEETS_RANGE`
      - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
      - `GOOGLE_PRIVATE_KEY` (formato multi-linha; use `\n` ao colar)
      - `GOOGLE_SHEETS_MOODLE_BASE_RANGE` (opcional; padrão `BASE!A:B`)
      - `MOODLE_URL_TEMPLATE` (opcional; fallback caso a aba `BASE` não tenha a URL)
      - `PORT` (opcional; o contêiner já roda em `3000`)
3. Clique em **Deploy**.

### Variáveis de ambiente (resumo)

Obrigatórias (produção, quando `USE_MOCK_DATA=false`):
- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SHEETS_RANGE`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

Recomendadas:
- `GOOGLE_SHEETS_MOODLE_BASE_RANGE` (se sua aba `BASE` usar outro range)
- `MOODLE_URL_TEMPLATE` (se a aba `BASE` não trouxer `id -> url` para algum item)

Opções:
- `USE_MOCK_DATA=true` para rodar com dados mock (útil para testar sem credenciais)

### Troubleshooting rápido

- Se faltar credencial do Google: o app pode falhar ao carregar e/ou cair em mock (dependendo de como `USE_MOCK_DATA` está configurado). Verifique as variáveis relacionadas a `GOOGLE_*`.
- Se alguns links do Moodle não abrirem: verifique `GOOGLE_SHEETS_MOODLE_BASE_RANGE` e/ou `MOODLE_URL_TEMPLATE`.

## Deploy local via Docker (opcional)

1. Crie um `.env.local` a partir do `.env.example` (com `USE_MOCK_DATA=false` e suas credenciais).
2. Build:
   ```bash
   docker build -t dash-survey:local .
   ```
3. Run:
   ```bash
   docker run --rm -p 3000:3000 --env-file .env.local dash-survey:local
   ```

## Notas de Evolução Futura

- [ ] Dark mode completo
- [ ] Drilldown por disciplina (página de detalhe)
- [ ] Exportação PDF com layout formatado
- [ ] Cache server-side com revalidação periódica
- [ ] Autenticação para acesso restrito
- [ ] Comparação temporal (período A vs período B)
- [ ] Dashboard de acompanhamento por centro
- [ ] Heatmap disciplina × pergunta
- [ ] Notificações de avaliações críticas
- [ ] Internacionalização (i18n)
- [ ] Testes unitários e E2E
- [ ] PWA para acesso mobile offline
