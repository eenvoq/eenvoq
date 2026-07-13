import type { OrganizationTypeKey } from './organizationConfig';

export type DemoAccountKey = 'krakki';

export interface DemoAccountConfig {
  key: DemoAccountKey;
  profileType: OrganizationTypeKey;
  name: string;
  industry: string;
  subtype: string;
  location: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  staffCount: number;
  logoUrl: string;
}

const demoAccounts: Record<DemoAccountKey, DemoAccountConfig> = {
  krakki: {
    key: 'krakki',
    profileType: 'business',
    name: 'Krakki',
    industry: 'Business',
    subtype: 'Retail Store',
    location: 'Lagos, Nigeria',
    currency: 'NGN (₦)',
    contactEmail: 'hello@krakki.co',
    contactPhone: '+234 812 000 0000',
    staffCount: 12,
    logoUrl: ''
  }
};

export function getDemoLoginConfig(key: string): DemoAccountConfig {
  const normalizedKey = key.toLowerCase() as DemoAccountKey;
  const config = demoAccounts[normalizedKey];

  if (!config) {
    throw new Error(`Unknown demo account: ${key}`);
  }

  return config;
}
