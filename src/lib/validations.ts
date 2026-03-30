import { z } from 'zod';

export const surveyRawRowSchema = z.object({
  timestamp: z.string().min(1),
  courseLabel: z.string(),
  q1: z.string(),
  q2: z.string(),
  q3: z.string(),
  q4: z.string(),
  q5: z.string(),
  q6: z.string(),
  suggestion: z.string(),
  disciplina: z.string(),
  id: z.string(),
  centro: z.string(),
});

export const filterStateSchema = z.object({
  centro: z.array(z.string()).default([]),
  disciplina: z.array(z.string()).default([]),
  id: z.array(z.string()).default([]),
  sentimentLabel: z.array(z.string()).default([]),
  dateFrom: z.string().nullable().default(null),
  dateTo: z.string().nullable().default(null),
  scoreMin: z.number().min(1).max(5).nullable().default(null),
  scoreMax: z.number().min(1).max(5).nullable().default(null),
  search: z.string().default(''),
});

export function validateRawRows(data: unknown[]): z.infer<typeof surveyRawRowSchema>[] {
  return data
    .map((item) => {
      const result = surveyRawRowSchema.safeParse(item);
      return result.success ? result.data : null;
    })
    .filter((item): item is z.infer<typeof surveyRawRowSchema> => item !== null);
}
