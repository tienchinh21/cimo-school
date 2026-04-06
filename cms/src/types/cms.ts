import type { ReactNode } from 'react';

export type CmsRecord = Record<string, unknown> & {
  id: string;
};

export type ReferenceKey = 'roles' | 'classes' | 'students' | 'parents' | 'users' | 'ladCourses';

export interface SelectOption {
  label: string;
  value: string;
}

export type FieldType = 'text' | 'password' | 'textarea' | 'date' | 'select' | 'multi-select' | 'array' | 'image' | 'richtext' | 'seo-keywords';

export interface CmsField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: SelectOption[];
  reference?: ReferenceKey;
  valueType?: 'boolean';
  hiddenOnCreate?: boolean;
  hiddenOnEdit?: boolean;
  onlyOnCreate?: boolean;
  onlyOnEdit?: boolean;
}

export interface CmsColumn {
  key: string;
  label: string;
  className?: string;
  sortable?: boolean;
  render?: (row: CmsRecord) => ReactNode;
}

export interface CmsResourceConfig {
  key: string;
  title: string;
  subtitle: string;
  endpoint: string;
  creatable?: boolean;
  editable?: boolean;
  countEndpoint?: string;
  includeRelations?: string[];
  defaultOrder?: string[];
  searchFields?: string[];
  searchable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  columns: CmsColumn[];
  fields: CmsField[];
  normalizePayload?: (payload: Record<string, unknown>, context: { mode: 'create' | 'edit' }) => Record<string, unknown>;
}

export type ReferenceOptionsMap = Record<ReferenceKey, SelectOption[]>;
