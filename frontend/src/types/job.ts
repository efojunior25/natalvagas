export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export type WorkModel = 'PRESENCIAL' | 'HIBRIDO' | 'REMOTO' | 'NAO_INFORMADO';
export type ContractType = 'CLT' | 'PJ' | 'ESTAGIO' | 'TEMPORARIO' | 'JOVEM_APRENDIZ' | 'NAO_INFORMADO';
export type JobStatus = 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED';
export type ApplicationChannel = 'EMAIL' | 'LINK' | 'WHATSAPP';

export interface Job {
  id: number;
  title: string;
  slug: string;
  companyName: string;
  companyLogoUrl?: string;
  category?: Category;
  city: string;
  state: string;
  neighborhood?: string;
  workModel: WorkModel;
  contractType: ContractType;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  hideSalary: boolean;
  description: string;
  requirements?: string;
  benefits?: string;
  applicationChannel: ApplicationChannel;
  applicationTarget: string;
  status: JobStatus;
  isFeatured: boolean;
  viewsCount: number;
  publishedAt: string;
  createdAt: string;
  sourceName?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  expiresAt?: string;
}

export interface JobFilterParams {
  query?: string;
  city?: string;
  categoryId?: number;
  workModel?: WorkModel;
  contractType?: ContractType;
  page?: number;
  size?: number;
}
