# Dashboard de Pesquisa de Satisfação & ERP-Lite

Dashboard analítico de pesquisa acadêmica e sistema ERP-lite com gestão de usuários. Este projeto permite a visualização interativa e análise profunda de dados de pesquisa de satisfação, integrado diretamente ao Supabase para autenticação e banco de dados.

## 1. Visão do Projeto

- **Dashboard Analítico**: Visualização de KPIs executivos, filtros avançados, evolução temporal e análise de sentimento sobre dados de pesquisa acadêmica.
- **ERP-Lite**: Gestão completa de usuários, controle de permissões (Role-Based Access Control) e vinculação de perfis.
- **Integração com Supabase**: Autenticação segura, persistência de dados e aplicação de Row Level Security (RLS) para proteção em nível de banco de dados.

## 2. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 14** (App Router) |
| Linguagem | **TypeScript** (strict mode) |
| Backend/BaaS | **Supabase** (Auth, Postgres, RLS) |
| Estilo | **Tailwind CSS** + shadcn/ui |
| Gráficos | **Recharts** |
| Tabela/Dados | **TanStack Table** |
| Validação | **Zod** |

## 3. Como Rodar

### Pré-requisitos
- Node.js (v18+)
- Conta no Supabase (com projeto configurado)

### Instalação
Clone o repositório e instale as dependências:
```bash
npm install
```

### Variáveis de Ambiente
Copie o arquivo de exemplo e configure com as credenciais do seu projeto Supabase:
```bash
cp .env.example .env.local
```

Preencha as variáveis em `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (apenas para rotas e scripts administrativos)

### Executando em Desenvolvimento
Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000)

### Gerando Build de Produção
Para compilar e otimizar a aplicação:
```bash
npm run build
npm start
```

## 4. Estrutura do Projeto

A organização de pastas segue uma arquitetura baseada em features e boas práticas do Next.js App Router:

```text
src/
├── app/             # Rotas, páginas (Server e Client Components) e Server Actions
├── components/      # Componentes UI reutilizáveis (gráficos, tabelas, layout, shadcn)
├── lib/             # Lógica de negócio, clientes Supabase, transformações e utilitários
└── types/           # Definições de tipagem TypeScript (domínio e interface)

scripts/
├── ingest/          # Scripts de ingestão e processamento inicial de dados (ex: XLSX -> DB)
└── validate/        # Scripts de validação e testes de integridade da base de dados

docs/
└── migrations/      # Histórico de esquemas de banco de dados e migrações do Supabase
```

## 5. Pipeline Analítico (IMPORTANTE)

O coração deste dashboard é um pipeline analítico robusto projetado para não perder a integridade original da pesquisa.

- **Scoring Imutável**: As regras matemáticas e os valores atribuídos às opções Likert são centralizados e imutáveis. O sistema jamais manipula ou "arredonda" pontuações em camadas visuais.
- **Lógica Likert Preservada**: A distribuição Likert e as médias são calculadas seguindo o modelo metodológico original do formulário, garantindo consistência com análises legadas. O cálculo é feito no servidor (ou em tempo de ingestão) assegurando que os dados vistos pelo "Analista" correspondam aos dados consolidados no banco de dados.

## 6. Autenticação e Roles (RBAC)

O controle de acesso utiliza os metadados do **Supabase Auth** juntamente com uma tabela pública segura (`profiles`), garantindo permissões granulares:

- **admin**: Controle total do sistema. Único perfil com capacidade de alterar *roles*, editar ou desativar outros perfis pelo menu de Administração.
- **gestor**: Visão macro da organização. Acesso total aos painéis analíticos do dashboard.
- **analista**: Visão departamental/específica. (Em expansão: limitação visual via Row Level Security (RLS)).
- **viewer**: Acesso apenas-leitura com capacidades restritas.

> Nota sobre `moodle_id` / `external_id`: O campo `moodle_id` nos perfis permite vincular um usuário do dashboard (ex: coordenador) a um ID de curso (`external_id`) nos resultados da pesquisa (survey), permitindo a pré-filtragem automática dos dados apenas para as turmas de interesse daquele usuário.

## 7. Deploy

A aplicação está configurada para build padronizado e deploy em plataformas como Vercel, Coolify ou Docker genérico.

**Passos básicos para deploy:**
1. Configure as variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) no painel de sua hospedagem.
2. Defina o comando de build como `npm run build`.
3. O comando de start será `npm start` (Next.js server).

Para Docker, o repositório conta com um `Dockerfile` e um `docker-compose.yml` pré-configurados que constroem a imagem baseada em Alpine Node para máxima performance.
