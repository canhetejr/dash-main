import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export function formatDateBR(date: string): string {
  const d = dayjs(date);
  return d.isValid() ? d.format('DD/MM/YYYY') : date;
}

export function formatMonthLabel(month: string): string {
  const d = dayjs(`${month}-01`);
  if (!d.isValid()) return month;
  const label = d.format('MMM/YY');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function formatDecimal(n: number, decimals = 1): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function truncateText(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
