'use server';

import { fetchAllSurveys, SurveyPipelineFilters } from '@/lib/supabase-pipeline';
import { transformAllSupabaseRows } from '@/lib/supabase-transform';

export async function getExportData(filters: SurveyPipelineFilters) {
  try {
    const rawRows = await fetchAllSurveys(filters);
    const transformed = transformAllSupabaseRows(rawRows);
    
    return { success: true, data: transformed };
  } catch (error) {
    console.error('Error fetching export data:', error);
    return { success: false, data: [] };
  }
}
