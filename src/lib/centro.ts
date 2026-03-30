/**
 * Normalização canônica de `centro` (TRATAMENTO!M).
 *
 * Regra de negócio (Produto/Dados):
 * - O dropdown precisa exibir apenas estes 7 centros canônicos: CCAS, CCSA, CCS, CEHLA, CES, CGJS, CTIC.
 * - Qualquer outro valor deve virar "inválido" e não aparecer como centro final.
 * - Aliases como `CEHLA-SINCRONA` devem ser consolidados em `CEHLA`.
 */

const CENTROS = [
  {
    sigla: 'CEHLA',
    display: 'CEHLA — Educação, Humanidades, Letras e Artes',
  },
  {
    sigla: 'CCAS',
    display: 'CCAS — Cidadania e Ação Social',
  },
  {
    sigla: 'CCSA',
    display: 'CCSA — Ciências Sociais Aplicadas',
  },
  {
    sigla: 'CCS',
    display: 'CCS — Ciências da Saúde',
  },
  {
    sigla: 'CES',
    display: 'CES — Ciências Exatas e da Natureza',
  },
  {
    sigla: 'CGJS',
    display: 'CGJS — Ciências Jurídicas e Sociais',
  },
  {
    sigla: 'CTIC',
    display: 'CTIC — Tecnologia da Informação e Comunicação',
  },
] as const;

export const CENTRO_CANONICO_SIGLAS = CENTROS.map((c) => c.sigla) as readonly (typeof CENTROS)[number]['sigla'][];
export const CENTRO_CANONICO_SIGLA_SET = new Set<string>(CENTRO_CANONICO_SIGLAS as unknown as string[]);

export interface NormalizedCentro {
  raw: string;
  sigla: string; // somente sigla canônica; string vazia se inválido
  display: string; // display canônico; string vazia se inválido
  valid: boolean;
}

function stripDiacritics(input: string): string {
  // Remove marcas diacríticas após normalização NFD.
  // Evita property escapes (\p{...}) que dependem do `target` do TS.
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeForMatch(input: string): string {
  return stripDiacritics((input ?? '').trim()).toUpperCase();
}

const EXPLICIT_INVALID_PHRASES = [
  'AMBIENTACAO',
  'GRUPO DE ESTUDOS/PESQUISA',
  'PROJETO DE ENSINO',
  'NÃO INFORMADO',
  'NAO INFORMADO',
  'NÃO LOCALIZADO',
  'NAO LOCALIZADO',
];

/**
 * Retorna sigla canônica (entre os 7 valores) ou inválido (sigla/display vazios).
 */
export function normalizeCentro(raw: string): NormalizedCentro {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return { raw: trimmed, sigla: '', display: '', valid: false };

  const normalized = normalizeForMatch(trimmed);

  // Residuo literal "Centro" (categoria) deve ser excluído.
  if (normalized === 'CENTRO') return { raw: trimmed, sigla: '', display: '', valid: false };

  // Se cair em uma categoria claramente indevida, invalida.
  for (const phrase of EXPLICIT_INVALID_PHRASES) {
    const p = normalizeForMatch(phrase);
    if (p && normalized.includes(p)) return { raw: trimmed, sigla: '', display: '', valid: false };
  }

  // Consolidar aliases: qualquer valor contendo `SIGLA` (ex: `CEHLA-SINCRONA`) vira a sigla canônica.
  // Ordem por tamanho para evitar colisões (ex: `CCSA` contém `CCS`).
  const ordered = [...CENTROS].sort((a, b) => b.sigla.length - a.sigla.length);
  for (const centro of ordered) {
    if (normalized.includes(centro.sigla)) {
      return { raw: trimmed, sigla: centro.sigla, display: centro.display, valid: true };
    }
  }

  return { raw: trimmed, sigla: '', display: '', valid: false };
}
