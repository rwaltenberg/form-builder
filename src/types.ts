export type DataType = 'string' | 'number' | 'boolean' | 'enum';

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FieldSchema {
  id: string;
  key: string;
  label: string;
  type: DataType;
  required: boolean;
  enumOptions?: string[];
  validation?: ValidationRules;
}

export type FormSchema = FieldSchema[];
