import { google } from 'googleapis';
import { SHEETS_CONFIG, COLUMN_MAP } from './constants';
import type { SurveyRawRow } from '@/types/survey';

export type MoodleUrlById = Map<string, string>;

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !key) {
    throw new Error(
      'Missing Google Sheets credentials. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.'
    );
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function fetchSheetData(): Promise<SurveyRawRow[]> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID environment variable.');
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: process.env.GOOGLE_SHEETS_RANGE ?? SHEETS_CONFIG.range,
  });

  const rows = response.data.values;
  if (!rows || rows.length <= 1) return [];

  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => row.length >= 2 && row[0])
    .map((row) => mapRowToRaw(row));
}

function mapRowToRaw(row: string[]): SurveyRawRow {
  const raw: Record<string, string> = {};
  for (const [index, field] of Object.entries(COLUMN_MAP)) {
    raw[field] = (row[Number(index)] ?? '').trim();
  }
  return raw as unknown as SurveyRawRow;
}

export async function fetchSheetDataWithFallback(): Promise<SurveyRawRow[]> {
  const useMock = process.env.USE_MOCK_DATA === 'true';

  if (useMock) {
    const { generateMockData } = await import('./mock-data');
    return generateMockData();
  }

  try {
    return await fetchSheetData();
  } catch (error) {
    console.error('Failed to fetch Google Sheets data, falling back to mock:', error);
    const { generateMockData } = await import('./mock-data');
    return generateMockData();
  }
}

/**
 * Busca a base de URLs do Moodle (aba `BASE`), mapeando `id -> url`.
 *
 * Convenção assumida:
 * - Coluna A: `id`
 * - Coluna B: `moodleUrl` (ou link)
 *
 * Se não existir, retorna `new Map()`.
 */
export async function fetchMoodleBaseMapWithFallback(): Promise<MoodleUrlById> {
  const useMock = process.env.USE_MOCK_DATA === 'true';
  if (useMock) return new Map<string, string>();

  try {
    return await fetchMoodleBaseMap();
  } catch (error) {
    console.error('Failed to fetch Moodle BASE map, continuing without it:', error);
    return new Map<string, string>();
  }
}

async function fetchMoodleBaseMap(): Promise<MoodleUrlById> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) throw new Error('Missing GOOGLE_SHEETS_SPREADSHEET_ID environment variable.');

  const range = process.env.GOOGLE_SHEETS_MOODLE_BASE_RANGE ?? 'BASE!A:B';

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values ?? [];
  if (rows.length <= 1) return new Map<string, string>();

  // Se houver cabeçalho na primeira linha, tenta removê-lo de forma heurística.
  const firstId = String(rows[0]?.[0] ?? '').trim().toLowerCase();
  const looksLikeHeader = firstId === 'id' || firstId === 'ids';
  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const map: MoodleUrlById = new Map();
  for (const row of dataRows) {
    const id = (row?.[0] ?? '').toString().trim();
    const url = (row?.[1] ?? '').toString().trim();
    if (!id || !url) continue;
    map.set(id, url);
  }
  return map;
}
