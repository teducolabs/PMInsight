export enum StakeholderType {
  Internal = 'Internal',
  External = 'External',
  Customer = 'Customer',
  Vendor = 'Vendor',
  Partner = 'Partner',
}

export enum InfluenceLevel {
  VeryLow = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  VeryHigh = 5,
}

export enum InterestLevel {
  VeryLow = 1,
  Low = 2,
  Medium = 3,
  High = 4,
  VeryHigh = 5,
}

export interface Stakeholder {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  type: StakeholderType;
  influence: InfluenceLevel;
  interest: InterestLevel;
  communicationPreference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStakeholderDto {
  projectId: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  type: StakeholderType;
  influence: InfluenceLevel;
  interest: InterestLevel;
  communicationPreference?: string;
  notes?: string;
}

export interface UpdateStakeholderDto extends Partial<CreateStakeholderDto> {
  id: string;
}
