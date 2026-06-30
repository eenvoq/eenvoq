export type OrganizationTypeKey = 'business' | 'school';

export type ModuleKey =
  | 'transactions'
  | 'inventory'
  | 'students'
  | 'members'
  | 'patients'
  | 'donations'
  | 'attendance'
  | 'staff'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'debtors'
  | 'expenses'
  | 'cash'
  | 'bank'
  | 'assets'
  | 'projects'
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
    // Business profile should include extended commerce and financial modules
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
  },
  school: {
    id: 'school',
    label: 'School / Educational Institution',
    description: 'Education operations with students, fees, attendance, inventory, and staff visibility.',
    // Education profile focuses on students, staff, classes, fees and reporting
    defaultModules: ['transactions', 'inventory', 'students', 'attendance', 'staff', 'reports', 'ai', 'assets'],
    navigation: [
      { id: 'desk', label: 'Dashboard', tab: 'desk' },
      { id: 'students', label: 'Students', tab: 'crm' },
      { id: 'fees', label: 'Fees', tab: 'orders' },
      { id: 'attendance', label: 'Attendance', tab: 'orders' },
      { id: 'inventory', label: 'Inventory', tab: 'stock' },
      { id: 'staff', label: 'Staff', tab: 'staff' },
      { id: 'reports', label: 'Reports', tab: 'analytics' },
      { id: 'ai', label: 'AI Assistant', tab: 'ai' }
    ],
    dashboardMetrics: [
      { label: 'Student Count', value: '842', hint: 'Enrollment remains strong' },
      { label: 'Attendance', value: '94%', hint: 'Attendance is steady' },
      { label: 'Fee Collection', value: '82%', hint: 'Collections are improving' },
      { label: 'Outstanding Balances', value: '27', hint: 'A few accounts need follow-up' }
    ],
    dashboardActions: [
      { title: 'Students with low attendance need follow-up', detail: 'Open the student view and support retention before it becomes a trend.', targetTab: 'crm' },
      { title: 'Fee reminders are due for 12 accounts', detail: 'Route the reminder workflow and keep the bursary timeline healthy.', targetTab: 'orders' },
      { title: 'Campus supplies need attention', detail: 'Review inventory levels and prevent disruption in school operations.', targetTab: 'stock' }
    ],
    terminology: {
      customerLabel: 'Student',
      transactionLabel: 'Fee',
      salesLabel: 'Fees',
      inventoryLabel: 'Inventory',
      staffLabel: 'Staff',
      dashboardLabel: 'Dashboard',
      recipientLabel: 'Student',
      summaryLabel: 'School operations summary'
    },
    aiGreeting: 'Hello. I am Eenvoq AI, your education operations guide. I can help you improve attendance, fee follow-up, planning, and classroom resource readiness. ',
    aiFocus: 'Attendance, fee collection, school operations, and student support.'
  },
};

// Subtype lists used during onboarding to capture a more specific commercial or educational category
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

export const educationSubtypes = [
  'Primary / Secondary School',
  'College',
  'University',
  'Technical Institute',
  'Language School',
  'Tutoring Center',
  'Vocational Training Center',
  'Other Educational Institution'
];

export const organizationTypeOptions = Object.values(organizationProfiles).map((profile) => ({
  id: profile.id,
  label: profile.label,
  description: profile.description
}));

export function getOrganizationProfile(type: string | undefined) {
  return organizationProfiles[(type as OrganizationTypeKey) || 'business'] || organizationProfiles.business;
}
