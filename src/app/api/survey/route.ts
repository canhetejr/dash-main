import { NextRequest, NextResponse } from 'next/server';
import { fetchMoodleBaseMapWithFallback, fetchSheetDataWithFallback } from '@/lib/sheets';
import { transformAll, buildDashboardData } from '@/lib/transform';
import { applyFilters, searchParamsToFilters, buildFilterOptions } from '@/lib/filters';
import type { SurveyRow } from '@/types/survey';

let cachedRows: SurveyRow[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

// Garante que a rota nunca seja pré-renderizada/executada estaticamente durante o build.
// Em produção, os dados vêm do Google Sheets em runtime (com env vars).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getTransformedRows(): Promise<SurveyRow[]> {
  const now = Date.now();
  if (cachedRows && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRows;
  }
  const [rawRows, moodleUrlById] = await Promise.all([
    fetchSheetDataWithFallback(),
    fetchMoodleBaseMapWithFallback(),
  ]);

  cachedRows = transformAll(rawRows, moodleUrlById, process.env.MOODLE_URL_TEMPLATE);
  cacheTimestamp = now;
  return cachedRows;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const allRows = await getTransformedRows();
    const filters = searchParamsToFilters(searchParams);
    const filteredRows = applyFilters(allRows, filters);
    const dashboardData = buildDashboardData(filteredRows);
    const filterOptions = buildFilterOptions(allRows);

    return NextResponse.json(
      {
        success: true,
        data: dashboardData,
        filterOptions,
        totalUnfiltered: allRows.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Survey API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao carregar dados da pesquisa.',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
