# Contexto Operacional — Antigravity
## Dashboard Pesquisa da Disciplina — MVP Sprint

> **Fonte de verdade:** `PLANEJAMENTO/Setup ` (10 documentos lidos e consolidados)
> **Data de geração:** 2026-04-18
> **Escopo:** Consolidação de contexto operacional. Não avançar para UI, auth ou dashboard sem cumprir a ordem do sprint.

---

## 1. Arquivos Lidos e Contribuição de Cada Um

| # | Arquivo | Contribuição Principal |
|---|---------|----------------------|
| 1 | `#pesctag - Workflows do Antigravity.docx` | 9 workflows completos com sequência, objetivo e critério de sucesso |
| 2 | `Antigravity Skills e Contexto - Dashboard Pesquisa da Disciplina.docx` | Documento-mestre de contexto: missão, regra principal, stack, skills resumidas, ordem do sprint, critério de pronto |
| 3 | `Arquitetura do Projeto - Dashboard Pesquisa da Disciplina.docx` | Rules do editor: regras globais, de arquitetura, código, dados, autenticação, UX/UI e definição de pronto |
| 4 | `Cronograma Detalhado - Sprint MVP Dashboard Pesquisa da Disciplina.docx` | Cronograma bloco a bloco (14 blocos, sábado + domingo), checkpoints obrigatórios, prioridades absolutas |
| 5 | `Planejamento Dashboard Pesquisa da Disciplina.docx` | Histórico de decisões, diagnóstico do sistema atual, pendências críticas antes da execução, stack confirmada |
| 6 | `Pontos Críticos do Planejamento - MVP Dashboard Pesquisa da Disciplina.docx` | 14 pontos de risco e decisões que devem estar congeladas, critério de corte, papel do Antigravity |
| 7 | `Relatório - MVP Piloto Dashboard Pesquisa da Disciplina.docx` | Relatório executivo do piloto: decisões centrais, escopo congelado, regra de ouro, critério de sucesso |
| 8 | `Relatório Detalhado_ Automação e Inovação UniCV - Luiz.docx` | Contexto estratégico da UniCV: Fábrica de Conteúdos, ENADE, automações n8n — fora do escopo do sprint |
| 9 | `Relatório Técnico - Repositório dash-main.docx` | Diagnóstico técnico completo do repositório atual: stack, fluxo de dados, scoring, filtros, exportações |
| 10 | `Skills do Antigravity.docx` | 10 skills detalhadas com objetivo, comportamento e ação esperada + skill meta com pergunta de decisão |

---

## 2. Missão do Projeto

Refatorar o dashboard atual da Pesquisa da Disciplina para um **MVP novo, autenticado e conectado ao Supabase**, preservando **exatamente** a lógica analítica do sistema atual.

### Regra Principal (inegociável)

> A interface pode mudar.
> A arquitetura pode mudar.
> O banco pode mudar.
> **Os números não podem mudar.**

---

## 3. Stack Oficial do MVP (congelada)

```
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui + Radix UI
- Supabase (banco de dados)
- Supabase Auth (autenticação)
- Recharts (gráficos)
- TanStack Table (tabela)
- Zod (validação)
```

> **Fora do sprint:** Prisma, Docker/VPS, RBAC, híbrido completo, automações avançadas, MCP de VPS.

---

## 4. Schema Mínimo do Banco (Supabase)

| Campo | Descrição |
|-------|-----------|
| `timestamp` / `submitted_at` | Carimbo de data/hora |
| `course_label` | Identificação do Curso |
| `disciplina` | Nome da disciplina |
| `id` / `external_id` | ID externo |
| `centro` | Centro acadêmico |
| `q1` | Satisfação geral |
| `q2` | Material didático |
| `q3` | Atividades propostas |
| `q4` | Videoaulas |
| `q5` | Mediador |
| `q6` | Materiais complementares |
| `suggestion` | Sugestão/recomendação (texto livre) |

---

## 5. Lógica de Scoring (preservar sem alterar)

### Mapeamento Likert → Número

| Resposta | Valor |
|----------|-------|
| Concordo Totalmente | 5 |
| Concordo Parcialmente | 4 |
| Indiferente | 3 |
| Discordo Parcialmente | 2 |
| Discordo Totalmente | 1 |

### Classificação Agregada

| Faixa de Média | Classificação |
|----------------|---------------|
| >= 4.5 | Excelente |
| >= 4.0 | Bom |
| >= 3.0 | Regular |
| < 3.0 | Crítico |

### Cálculos obrigatórios por linha

- Score numérico para cada uma das 6 perguntas
- Média Likert da linha
- Quantidade e taxa de respostas favoráveis, neutras e desfavoráveis
- Classificação agregada por sentimento
- Normalização de centro

> **Localização no sistema atual:** `src/lib/scoring.ts` e `src/lib/transform.ts`

---

## 6. Checklist de Equivalência Analítica

O MVP só é válido se **todos** estes itens baterem com o sistema atual:

- [ ] Total de respostas
- [ ] Média Likert geral
- [ ] Favorável, neutro e desfavorável (percentuais)
- [ ] Classificação agregada
- [ ] Média por pergunta (q1 a q6)
- [ ] Pelo menos um agrupamento por **centro**
- [ ] Pelo menos um agrupamento por **disciplina**

> **Regra:** Qualquer divergência = bloqueio. Corrigir antes de avançar.

---

## 7. Regras Operacionais Consolidadas

### 7.1 Regras Globais

1. **Preservação analítica** — nunca alterar scoring, thresholds ou mapeamento Likert sem validação explícita
2. **Foco no MVP** — priorizar entrega funcional; evitar overengineering; não abrir frentes paralelas
3. **Simplicidade operacional** — preferir soluções simples, legíveis e rápidas de validar
4. **Não inventar regra de negócio** — reaproveitar a lógica existente; não reinterpretar o produto

### 7.2 Regras de Arquitetura

- O MVP lê dados **exclusivamente do Supabase** no piloto
- O piloto **não depende** do fluxo híbrido completo nesta etapa
- **Camadas:** dados (Supabase) → transformação (scoring/agregação) → autenticação (Supabase Auth) → apresentação (dashboard)
- Componente visual **não** contém regra de negócio complexa
- Scoring fica **isolado** em camada de lógica (não misturar com UI)
- Transformação e agregação são **separadas** da UI

### 7.3 Regras de Código

- Linguagem: **TypeScript**
- Tipar tudo que envolver dados da pesquisa
- Funções puras para transformação sempre que possível
- Evitar lógica espalhada em múltiplos arquivos sem necessidade
- Documentar decisões importantes em comentários curtos quando necessário

### 7.4 Regras de Dados

- Usar estrutura mínima suficiente para o piloto (não travar tentando modelagem ideal)
- Garantir campos essenciais do dashboard disponíveis
- Validar dados antes de considerar MVP concluído
- Qualquer dado novo exibido deve ser comparável ao sistema atual

### 7.5 Regras de Autenticação

- Usar **Supabase Auth**
- Login por **e-mail e senha**
- **Um único perfil** de acesso no MVP
- Dashboard protegido por login
- **Não implementar** RBAC, permissões complexas, SSO, autenticação institucional

### 7.6 Regras de UX/UI

- Priorizar leitura executiva
- Manter interface clara e sem ruído visual
- Destacar KPIs principais
- Estados de loading, vazio e erro devem ser considerados
- A interface precisa ficar **melhor que a atual**, sem sacrificar confiabilidade

### 7.7 Papel Correto do Antigravity

| Papel correto | Papel incorreto |
|---------------|-----------------|
| Estruturar e gerar código | Redefinir scoring |
| Ajudar no setup | Reinterpretar o produto |
| Apoiar validação | Inventar arquitetura fora do escopo |
| Organizar componentes | Abrir frentes paralelas |

---

## 8. Skills Consolidadas (10 + Meta)

### Skill 1 — Preservação Analítica
**Objetivo:** Garantir que nenhuma alteração quebre a lógica de scoring e os resultados atuais.
- Nunca alterar regras de scoring sem instrução explícita
- Manter exatamente o mapeamento Likert → número e thresholds de classificação
- Tratar divergência de números como **erro crítico**
- Comparar resultados antes e depois de mudanças; bloquear alterações que mudem médias, percentuais ou classificações

### Skill 2 — Leitura do Sistema Atual
**Objetivo:** Entender e reaproveitar o que já existe antes de propor mudanças.
- Ler código existente antes de sugerir refatoração
- Identificar lógica crítica de scoring, transformação e filtros; evitar recriar do zero

### Skill 3 — Setup Next.js + Supabase
**Objetivo:** Configurar rapidamente o ambiente funcional do MVP.
- Criar estrutura mínima funcional; configurar Supabase client e variáveis de ambiente
- Garantir que o app sobe localmente; validar leitura de dados

### Skill 4 — Modelagem MVP
**Objetivo:** Criar estrutura mínima de dados sem travar o sprint.
- Evitar modelagem excessiva; criar tabela única funcional com compatibilidade ao scoring
- Validar dados após inserção

### Skill 5 — Ingestão de Dados
**Objetivo:** Levar dados reais para o Supabase corretamente.
- Validar dados antes de usar; garantir integridade das colunas e encoding
- Conferir contagem de registros e validar amostra manualmente

### Skill 6 — Transformação e Scoring
**Objetivo:** Aplicar a lógica analítica no novo sistema.
- Isolar scoring em funções; não misturar com UI; manter funções puras
- Converter respostas em score, calcular médias, favorável/neutro/desfavorável, classificar

### Skill 7 — Dashboard MVP
**Objetivo:** Montar a interface mínima funcional.
- Priorizar clareza; evitar excesso visual; focar em leitura rápida
- Criar KPIs principais, gráficos essenciais, tabela básica, filtros simples

### Skill 8 — Autenticação Simples
**Objetivo:** Proteger o dashboard sem complexidade.
- Usar Supabase Auth; único tipo de usuário; sem RBAC
- Implementar login e-mail/senha, proteger rota do dashboard, logout

### Skill 9 — Validação do MVP
**Objetivo:** Garantir que o sistema novo é confiável.
- Comparar sempre com o sistema atual; tratar divergência como bloqueio
- Validar total, média geral, distribuição de sentimento, agrupamentos; corrigir antes de avançar

### Skill 10 — Foco de Sprint
**Objetivo:** Evitar perda de tempo e escopo.
- Ignorar tudo que não ajuda a entregar o MVP; cortar complexidade
- Rejeitar overengineering, features secundárias e automações paralelas

### Skill Meta — Regra de Decisão
> **Antes de qualquer ação:** *"Isso ajuda a entregar Supabase + scoring preservado + dashboard funcional?"*
> - **Sim** → executa | **Não** → fica fora do sprint

---

## 9. Workflows Consolidados

### Workflow 1 — Setup do Projeto
**Objetivo:** Subir o ambiente com o mínimo de atrito.
1. Abrir projeto base / branch do MVP
2. Instalar dependências
3. Configurar `.env.local` com variáveis do Supabase
4. Validar execução local (`npm run dev`)
5. Confirmar acesso ao Supabase
6. Confirmar estrutura inicial do projeto

**Critério:** projeto sobe, variáveis configuradas, Supabase acessível.

### Workflow 2 — Banco e Dados
**Objetivo:** Colocar a base mínima do piloto no ar.
1. Criar estrutura mínima no Supabase (schema acima)
2. Preparar tabela do piloto
3. Importar dados (snapshot congelado ou recorte controlado)
4. Validar contagem de registros
5. Conferir amostra manualmente
6. Corrigir inconsistências antes de seguir

**Critério:** dados no banco, campos críticos preenchidos, base coerente para scoring.

### Workflow 3 — Preservação do Scoring
**Objetivo:** Garantir equivalência analítica com o sistema atual.
1. Localizar lógica atual (`src/lib/scoring.ts`, `transform.ts`)
2. Reaproveitar ou portar **sem reinterpretar**
3. Congelar mapping Likert e thresholds
4. Validar médias e percentuais
5. Comparar com sistema atual

**Critério:** scoring preservado, números equivalentes.

### Workflow 4 — Transformação e Agregação
**Objetivo:** Transformar dados do banco em dados prontos para o dashboard.
1. Ler dados do Supabase
2. Aplicar transformação (reaproveitar `transform.ts`)
3. Calcular médias e favorabilidade/neutralidade/desfavorabilidade
4. Gerar agregações para KPIs, gráficos e tabela

**Critério:** pipeline de dados funcionando, KPIs e agregações disponíveis.

### Workflow 5 — Autenticação Simples
**Objetivo:** Proteger o dashboard rapidamente.
1. Configurar Supabase Auth
2. Criar tela de login
3. Implementar login por e-mail e senha
4. Proteger rota do dashboard (middleware/guard)
5. Implementar logout
6. Validar fluxo autenticado end-to-end

**Critério:** usuário consegue logar, dashboard só abre autenticado.

### Workflow 6 — Dashboard MVP
**Objetivo:** Montar a interface mínima funcional e apresentável.
1. Criar layout principal (protegido)
2. Ligar KPIs, gráficos, tabela e filtros aos dados reais
3. Validar estados de loading, vazio e erro

**Critério:** dashboard navegável, dados reais aparecendo, leitura clara.

### Workflow 7 — Validação Final
**Objetivo:** Confirmar que o MVP está confiável.
1. Comparar total, média geral, favorabilidade
2. Comparar agrupamento por centro e disciplina
3. Revisar filtros
4. Corrigir divergências críticas

**Critério:** equivalência analítica validada, MVP confiável para apresentação.

### Workflow 8 — Corte de Escopo
- Antes de qualquer tarefa: aplicar a pergunta de decisão obrigatória
- Se não ajuda → vai para fase posterior

### Workflow 9 — Fechamento do Sprint
1. Revisar login, dashboard, dados, equivalência
2. Validar build ou ambiente de demo
3. Registrar estado final e preparar apresentação

**Critério:** aplicação funcional, login ativo, dashboard protegido, números coerentes, versão pronta.

---

## 10. Ordem Oficial do Sprint

```
1. Ambiente      → projeto rodando localmente
2. Supabase      → conexão configurada e testada
3. Dados         → base importada, amostra validada
4. Scoring       → lógica portada/reaproveitada de src/lib/scoring.ts
5. Val. Inicial  → primeiros números comparados com sistema atual
6. Autenticação  → login/logout funcionando, rota protegida
7. Dashboard     → KPIs, gráficos, tabela e filtros ligados aos dados
8. Val. Final    → checklist completo de equivalência executado
9. Estabilização → bugs corrigidos, build rodando, pronto para mostrar
```

### 14 Blocos do Cronograma

| Bloco | Momento | Objetivo |
|-------|---------|----------|
| 1 | Sáb 10h30–11h15 | Preparação operacional |
| 2 | Sáb 11h15–12h30 | Configuração do ambiente |
| Pausa | Sáb 12h30–13h00 | Descanso |
| 3 | Sáb 13h00–14h30 | Supabase e estrutura do banco |
| 4 | Sáb 14h30–16h00 | Ingestão dos dados |
| 5 | Sáb 16h00–18h00 | Portar scoring e transformação |
| 6 | Sáb 18h00–19h00 | Primeira validação dos números |
| 7 | Sáb 19h00–19h30 | Fechamento do sábado |
| 8 | Dom 10h00–10h30 | Retomada e revisão |
| 9 | Dom 10h30–12h00 | Autenticação simples |
| 10 | Dom 13h00–14h30 | Estrutura da interface |
| 11 | Dom 14h30–16h00 | Gráficos, tabela e filtros |
| 12 | Dom 16h00–17h00 | Validação final de equivalência |
| 13 | Dom 17h00–18h00 | Ajustes finais e estabilização |
| 14 | Dom 18h00–19h00 | Build e preparação de entrega |

### Checkpoints Obrigatórios

| CP | Quando | Entregável |
|----|--------|------------|
| 1 | Sáb até 14h30 | ambiente pronto, Supabase acessível, tabela criada |
| 2 | Sáb até 18h00 | dados no banco, scoring portado, pipeline funcionando |
| 3 | Dom até 12h00 | autenticação funcionando, dashboard protegido |
| 4 | Dom até 16h00 | KPIs, gráficos, tabela e filtros no ar |
| 5 | Dom até 19h00 | validação concluída, MVP pronto |

---

## 11. Pontos Críticos do MVP

### Entra no MVP
- Ambiente funcional de desenvolvimento
- Supabase como base do piloto
- Schema mínimo (campos listados acima)
- Lógica de scoring preservada (reaproveitada de `src/lib/`)
- Autenticação simples (Supabase Auth, e-mail/senha)
- Dashboard: KPIs + gráficos + tabela + filtros básicos
- Validação de equivalência analítica

### Fica fora do MVP
- Fluxo híbrido completo / múltiplas origens
- Deduplicação avançada
- Modelagem ideal final do banco
- RBAC / permissões complexas / SSO
- MCP de VPS / automações avançadas
- Refinamentos visuais secundários

### Critério de Corte de Emergência

| Pode cair | Não pode cair |
|-----------|---------------|
| Refinamentos visuais | Scoring |
| Filtros menos importantes | Dados no banco |
| Detalhes extras de UX | Validação de equivalência |
| Itens não essenciais | Login e dashboard principal |

---

## 12. Definição de Pronto

O MVP está PRONTO quando:

- [ ] O login funciona
- [ ] O dashboard está protegido (só abre autenticado)
- [ ] O Supabase entrega os dados
- [ ] O scoring está preservado (lógica idêntica ao sistema atual)
- [ ] Os números principais batem com o sistema atual
- [ ] A interface está melhor que a atual
- [ ] A aplicação está pronta para apresentação

---

## 13. Contexto Técnico do Sistema Atual (dash-main)

### Repositório
- `canhetejr/dash-main` — branch `chore/coolify-docker-deployment`

### Fluxo de dados atual (a ser migrado)
```
Google Sheets API → SurveyRawRow → transform.ts (SurveyRow)
→ scoring.ts → filters.ts → DashboardData
→ API Route /api/survey → use-dashboard-data hook → Componentes
```

### Arquivos críticos para reaproveitar

| Arquivo | Função |
|---------|--------|
| `src/lib/scoring.ts` | Mapeamento Likert → score, classificação agregada |
| `src/lib/transform.ts` | Linha bruta → SurveyRow completo |
| `src/lib/filters.ts` | Estado e aplicação de filtros |
| `src/lib/export.ts` | CSV, XLSX, relatório executivo |
| `src/types/survey.ts` | Tipos TypeScript do domínio |
| `src/types/dashboard.ts` | Tipos do dashboard |

---

## 14. Pergunta de Decisão Obrigatória

> **Antes de qualquer ação:**
>
> *"Isso ajuda a entregar Supabase + scoring preservado + dashboard funcional?"*
>
> - **Sim** → executa
> - **Não** → fica fora do núcleo do sprint

---

*Documento gerado pelo Antigravity com base nos 10 arquivos de `PLANEJAMENTO/Setup ` em 2026-04-18.*
*Caminho: `dash-main/docs/contexto-antigravity/CONTEXTO_OPERACIONAL_ANTIGRAVITY.md`*
