import type { SurveyRawRow } from '@/types/survey';

const CENTROS = [
  'Centro de Educação, Humanidades, Letras e Artes (CEHLA)',
  'Centro de Cidadania e Ação Social (CCAS)',
  'Centro de Ciências Sociais Aplicadas (CCSA)',
  'Centro de Ciências da Saúde (CCS)',
  'Centro de Ciências Exatas e da Natureza (CES)',
  'Centro de Ciências Jurídicas e Sociais (CGJS)',
  'Centro de Tecnologia da Informação e Comunicação (CTIC)',
];
const DISCIPLINAS = [
  'Metodologia Científica',
  'Gestão de Projetos',
  'Fundamentos de Administração',
  'Cálculo I',
  'Introdução à Programação',
  'Direito Constitucional',
  'Anatomia Humana',
  'Estatística Aplicada',
  'Marketing Digital',
  'Psicologia Organizacional',
  'Contabilidade Básica',
  'Física Experimental',
  'Bioquímica',
  'Sociologia Jurídica',
  'Economia Brasileira',
];

const RESPOSTAS = [
  'Concordo Totalmente',
  'Concordo Parcialmente',
  'Indiferente',
  'Discordo Parcialmente',
  'Discordo Totalmente',
];

const WEIGHTS = [0.35, 0.3, 0.15, 0.12, 0.08];

const SUGESTOES = [
  'O material poderia ter mais exemplos práticos.',
  'Excelente disciplina, aprendi muito!',
  'As videoaulas poderiam ser mais curtas e objetivas.',
  'Gostaria de mais exercícios interativos.',
  'O mediador foi muito atencioso e prestativo.',
  'Seria bom ter mais material complementar atualizado.',
  'A disciplina superou minhas expectativas.',
  'Os fóruns poderiam ter mais participação dos tutores.',
  'Sugiro incluir estudos de caso reais.',
  'O conteúdo estava desatualizado em alguns pontos.',
  'Muito satisfeito com a organização do curso.',
  'Poderia haver mais integração entre as disciplinas.',
  '',
  '',
  '',
];

function weightedRandom(): string {
  const r = Math.random();
  let cumulative = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    cumulative += WEIGHTS[i];
    if (r <= cumulative) return RESPOSTAS[i];
  }
  return RESPOSTAS[0];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatTimestamp(d: Date): string {
  return `${padZero(d.getDate())}/${padZero(d.getMonth() + 1)}/${d.getFullYear()} ${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}`;
}

export function generateMockData(count = 480): SurveyRawRow[] {
  const startDate = new Date(2024, 0, 15);
  const endDate = new Date(2025, 11, 20);
  const rows: SurveyRawRow[] = [];

  for (let i = 0; i < count; i++) {
    const centro = CENTROS[Math.floor(Math.random() * CENTROS.length)];
    const disciplina = DISCIPLINAS[Math.floor(Math.random() * DISCIPLINAS.length)];
    const date = randomDate(startDate, endDate);

    const idNum = `${1000 + Math.floor(Math.random() * 500)}`;
    rows.push({
      timestamp: formatTimestamp(date),
      courseLabel: `${disciplina} - ${idNum}`,
      q1: weightedRandom(),
      q2: weightedRandom(),
      q3: weightedRandom(),
      q4: weightedRandom(),
      q5: weightedRandom(),
      q6: weightedRandom(),
      suggestion: SUGESTOES[Math.floor(Math.random() * SUGESTOES.length)],
      disciplina,
      id: idNum,
      chave: `${disciplina}|${idNum}`,
      centro,
    });
  }

  return rows.sort(
    (a, b) => parseDate(a.timestamp).getTime() - parseDate(b.timestamp).getTime()
  );
}

function parseDate(ts: string): Date {
  const [datePart, timePart] = ts.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = (timePart ?? '00:00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}
