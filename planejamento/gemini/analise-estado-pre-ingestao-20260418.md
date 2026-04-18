# Análise de Estado Pré-Ingestão — Supabase
**Data:** 2026-04-18
**Objetivo:** Validar requisitos para migração segura do XLSX para o banco de dados.

## 1. Checklist de Requisitos

| Item | Estado | Caminho / Observação |
|:--- |:---:|:--- |
| Script de Ingestão | **OK** | `scripts/ingest_xlsx.js` |
| Script de Validação | **OK** | `scripts/validate_ingestion.js` |
| Variáveis no `.env.example` | **OK** | Adicionados placeholders do Supabase |
| Variáveis no `.env.local` | **⚠️ ATENÇÃO** | Chaves estão com valores placeholder (`your-supabase-...`) |
| Consistência de Tabela | **OK** | Nome `surveys` usado em todos os scripts e rotas |
| Rota de Teste API | **OK** | `/api/supabase-test` configurada para a tabela `surveys` |

## 2. Consistência Técnica
A análise dos arquivos confirma que:
1. **Nome da Tabela:** A tabela alvo foi padronizada como `surveys` no script de ingestão, validação, rota de teste e biblioteca client (`src/lib/supabase.ts`).
2. **Campos:** O script de ingestão já contempla a correção de `DISCPLINA` (XLSX) para `disciplina` (DB) e `ID` (XLSX) para `external_id` (DB).
3. **Datas:** A lógica de conversão Excel Serial -> ISO Timestamp foi implementada no ingestor.

## 3. Bloqueios Restantes
- **Credenciais Reais:** O arquivo `.env.local` ainda não contém a `URL` e `SERVICE_ROLE_KEY` reais do projeto Supabase. Sem isso, qualquer execução resultará em erro de conexão.
- **Criação da Tabela:** A tabela `surveys` precisa ser criada manualmente no Supabase antes de rodar o script (ou via SQL Editor).

## 4. Falhas Previsíveis
- **Políticas de RLS:** Se o RLS (Row Level Security) estiver ativo na tabela `surveys` sem políticas de inserção para a `service_role`, o script de ingestão falhará.
- **Tipagem de Dados:** Se a coluna `external_id` for criada como `integer` no banco e houver valores não numéricos no XLSX (embora a amostra mostre números), a inserção falhará. Recomenda-se tipo `text`.

## 5. Sequência para Destravar (Menor Caminho)
1. **Configurar Credenciais:** Substituir os placeholders no `.env.local` pelas chaves reais do projeto Supabase.
2. **Criar Schema:** Executar o SQL de criação da tabela `surveys` no dashboard do Supabase (SQL Editor).
3. **Testar Conexão:** Acessar `/api/supabase-test` via navegador/curl e verificar se o erro retornado é "tabela vazia" e não "conexão recusada".
4. **Executar Ingestão:** 
   ```bash
   node --env-file=.env.local scripts/ingest_xlsx.js
   ```
5. **Executar Validação:**
   ```bash
   node --env-file=.env.local scripts/validate_ingestion.js
   ```

---
*Relatório gerado automaticamente pelo Antigravity em 18/04/2026.*
