import { getPaginatedTableRows } from './src/lib/supabase-pipeline';
getPaginatedTableRows({ centro: undefined, disciplina: undefined, externalId: undefined }, 1, 50).then(console.log).catch(console.error);
