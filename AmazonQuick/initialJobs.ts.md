# File: initialJobs.ts
- **Original Path:** `frontend/src/data/initialJobs.ts`
- **Language / Type:** `typescript`
- **Lines of Code:** 20

---

```typescript
import { Job, WorkModel, ContractType } from '../types/job';

/**
 * Catálogo estático desacoplado para otimização do bundle e resolução de limitações de union types no TypeScript.
 * O catálogo oficial completo de vagas (1.400+ oportunidades no RN) é consumido dinamicamente
 * pela aplicação através de '/data/jobs.json'.
 */
export type JobRecord = Partial<Job> & {
  id: number;
  title: string;
  slug: string;
  companyName: string;
  city: string;
  workModel: WorkModel;
  contractType: ContractType;
  description: string;
  publishedAt: string;
};

export const INITIAL_REAL_JOBS: Job[] = [];

```
