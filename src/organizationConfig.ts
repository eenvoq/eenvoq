export type OrganizationTypeKey = 'business';

export type ModuleKey =
  | 'transactions'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'expenses'
  | 'debtors'
  | 'cash'
  | 'bank'
  | 'assets'
  | 'staff'
  | 'ai'
  | 'reports'
  ;

export interface OrganizationProfile {
  id: OrganizationTypeKey;
  label: string;
  description: string;
  defaultModules: ModuleKey[];
  navigation: Array<{ id: string; label: string; tab: 'desk' | 'stock' | 'orders' | 'crm' | 'staff' | 'analytics' | 'ai' }>;
  dashboardMetrics: Array<{ label: string; value: string; hint: string }>;
  dashboardActions: Array<{ title: string; detail: string; targetTab: 'desk' | 'stock' | 'orders' | 'crm' | 'staff' | 'analytics' | 'ai' }>;
  terminology: {
    customerLabel: string;
    transactionLabel: string;
    salesLabel: string;
    inventoryLabel: string;
    staffLabel: string;
    dashboardLabel: string;
    recipientLabel: string;
    summaryLabel: string;
  };
  aiGreeting: string;
  aiFocus: string;
}
export const organizationProfiles: Record<OrganizationTypeKey, OrganizationProfile> = {
  business: {
    id: 'business',
    label: 'Business / Retail Store',
    description: 'Fast-moving commerce with transactions, inventory, customers, and growth insight.',
    defaultModules: ['transactions', 'inventory', 'customers', 'suppliers', 'purchases', 'expenses', 'debtors', 'cash', 'bank', 'staff', 'assets', 'ai', 'reports'],
    navigation: [
      { id: 'desk', label: 'Dashboard', tab: 'desk' },
      { id: 'transactions', label: 'Transactions', tab: 'orders' },
      { id: 'inventory', label: 'Inventory', tab: 'stock' },
      { id: 'customers', label: 'Customers', tab: 'crm' },
      { id: 'staff', label: 'Staff', tab: 'staff' },
      { id: 'reports', label: 'Reports', tab: 'analytics' },
      { id: 'ai', label: 'AI Assistant', tab: 'ai' }
    ],
    dashboardMetrics: [
      { label: 'Revenue', value: '$128K', hint: 'Revenue trend remains healthy' },
      { label: 'Profit', value: '$31K', hint: 'Margin is trending above plan' },
      { label: 'Inventory Health', value: '94%', hint: 'Stock remains balanced' },
      { label: 'Transactions', value: '182', hint: 'Activity is growing steadily' }
    ],
    dashboardActions: [
      { title: 'Inventory is trending low in 3 key SKUs', detail: 'Open stock controls and replenish before the weekend rush.', targetTab: 'stock' },
      { title: '4 high-value customers need follow-up', detail: 'Open the customer queue and keep momentum strong.', targetTab: 'crm' },
      { title: 'Two workflows need a quick review', detail: 'Launch the transaction review board and keep operations calm.', targetTab: 'orders' }
    ],
    terminology: {
      customerLabel: 'Customer',
      transactionLabel: 'Transaction',
      salesLabel: 'Sales',
      inventoryLabel: 'Inventory',
      staffLabel: 'Staff',
      dashboardLabel: 'Dashboard',
      recipientLabel: 'Recipient',
      summaryLabel: 'Operations summary'
    },
    aiGreeting: 'Hello. I am Eenvoq AI, your retail operations advisor. I can help you optimize demand, inventory, and customer follow-up with business-ready recommendations. ',
    aiFocus: 'Revenue, replenishment, customer conversion, and sales reliability.'
  }
};

// Subtype lists used during onboarding to capture a more specific commercial category
export const businessSubtypes = [
  'Retail Store',
  'Supermarket',
  'Grocery Store',
  'Pharmacy',
  'Fashion Store',
  'Electronics Store',
  'Restaurant',
  'Café',
  'Bakery',
  'Salon / Barbershop',
  'Beauty Business',
  'Hotel / Hospitality',
  'Manufacturing',
  'Wholesale Distributor',
  'Service Business',
  'Professional Services',
  'Construction',
  'Online Store / E-commerce',
  'Other Commercial Business'
];

export const organizationTypeOptions = [
  {
    id: 'business',
    label: organizationProfiles.business.label,
    description: organizationProfiles.business.description
  }
];

export function getOrganizationProfile(type: string | undefined) {
  return organizationProfiles.business;
}
