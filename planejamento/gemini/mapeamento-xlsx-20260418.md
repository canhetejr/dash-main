# Relatório Técnico de Mapeamento de Dados — Migração XLSX para Supabase
**Data:** 2026-04-18
**Arquivo:** `PESQUISA DA DISCPLINA .xlsx`

## 1. Estrutura de Abas
O arquivo contém 4 abas:
- **BASE:** Dados brutos da pesquisa (Google Forms/Sheets).
- **IDs - BASE:** Tabela de referência de IDs, nomes breves e centros.
- **TRATAMENTO:** Dados processados e prontos para o Dashboard (Aba Principal).
- **DASHBOARD:** Aba de cálculos e visualizações internas do Excel (não necessária para o Supabase).

## 2. Aba Principal (MVP)
A aba **`TRATAMENTO`** é a fonte de verdade para o Dashboard. Ela consolida as respostas da aba `BASE` com as informações de Centro e Disciplina mapeadas via `IDs - BASE`.

## 3. Colunas Encontradas vs. MVP Supabase

| Coluna XLSX (TRATAMENTO) | Mapeamento Supabase | Tipo Sugerido | Notas |
|:--- |:--- |:--- |:--- |
| Carimbo de data/hora | `submitted_at` | `timestamptz` | Formato Excel Serial (ex: 45867) |
| Identificação do Curso | `course_label` | `text` | Texto original |
| De forma geral, estou satisfeito(a)... | `q1` | `text` | Likert original |
| O material didático foi claro... | `q2` | `text` | Likert original |
| As atividades propostas... | `q3` | `text` | Likert original |
| As videoaulas complementaram... | `q4` | `text` | Likert original |
| O mediador da disciplina foi acessível... | `q5` | `text` | Likert original |
| Além do conteúdo de base, utilizei... | `q6` | `text` | Likert original |
| Você teria alguma sugestão / recomendação...| `suggestion` | `text` | Texto livre |
| **DISCPLINA** | `disciplina` | `text` | **Erro de digitação no header original** |
| ID | `external_id` | `text` | ID numérico da disciplina |
| CHAVE | (ignorar) | - | Composto: `DISCPLINA|ID` (derivável) |
| CENTRO | `centro` | `text` | Nome completo do centro |
| STATUS_MAPEAMENTO | (ignorar) | - | Controle interno do Excel |

## 4. Problemas de Dados Identificados
- **Nomes Inconsistentes:** A coluna de disciplina no XLSX está escrita como `DISCPLINA` (faltando o 'I'). No código atual (`COLUMN_MAP`), o mapeamento assume a ordem e não o nome, mas para migração SQL o nome correto `disciplina` deve ser usado.
- **Formato de Data:** Na aba `TRATAMENTO`, as datas estão como números inteiros (formato serial do Excel). A ingestão precisará converter `45867` para `2025-07-27` (exemplo).
- **Espaços em Branco:** Algumas colunas de perguntas possuem espaços no final (ex: `...aprendi. `).
- **Respostas Likert:** A amostra confirma o padrão: `Concordo Totalmente`, `Concordo Parcialmente`, `Indiferente`. Sem desvios detectados na amostra.

## 5. Estratégia de Migração
1. Criar tabela `surveys` no Supabase com o schema mínimo definido nas Regras do Projeto.
2. Usar o script de ingestão para ler a aba `TRATAMENTO`.
3. Aplicar normalização de data (Excel Serial -> JS Date).
4. Limpar espaços (trim) em todos os campos de texto.
5. Ignorar colunas de controle do Excel (`CHAVE`, `STATUS_MAPEAMENTO`).

---
*Relatório gerado automaticamente pelo Antigravity em 18/04/2026.*
