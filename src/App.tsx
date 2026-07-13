import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  User,
  Users,
  Upload,
  X,
  Sliders,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Activity,
  Send,
  HelpCircle,
  FileText,
  ChevronRight,
  ChevronDown,
  Menu,
  Truck,
  History,
  ShieldCheck,
  Clock3,
  KeyRound,
  Wallet
} from 'lucide-react';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { AuthPage, OnboardingWizard, SidebarNavButton, AppHeader, MetricCard } from './components/AppViews';
import { getOrganizationProfile, type ModuleKey, type OrganizationTypeKey } from './organizationConfig';
import { getDemoLoginConfig, type DemoAccountKey } from './demoAccounts';

// Interfaces matching the server models
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock?: number;
  minStock?: number;
  price?: number;
  cost?: number;
  image?: string;
  status?: string;
  details?: Record<string, any>;
  lastModifiedBy?: string;
  owner?: string;
  updatedAt?: string;
  lastUpdated?: string;
  value?: number;
  note?: string;
  attachments?: string[];
  [key: string]: any;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  purchasePrice?: number;
  transactionType?: string;
  category?: string;
  inventoryId?: string;
  inventoryName?: string;
  inventoryPhoto?: string;
  saleDate?: string;
  sellingPrice?: number;
  profit?: number;
  balanceDue?: number;
  currency?: string;
  notes?: string;
}

interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  date: string;
  status: 'Completed' | 'Processing' | 'Pending' | 'Shipped';
  recordedBy?: string;
  transactionType?: string;
  recipientId?: string;
  recipientName?: string;
  category?: string;
  inventoryId?: string;
  inventoryName?: string;
  inventoryPhoto?: string;
  saleDate?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  profit?: number;
  balanceDue?: number;
  currency?: string;
  notes?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  online: boolean;
  lastActive: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'Active' | 'Contacted' | 'Follow Up' | 'Inactive';
  totalSpent: number;
  ordersCount: number;
  lastPurchaseDate: string;
}

interface SalesSummary {
  revenue: number;
  cost: number;
  profit: number;
  totalProducts: number;
  lowStockCount: number;
  pendingOrdersCount: number;
  topSelling: Array<{ id: string; name: string; quantity: number; revenue: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
}

interface Supplier {
  id: string;
  name: string;
  specialty: string;
  leadTime: number;
  contact: string;
  email: string;
  businessName?: string;
  address?: string;
  whatsappNumber?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  category: 'System' | 'Procurement' | 'Inventory' | 'Sales' | 'Security';
  message: string;
}

interface ExpenseRecord {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  product?: string;
  notes?: string;
  receipt?: string;
  recordedBy?: string;
}

type TransactionType = 'product-sale' | 'service-payment' | 'donation' | 'membership' | 'event-registration' | 'subscription' | 'custom';
type OrganizationKind = 'business';
type PaymentMethod = 'Cash' | 'Transfer' | 'POS' | 'Card' | 'Mobile Money' | 'Mixed';
type AppMode = 'auth' | 'app' | 'onboarding';

interface OrganizationSetupConfig {
  profileType: OrganizationTypeKey;
  name: string;
  industry: string;
  subtype: string;
  location: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  staffCount: number;
  modules: ModuleKey[];
  logoUrl: string;
}
type InventoryType = 'Products' | 'Members' | 'Patients' | 'Assets' | 'Equipment' | 'Vehicles' | 'Custom Inventory';

interface TransactionRecipient {
  id: string;
  name: string;
  subtitle: string;
  type: string;
}

interface ServiceTemplate {
  id: string;
  name: string;
  description: string;
  price: number;
}

const transactionTypeOptions = [
  { id: 'product-sale' as TransactionType, label: 'Product Sale', copy: 'Fast checkout for inventory-led sales.' },
  { id: 'service-payment' as TransactionType, label: 'Service Payment', copy: 'Consultancy, repairs, and professional fees.' },
  { id: 'donation' as TransactionType, label: 'Donation', copy: 'Contributions and sponsorships.' },
  { id: 'membership' as TransactionType, label: 'Membership', copy: 'Annual dues and renewals.' },
  { id: 'event-registration' as TransactionType, label: 'Event Registration', copy: 'Workshops, conferences, and gatherings.' },
  { id: 'subscription' as TransactionType, label: 'Subscription', copy: 'Recurring service access.' },
  { id: 'custom' as TransactionType, label: 'Custom Transaction', copy: 'Flexible entry for any workflow.' }
];

const organizationTypeOptions = [
  { id: 'business' as OrganizationKind, label: 'Business', helper: 'Commercial businesses and retailers.' }
];

const splashMessages = [
  'Preparing your workspace…',
  'Loading your organization…',
  'Syncing your data…',
  'Almost ready…'
];

const paymentMethods: PaymentMethod[] = ['Cash', 'Transfer', 'POS', 'Card', 'Mobile Money', 'Mixed'];

const serviceTemplates: ServiceTemplate[] = [
  { id: 'consult', name: 'Strategy Consultation', description: 'Executive advisory session', price: 180 },
  { id: 'repair', name: 'Maintenance Service', description: 'On-site support and diagnostics', price: 260 },
  { id: 'training', name: 'Staff Training', description: 'Operational enablement workshop', price: 320 }
];

const feeCategories = ['Tuition', 'Hostel', 'Transport', 'PTA', 'Examination', 'Uniforms', 'Custom Fee'];

const recipientOptions: TransactionRecipient[] = [
  { id: 'cust-1', name: 'Amina Yusuf', subtitle: 'Retail customer • Balance $120', type: 'Customer' },
  { id: 'stu-1', name: 'Kofi Boateng', subtitle: 'Student • Grade 10', type: 'Student' },
  { id: 'mem-1', name: 'Mabel Okafor', subtitle: 'Member • Active dues', type: 'Member' },
  { id: 'don-1', name: 'Daniel Mensah', subtitle: 'Donor • Sponsorship history', type: 'Donor' },
  { id: 'pat-1', name: 'Grace Tetteh', subtitle: 'Patient • Visit record', type: 'Patient' },
  { id: 'walk-1', name: 'Walk-in Guest', subtitle: 'No prior profile yet', type: 'Walk-in' }
];

const businessRecordCategories = [
  'Product',
  'Service',
  'Customer',
  'Supplier',
  'Employee',
  'Asset/Equipment',
  'Warehouse/Store',
  'Expense Category',
  'Brand',
  'Product Category',
  'Vehicle',
  'Bank Account',
  'Cash Account',
  'Subscription/Membership',
  'Vendor',
  'Other'
] as const;

type BusinessRecordCategory = (typeof businessRecordCategories)[number];

type RecordCategory = BusinessRecordCategory | '';

interface RecordDraft {
  category: RecordCategory | '';
  recordName: string;
  status: 'Active' | 'Inactive';
  note: string;
  description: string;
  tags: string;
  branch: string;
  department: string;
  details: Record<string, string>;
  attachments: string[];
}

interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
  description?: string;
}

const businessCategoryFields: Record<BusinessRecordCategory, FieldDefinition[]> = {
  Product: [
    { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'Enter product name' },
    { key: 'sku', label: 'SKU / Barcode', type: 'text' },
    { key: 'price', label: 'Selling Price', type: 'number' },
    { key: 'cost', label: 'Cost Price', type: 'number' },
    { key: 'stock', label: 'Stock Quantity', type: 'number' },
    { key: 'minStock', label: 'Minimum Stock Level', type: 'number' },
    { key: 'supplier', label: 'Supplier', type: 'text' },
    { key: 'location', label: 'Storage Location', type: 'text' }
  ],
  Service: [
    { key: 'serviceName', label: 'Service Name', type: 'text' },
    { key: 'description', label: 'Service Description', type: 'textarea' },
    { key: 'price', label: 'Service Price', type: 'number' },
    { key: 'duration', label: 'Typical Duration', type: 'text', placeholder: 'e.g., 1 hour' },
    { key: 'provider', label: 'Service Provider', type: 'text' }
  ],
  Customer: [
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'businessName', label: 'Business Name', type: 'text' },
    { key: 'email', label: 'Email Address', type: 'email' },
    { key: 'phone', label: 'Phone Number', type: 'tel' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'creditLimit', label: 'Credit Limit', type: 'number' }
  ],
  Supplier: [
    { key: 'supplierName', label: 'Supplier Name', type: 'text' },
    { key: 'contactPerson', label: 'Contact Person', type: 'text' },
    { key: 'phone', label: 'Phone Number', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'leadTime', label: 'Lead Time (days)', type: 'number' },
    { key: 'paymentTerms', label: 'Payment Terms', type: 'text' }
  ],
  Employee: [
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'employeeId', label: 'Employee ID', type: 'text' },
    { key: 'role', label: 'Role / Position', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone Number', type: 'tel' },
    { key: 'startDate', label: 'Employment Start Date', type: 'date' },
    { key: 'salary', label: 'Salary', type: 'number' }
  ],
  'Asset/Equipment': [
    { key: 'assetName', label: 'Asset / Equipment Name', type: 'text' },
    { key: 'assetTag', label: 'Asset Tag', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Good', 'Fair', 'Needs repair'] },
    { key: 'maintenanceSchedule', label: 'Maintenance Schedule', type: 'text' }
  ],
  'Warehouse/Store': [
    { key: 'locationName', label: 'Location Name', type: 'text' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'manager', label: 'Manager Name', type: 'text' },
    { key: 'capacity', label: 'Storage Capacity', type: 'text' },
    { key: 'phone', label: 'Contact Phone', type: 'tel' }
  ],
  'Expense Category': [
    { key: 'categoryName', label: 'Expense Category Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'budgetLimit', label: 'Budget Limit', type: 'number' },
    { key: 'owner', label: 'Responsible Owner', type: 'text' }
  ],
  Brand: [
    { key: 'brandName', label: 'Brand Name', type: 'text' },
    { key: 'description', label: 'Brand Description', type: 'textarea' },
    { key: 'logoUrl', label: 'Logo URL', type: 'text' }
  ],
  'Product Category': [
    { key: 'categoryName', label: 'Product Category Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'markupPercent', label: 'Standard Markup %', type: 'number' }
  ],
  Vehicle: [
    { key: 'vehicleName', label: 'Vehicle Name / Identifier', type: 'text' },
    { key: 'plateNumber', label: 'Plate Number', type: 'text' },
    { key: 'make', label: 'Make', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'year', label: 'Year', type: 'number' },
    { key: 'driver', label: 'Assigned Driver', type: 'text' }
  ],
  'Bank Account': [
    { key: 'accountName', label: 'Account Name', type: 'text' },
    { key: 'bankName', label: 'Bank Name', type: 'text' },
    { key: 'accountNumber', label: 'Account Number', type: 'text' },
    { key: 'balance', label: 'Opening Balance', type: 'number' }
  ],
  'Cash Account': [
    { key: 'accountName', label: 'Cash Account Name', type: 'text' },
    { key: 'openingBalance', label: 'Opening Balance', type: 'number' },
    { key: 'location', label: 'Location / Holder', type: 'text' }
  ],
  'Subscription/Membership': [
    { key: 'name', label: 'Subscription / Membership Name', type: 'text' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'fee', label: 'Fee', type: 'number' },
    { key: 'renewalFrequency', label: 'Renewal Frequency', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' }
  ],
  Vendor: [
    { key: 'vendorName', label: 'Vendor Name', type: 'text' },
    { key: 'contactPerson', label: 'Contact Person', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'specialization', label: 'Specialization', type: 'text' }
  ],
  Other: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' }
  ]
};

const generalCategoryFields: Record<BusinessRecordCategory, FieldDefinition[]> = businessCategoryFields;

const getRecordCategories = () => businessRecordCategories;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function App() {
  // Mobile app active view - support 10 pages including CRM and Staff Access
  const [activeTab, setActiveTab] = useState<'desk' | 'stock' | 'orders' | 'ai' | 'analytics' | 'procurement' | 'audits' | 'settings' | 'crm' | 'staff' | 'tag'>('desk');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const [appMode, setAppMode] = useState<AppMode>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [tenantAccountType, setTenantAccountType] = useState<OrganizationKind>('business');

  const getWorkspaceRoute = (tab?: typeof activeTab) => tab === 'desk' || !tab ? '/business' : `/business/${tab}`;

  const parsePathToTab = (path: string): typeof activeTab => {
    const segments = path.toLowerCase().split('/').filter(Boolean);
    if (segments[0] !== 'business') return 'desk';
    if (segments.length < 2) return 'desk';
    const tab = segments[1] as typeof activeTab;
    const validTabs: Array<typeof activeTab> = ['desk', 'stock', 'orders', 'ai', 'analytics', 'procurement', 'audits', 'settings', 'crm', 'staff', 'tag'];
    return validTabs.includes(tab) ? tab : 'desk';
  };

  // Dynamic Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [summary, setSummary] = useState<SalesSummary>({
    revenue: 0,
    cost: 0,
    profit: 0,
    totalProducts: 0,
    lowStockCount: 0,
    pendingOrdersCount: 0,
    topSelling: [],
    categoryBreakdown: []
  });

  // Active Session User tracking (defaults to 'owner' i.e. Sabic Rest)
  const [currentOperatorId, setCurrentOperatorId] = useState<string>('owner');

  // Business & Owner Profile Settings
  const [ownerName, setOwnerName] = useState('Workspace Owner');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerRole, setOwnerRole] = useState('Owner');
  const [profilePic, setProfilePic] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80');

  const [businessName, setBusinessName] = useState('Your Business');
  const [businessTaxId, setBusinessTaxId] = useState('');
  const [businessCurrency, setBusinessCurrency] = useState('NGN (₦)');
  const [organizationSetup, setOrganizationSetup] = useState<OrganizationSetupConfig>({
    profileType: 'business',
    name: 'Your Business',
    industry: 'Technology',
    subtype: 'Retail Store',
    location: 'Lagos, Nigeria',
    currency: 'NGN (₦)',
    contactEmail: '',
    contactPhone: '',
    staffCount: 1,
    modules: ['transactions', 'inventory', 'customers', 'staff', 'reports', 'ai'],
    logoUrl: ''
  });
  const [warningThreshold, setWarningThreshold] = useState(5);

  // Interactive Growth Projection State (Percentage)
  const [targetGrowth, setTargetGrowth] = useState(20);

  // Suppliers Procurement State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    specialty: 'Smart Devices & Security',
    leadTime: 5,
    contact: '',
    email: ''
  });

  // Audits & Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [newAuditMessage, setNewAuditMessage] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [startupComplete, setStartupComplete] = useState(false);
  const [splashActive, setSplashActive] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [glowVisible, setGlowVisible] = useState(false);
  const [splashMessageIndex, setSplashMessageIndex] = useState(0);
  const [showDashboardLoader, setShowDashboardLoader] = useState(false);
  const [dashboardLoaderFadeOut, setDashboardLoaderFadeOut] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('product-sale');
  const [transactionTypeMenuOpen, setTransactionTypeMenuOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
  const [pendingAction, setPendingAction] = useState<'transaction' | 'inventory' | null>(null);
  const [editableWindowSeconds, setEditableWindowSeconds] = useState(600);
  const [organizationType, setOrganizationType] = useState<OrganizationKind>('business');
  const [showTagComposer, setShowTagComposer] = useState(false);
  const [tagDraft, setTagDraft] = useState({ recipientId: 'owner', message: '', context: 'stock', note: '' });
  const [tagThreads, setTagThreads] = useState<Array<{ id: string; recipientId: string; recipientName: string; message: string; context: string; note: string; createdAt: string }>>([
    {
      id: 'thread-1',
      recipientId: 'owner',
      recipientName: ownerName,
      message: 'Please confirm the fresh stock count before we dispatch the next batch.',
      context: 'stock',
      note: 'Inventory request',
      createdAt: 'Just now'
    }
  ]);
  const activeOrganizationProfile = getOrganizationProfile('business');
  const transactionLabel = activeOrganizationProfile.terminology.transactionLabel;
  const customerLabel = activeOrganizationProfile.terminology.customerLabel;
  const inventoryLabel = activeOrganizationProfile.terminology.inventoryLabel;
  const staffLabel = activeOrganizationProfile.terminology.staffLabel;
  const dashboardLabel = activeOrganizationProfile.terminology.dashboardLabel;
  const recipientLabel = activeOrganizationProfile.terminology.recipientLabel;
  const summaryLabel = activeOrganizationProfile.terminology.summaryLabel;
  const allRecordCategories = getRecordCategories();
  const inventoryTypeOptions = useMemo<Array<{ id: InventoryType; label: string; description: string }>>(() => [
    { id: 'Products', label: 'Products', description: 'Inventory-led commerce and stock control.' },
    { id: 'Assets', label: 'Assets', description: 'Facilities, shared resources, and long-term value.' },
    { id: 'Equipment', label: 'Equipment', description: 'Tools, devices, and operational gear.' },
    { id: 'Vehicles', label: 'Vehicles', description: 'Fleet vehicles, transport, and operational assets.' },
    { id: 'Custom Inventory', label: 'All Records', description: 'Flexible records for any operational need.' }
  ], []);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [headerSearchOpen, setHeaderSearchOpen] = useState(false);

  const searchableAppItems = useMemo(() => {
    const items: Array<{ id: string; label: string; hint: string; category: string; tab: string; searchText: string }> = [];

    activeOrganizationProfile.navigation.forEach((item) => {
      items.push({
        id: `nav-${item.tab}`,
        label: item.label,
        hint: 'Navigate to a workspace section',
        category: 'Page',
        tab: item.tab,
        searchText: `${item.label} ${item.tab} ${item.label.toLowerCase()}`
      });
    });

    items.push(
      { id: 'profile-home', label: 'Profile & settings', hint: 'Manage organization and account details', category: 'Page', tab: 'settings', searchText: 'profile settings account organization admin setup' },
      { id: 'tag-home', label: 'Tag workspace', hint: 'Open teammate tags and requests', category: 'Page', tab: 'tag', searchText: 'tag workspace requests team note' },
      { id: 'ai-home', label: 'Eenvoq AI', hint: 'Open automation and AI workflows', category: 'Page', tab: 'ai', searchText: 'ai assistant automation workflow smart' }
    );

    products.forEach((product) => {
      items.push({
        id: `product-${product.id}`,
        label: product.name,
        hint: `${product.category} • SKU ${product.sku}`,
        category: 'Inventory',
        tab: 'stock',
        searchText: `${product.name} ${product.sku} ${product.category} ${product.stock} ${product.price}`
      });
    });

    orders.forEach((order) => {
      items.push({
        id: `order-${order.id}`,
        label: `${order.id} • ${order.customerName}`,
        hint: `${order.status} • ${order.totalAmount}`,
        category: 'Orders',
        tab: 'orders',
        searchText: `${order.id} ${order.customerName} ${order.status} ${order.totalAmount} ${order.notes || ''}`
      });
    });

    customers.forEach((customer) => {
      items.push({
        id: `customer-${customer.id}`,
        label: customer.name,
        hint: `${customer.company} • ${customer.email}`,
        category: 'Customers',
        tab: 'crm',
        searchText: `${customer.name} ${customer.company} ${customer.email} ${customer.phone} ${customer.status}`
      });
    });

    staff.forEach((member) => {
      items.push({
        id: `staff-${member.id}`,
        label: member.name,
        hint: `${member.role} • ${member.online ? 'Online' : 'Offline'}`,
        category: 'Staff',
        tab: 'staff',
        searchText: `${member.name} ${member.role} ${member.online ? 'online' : 'offline'} ${member.lastActive}`
      });
    });

    suppliers.forEach((supplier) => {
      items.push({
        id: `supplier-${supplier.id}`,
        label: supplier.name,
        hint: `${supplier.specialty} • Lead time ${supplier.leadTime} days`,
        category: 'Suppliers',
        tab: 'procurement',
        searchText: `${supplier.name} ${supplier.specialty} ${supplier.contact} ${supplier.email}`
      });
    });

    auditLogs.forEach((log) => {
      items.push({
        id: `audit-${log.id}`,
        label: log.message,
        hint: `${log.category} • ${log.timestamp}`,
        category: 'Audit',
        tab: 'audits',
        searchText: `${log.message} ${log.category} ${log.timestamp}`
      });
    });

    tagThreads.forEach((thread) => {
      items.push({
        id: `thread-${thread.id}`,
        label: thread.message,
        hint: `${thread.context} • ${thread.recipientName}`,
        category: 'Tag',
        tab: 'tag',
        searchText: `${thread.message} ${thread.context} ${thread.note} ${thread.recipientName}`
      });
    });

    return items;
  }, [activeOrganizationProfile, products, orders, customers, staff, suppliers, auditLogs, tagThreads]);

  const filteredSearchResults = useMemo(() => {
    const query = headerSearchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return searchableAppItems.filter((item) => item.searchText.toLowerCase().includes(query)).slice(0, 8);
  }, [headerSearchQuery, searchableAppItems]);

  const handleSearchSelect = (item: { tab: string }) => {
    setHeaderSearchQuery('');
    setHeaderSearchOpen(false);
    setMenuOpen(false);
    setActiveTab(item.tab as typeof activeTab);
  };
  const [deskRange, setDeskRange] = useState<'Today' | 'Last 7 Days' | 'Last 30 Days' | 'This Month' | 'Last Month' | 'This Year' | 'Custom Range'>('Last 7 Days');
  const [showDashboardFilterMenu, setShowDashboardFilterMenu] = useState(false);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const [selectedRecipientId, setSelectedRecipientId] = useState('cust-1');
  const [recipientQuery, setRecipientQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: string; productName: string; quantity: number; price: number }>>([]);
  const [serviceSelection, setServiceSelection] = useState('consult');
  const [selectedStudentId, setSelectedStudentId] = useState('stu-1');
  const [selectedMemberId, setSelectedMemberId] = useState('mem-1');
  const [feeCategory, setFeeCategory] = useState('Tuition');
  const [transactionAmount, setTransactionAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [receiptRequested, setReceiptRequested] = useState(true);
  const [receiptDelivered, setReceiptDelivered] = useState(false);
  const [transactionComplete, setTransactionComplete] = useState(false);
  const [transactionReviewMode, setTransactionReviewMode] = useState<'standard' | 'flagged'>('standard');
  const [showTransactionComposer, setShowTransactionComposer] = useState(false);
  const [transactionComposerStep, setTransactionComposerStep] = useState<'form' | 'preview'>('form');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [transactionNotice, setTransactionNotice] = useState('');
  const [transactionDraft, setTransactionDraft] = useState({
    transactionType: 'product-sale' as TransactionType,
    recipientId: 'walk-in',
    category: '',
    inventoryId: '',
    inventoryName: '',
    quantity: 1,
    soldDate: new Date().toISOString().slice(0, 10),
    purchasePrice: 0,
    sellingPrice: 0,
    notes: '',
    paymentMethod: 'Cash' as PaymentMethod,
    currency: businessCurrency || organizationSetup.currency || 'USD ($)'
  });
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddOrderModal, setShowAddOrderModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showInventorySavedModal, setShowInventorySavedModal] = useState(false);
  const [lastActiveTab, setLastActiveTab] = useState<typeof activeTab>('desk');
  const [formSuccessType, setFormSuccessType] = useState<'order' | 'staff' | 'supplier' | null>(null);
  const [supplierDraft, setSupplierDraft] = useState({ name: '', businessName: '', address: '', whatsappNumber: '', specialty: 'General Supply', leadTime: 3, contact: '', email: '' });
  const [recordSupplierSelection, setRecordSupplierSelection] = useState('');
  const [showRecordSupplierComposer, setShowRecordSupplierComposer] = useState(false);
  const [recordSupplierDraft, setRecordSupplierDraft] = useState({ name: '', businessName: '', address: '', whatsappNumber: '', email: '' });
  const [inventoryComposerStep, setInventoryComposerStep] = useState<'form' | 'preview'>('form');
  const [inventoryDraft, setInventoryDraft] = useState({
    inventoryType: 'Products' as InventoryType,
    category: '',
    selectedItemId: '',
    itemName: '',
    quantity: 1,
    purchasePrice: 0,
    sellingPrice: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: '',
    photo: '',
    createCategory: '',
    createItem: ''
  });
  const [recordDraft, setRecordDraft] = useState<RecordDraft>({
    category: '',
    recordName: '',
    status: 'Active',
    note: '',
    description: '',
    tags: '',
    branch: '',
    department: '',
    details: {},
    attachments: []
  });
  const [inventoryDraftMode, setInventoryDraftMode] = useState<'create' | 'edit'>('create');
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [expenseDraft, setExpenseDraft] = useState({
    title: '',
    category: 'Utilities',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    vendor: '',
    product: '',
    notes: '',
    receipt: ''
  });
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [financeSummary, setFinanceSummary] = useState({
    revenue: 0,
    costOfGoods: 0,
    expensesTotal: 0,
    grossProfit: 0,
    netProfit: 0,
    accountsReceivable: 0,
    outstandingOrders: 0,
    expenseBreakdown: [] as Array<{ name: string; value: number }>,
    monthlyTrend: [] as Array<{ month: string; income: number; expenses: number }>
  });
  const [expenseFilter, setExpenseFilter] = useState('All');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showEmailBlastModal, setShowEmailBlastModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Custom states for drag-and-drop upload
  const [dragActive, setDragActive] = useState(false);
  const [productImageBase64, setProductImageBase64] = useState<string>('');

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Smart Devices',
    stock: 20,
    minStock: 5,
    price: 99.99,
    cost: 49.99
  });

  // New Order Form State
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    items: [{ productId: '', quantity: 1 }],
    status: 'Pending' as const
  });

  // New Staff & Customer form states
  const [newStaffMember, setNewStaffMember] = useState({
    name: '',
    role: 'Sales Assistant',
    online: true
  });

  const [newCustomerRecord, setNewCustomerRecord] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'Active' as const
  });

  // Smart Outreach states
  const [outreachSubject, setOutreachSubject] = useState('');
  const [outreachMessage, setOutreachMessage] = useState('');
  const [outreachStatus, setOutreachStatus] = useState<'idle' | 'sending' | 'success'>('idle');
  const [lastTransactionId, setLastTransactionId] = useState('TX-2048');
  const [staffSessions] = useState<Array<{ id: string; name: string; role: string; device: string; status: string }>>([]);
  const [riskAlerts] = useState<Array<{ id: string; label: string; detail: string }>>([]);

  // CRM searching & filtering
  const [crmSearch, setCrmSearch] = useState('');
  const [crmStatusFilter, setCrmStatusFilter] = useState('All');

  // Inventory filter states
  const [inventoryType, setInventoryType] = useState<InventoryType>('Products');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('All');
  const [inventoryAlertFilter, setInventoryAlertFilter] = useState<'All' | 'Low' | 'Out' | 'Active' | 'Needs Attention' | 'Follow-Up Required'>('All');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState('All');
  const [selectedInventoryRecord, setSelectedInventoryRecord] = useState<any | null>(null);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [newInventoryDraft, setNewInventoryDraft] = useState({ name: '', category: '', status: 'Active', note: '' });

  // AI Chat states
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello. Ask me about inventory, sales, or operational actions and I will help you with recommendations based on your current platform data.'
    }
  ]);
  const [userPrompt, setUserPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiGenerating]);

  useEffect(() => {
    const handleResize = () => {
      const nextIsDesktop = window.innerWidth >= 1024;
      setIsDesktop(nextIsDesktop);
      if (nextIsDesktop) {
        setMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const session = {
      isLoggedIn: appMode === 'app',
      appMode,
      activeTab,
      authMode,
      userId: authUserId,
      accountType: tenantAccountType
    };
    localStorage.setItem('eenvoq-session', JSON.stringify(session));
  }, [appMode, activeTab, authMode, authUserId, tenantAccountType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionData = localStorage.getItem('eenvoq-session');
    if (sessionData) {
      try {
        const savedSession = JSON.parse(sessionData) as { isLoggedIn: boolean; appMode: AppMode; activeTab: typeof activeTab; authMode: 'login' | 'signup'; userId?: string | null; accountType?: OrganizationKind };
        if (savedSession.isLoggedIn) {
          const pathTab = parsePathToTab(window.location.pathname);
          const initialTab = pathTab !== 'desk' || window.location.pathname.toLowerCase().includes('/business/') ? pathTab : savedSession.activeTab;
          setActiveTab(initialTab || 'desk');
          setAppMode(savedSession.appMode || 'app');
          setAuthMode(savedSession.authMode);
          if (savedSession.userId) {
            setAuthUserId(savedSession.userId);
          }
          setTenantAccountType('business');
          setOrganizationType('business');
        } else {
          setAppMode('auth');
          setAuthMode(savedSession.authMode || 'login');
        }
      } catch (error) {
        console.error('Unable to restore session state', error);
      }
    }

    const savedConfig = localStorage.getItem('eenvoq-organization-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig) as OrganizationSetupConfig;
        setOrganizationSetup({ ...parsed, profileType: 'business' });
        setBusinessName(parsed.name || 'Your Business');
        setBusinessCurrency(parsed.currency || 'NGN (₦)');
        setOrganizationType('business');
      } catch (error) {
        console.error('Unable to restore organization config', error);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('eenvoq-organization-config', JSON.stringify(organizationSetup));
  }, [organizationSetup]);

  useEffect(() => {
    if (typeof window === 'undefined' || appMode !== 'app') return;
    const expectedPath = getWorkspaceRoute(activeTab);
    const currentPath = window.location.pathname;
    if (currentPath !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, [appMode, activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [appMode, activeTab, authMode]);

  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const applyTheme = (color: string) => {
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', color);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = color;
        document.head.appendChild(meta);
      }
      document.documentElement.style.setProperty('color-scheme', 'light');
    };

    if (appMode === 'auth' || appMode === 'onboarding' || appMode === 'app') {
      applyTheme('#021201');
    }
  }, [appMode]);

  useEffect(() => {
    if (appMode !== 'app') {
      setSplashActive(false);
      setLogoVisible(false);
      setGlowVisible(false);
      setSplashMessageIndex(0);
      setStartupComplete(true);
      return;
    }

    setSplashActive(true);
    setLogoVisible(false);
    setGlowVisible(false);
    setSplashMessageIndex(0);
    setStartupComplete(false);

    const logoTimer = window.setTimeout(() => setLogoVisible(true), 40);
    const glowTimer = window.setTimeout(() => setGlowVisible(true), 560);
    const glowFadeTimer = window.setTimeout(() => setGlowVisible(false), 1120);
    const messageTimer = window.setInterval(() => {
      setSplashMessageIndex((currentIndex) => (currentIndex + 1) % splashMessages.length);
    }, 800);

    return () => {
      window.clearTimeout(logoTimer);
      window.clearTimeout(glowTimer);
      window.clearTimeout(glowFadeTimer);
      window.clearInterval(messageTimer);
    };
  }, [appMode, splashMessages.length]);

  useEffect(() => {
    if (!showDashboardLoader) return;
    setDashboardLoaderFadeOut(false);
    const fadeTimer = window.setTimeout(() => setDashboardLoaderFadeOut(true), 1000);
    const hideTimer = window.setTimeout(() => setShowDashboardLoader(false), 1400);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [showDashboardLoader]);

  // Initial Data Fetching
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [resProd, resOrders, resSum, resStaff, resCust, resSuppliers, resExpenses, resFinance] = await Promise.all([
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/sales-summary').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/finance-summary').then(r => r.json())
      ]);

      setProducts(resProd);
      setOrders(resOrders);
      setSummary(resSum);
      setStaff(resStaff);
      setCustomers(resCust);
      setSuppliers(resSuppliers);
      setExpenses(resExpenses);
      setFinanceSummary(resFinance);
    } catch (e) {
      console.error('Error fetching data from API:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeApp = async () => {
      if (appMode !== 'app') {
        setStartupComplete(true);
        return;
      }

      try {
        await Promise.allSettled([loadAllData(), loadOrganizationConfig()]);
      } catch (error) {
        console.error('Unable to initialize app data', error);
      } finally {
        if (!cancelled) {
          setStartupComplete(true);
          setSplashActive(false);
        }
      }
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, [appMode]);

  // Helper: Active Session User Name
  const getOperatorName = () => {
    if (currentOperatorId === 'owner') return ownerName;
    const found = staff.find(s => s.id === currentOperatorId);
    return found ? found.name : ownerName;
  };

  const applyDemoAccount = (demoKey: DemoAccountKey) => {
    const config = getDemoLoginConfig(demoKey);
    const nextConfig: OrganizationSetupConfig = {
      profileType: config.profileType,
      name: config.name,
      industry: config.industry,
      subtype: config.subtype,
      location: config.location,
      currency: config.currency,
      contactEmail: config.contactEmail,
      contactPhone: config.contactPhone,
      staffCount: config.staffCount,
      modules: getOrganizationProfile(config.profileType).defaultModules,
      logoUrl: config.logoUrl
    };

    setAuthName(config.name);
    setAuthEmail(config.contactEmail);
    setAuthPassword('demo-pass');
    setAuthError('');
    setOwnerName(config.name);
    setOwnerEmail(config.contactEmail);
    setOwnerRole('Owner');
    setProfilePic('https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80');
    setOrganizationSetup(nextConfig);
    setBusinessName(config.name);
    setBusinessCurrency(config.currency);
    setOrganizationType('business');
    setTenantAccountType('business');
    setShowDashboardLoader(true);
    setAppMode('app');
    setActiveTab('desk');
    setAuthMode('login');

    if (typeof window !== 'undefined') {
      localStorage.setItem('eenvoq-organization-config', JSON.stringify(nextConfig));
      localStorage.setItem('eenvoq-session', JSON.stringify({
        isLoggedIn: true,
        appMode: 'app',
        activeTab: 'desk',
        authMode: 'login',
        userId: `demo-${demoKey}`,
        accountType: config.profileType
      }));
    }
  };

  const handleAuthSubmit = async (mode: 'login' | 'signup') => {
    setAuthError('');
    setAuthLoading(true);

    try {
      if (mode === 'signup') {
const availabilityResponse = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail.trim().toLowerCase() })
        });

        const availabilityPayload = await availabilityResponse.json().catch(() => ({}));
        if (!availabilityResponse.ok) {
          throw new Error(availabilityPayload.error || 'Unable to validate email address.');
        }

        if (!availabilityPayload.available) {
          throw new Error('An account with this email address already exists. Please sign in using this email or register with a different email address.');
        }
      }

      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim().toLowerCase(),
          password: authPassword,
          fullName: authName.trim(),
          organizationConfig: {
            ...organizationSetup,
            name: businessName,
            contactEmail: authEmail.trim().toLowerCase(),
            currency: businessCurrency
          }
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Authentication failed.');
      }

      setAuthUserId(payload.user?.id || null);
      const nextAccountType = 'business';
      const businessPayload = payload.business || {};
      const profilePayload = payload.profile || {};

      setOwnerName(profilePayload.full_name || authName.trim() || ownerName);
      setOwnerEmail(profilePayload.email || authEmail.trim().toLowerCase());
      setBusinessName(businessPayload.name || businessName);
      setBusinessCurrency(businessPayload.currency || businessCurrency || organizationSetup.currency || 'NGN (₦)');
      setTenantAccountType(nextAccountType);
      setOrganizationType(nextAccountType);
      setOrganizationSetup((current) => ({
        ...current,
        profileType: nextAccountType,
        name: businessPayload.name || current.name,
        industry: businessPayload.industry || current.industry,
        subtype: businessPayload.subtype || current.subtype,
        location: businessPayload.location || current.location,
        currency: businessPayload.currency || current.currency,
        contactEmail: businessPayload.contact_email || profilePayload.email || current.contactEmail,
        contactPhone: businessPayload.contact_phone || current.contactPhone,
        modules: Array.isArray(businessPayload.modules) ? businessPayload.modules : current.modules,
        logoUrl: businessPayload.logo_url || current.logoUrl
      }));
      setAuthPassword('');
      setPasswordVisible(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem('eenvoq-session', JSON.stringify({
          isLoggedIn: true,
          appMode: mode === 'signup' ? 'onboarding' : 'app',
          activeTab: 'desk',
          authMode: 'login',
          userId: payload.user?.id || null,
          accountType: nextAccountType
        }));
      }

      if (mode === 'signup') {
        setAppMode('onboarding');
        setActiveTab('desk');
        setAuthMode('login');
      } else {
        setShowDashboardLoader(true);
        setAppMode('app');
        setActiveTab('desk');
        setAuthMode('login');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eenvoq-session');
      window.history.replaceState({}, '', '/');
    }
    setAppMode('onboarding');
    setActiveTab('desk');
    setAuthMode('login');
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setAuthError('');
    setPasswordVisible(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const userFirstName = authName.trim().split(' ')[0] || ownerName.split(' ')[0] || 'there';
  const dashboardHeroLabel = `${businessName} ${dashboardLabel}`.trim();

  const loadOrganizationConfig = async () => {
    try {
      const url = authUserId ? `/api/organization-config?userId=${encodeURIComponent(authUserId)}` : '/api/organization-config';
      const response = await fetch(url);
      if (!response.ok) return;
      const config = await response.json() as OrganizationSetupConfig;
      const nextAccountType = 'business' as OrganizationKind;
      setOrganizationSetup(config);
      setBusinessName(config.name || 'Your Business');
      setBusinessCurrency(config.currency || 'NGN (₦)');
      setOrganizationType(nextAccountType);
      setTenantAccountType(nextAccountType);
    } catch (error) {
      console.error('Unable to load organization config', error);
    }
  };

  const handleOrganizationSetup = async (config: OrganizationSetupConfig) => {
    const nextAccountType = 'business' as OrganizationKind;
    setOrganizationSetup(config);
    setBusinessName(config.name || 'Your Business');
    setBusinessCurrency(config.currency || 'NGN (₦)');
    setOrganizationType(nextAccountType);
    setTenantAccountType(nextAccountType);
    setAppMode('app');
    setActiveTab('desk');

    if (typeof window !== 'undefined') {
      localStorage.setItem('eenvoq-organization-config', JSON.stringify(config));
      try {
        await fetch('/api/organization-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...config, userId: authUserId })
        });
      } catch (error) {
        console.error('Unable to persist organization config', error);
      }
    }
  };

  const getTransactionTotals = () => {
    const baseSubtotal = transactionType === 'product-sale'
      ? selectedProducts.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : transactionType === 'service-payment'
        ? (serviceTemplates.find((service) => service.id === serviceSelection)?.price ?? 0)
        : transactionAmount;

    const discountAmount = baseSubtotal * (discountPercent / 100);
    const taxAmount = (baseSubtotal - discountAmount) * (taxPercent / 100);
    const total = baseSubtotal - discountAmount + taxAmount;

    return { baseSubtotal, discountAmount, taxAmount, total };
  };

  const transactionTotals = getTransactionTotals();

  const isOwnerSession = currentOperatorId === 'owner' || Boolean(authUserId);

  const requestOwnerAccess = (detail: string) => {
    setConfirmAction({
      title: 'Owner-only access',
      description: `${detail} Please switch to the owner session or contact support at support@eenvoq.com.ng for assistance.`,
      onConfirm: () => setConfirmAction(null)
    });
    return false;
  };

  const canEditRecord = () => isOwnerSession;

  const logAudit = (category: AuditLog['category'], message: string) => {
    setAuditLogs(prev => [{ id: `log-${Date.now()}`, timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '), category, message }, ...prev]);
  };

  const handleResetTransaction = () => {
    setShowTransactionComposer(false);
    setTransactionComposerStep('form');
    setEditingOrderId(null);
    setTransactionNotice('');
    setTransactionDraft({
      transactionType: 'product-sale',
      recipientId: 'walk-in',
      category: '',
      inventoryId: '',
      inventoryName: '',
      quantity: 1,
      soldDate: new Date().toISOString().slice(0, 10),
      purchasePrice: 0,
      sellingPrice: 0,
      notes: '',
      paymentMethod: 'Cash',
      currency: businessCurrency || organizationSetup.currency || 'USD ($)'
    });
    setReceiptRequested(true);
    setReceiptDelivered(false);
    setTransactionComplete(false);
  };

  const canManageTransactions = currentOperatorId === 'owner' || !!staff.find((member) => member.id === currentOperatorId && member.role.toLowerCase().includes('manager'));

  const getCurrencySymbol = (currency = transactionDraft.currency || businessCurrency || organizationSetup.currency || 'NGN (₦)') => {
    const match = currency.match(/\(([^)]+)\)/);
    return match?.[1] || currency.split(' ')[0] || '₦';
  };

  const formatCurrencyValue = (value: number, currency = transactionDraft.currency || businessCurrency || organizationSetup.currency || 'NGN (₦)') => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${value.toFixed(2)}`;
  };

  const submitTransaction = async () => {
    const selectedInventoryItem = transactionInventoryCatalog.find((record) => record.id === transactionDraft.inventoryId);
    const purchasePrice = Number(transactionDraft.purchasePrice || selectedInventoryItem?.purchasePrice || 0);
    const sellingPrice = Number(transactionDraft.sellingPrice || 0);
    const quantity = Math.max(1, Number(transactionDraft.quantity || 1));
    const saleTotal = sellingPrice * quantity;
    const costTotal = purchasePrice * quantity;
    const profit = saleTotal - costTotal;
    const balanceDue = Math.max(0, saleTotal);
    const recipientName = transactionDraft.recipientId === 'walk-in'
      ? 'Walk-in customer'
      : customers.find((customer) => customer.id === transactionDraft.recipientId)?.name || 'Walk-in customer';
    const operatorName = getOperatorName();
    const payload = {
      customerName: recipientName,
      items: [{
        productId: selectedInventoryItem?.productId || selectedInventoryItem?.id || `inventory-${Date.now()}`,
        productName: selectedInventoryItem?.name || transactionDraft.inventoryName || 'Selected item',
        quantity,
        price: sellingPrice,
        purchasePrice,
        transactionType: transactionDraft.transactionType,
        category: transactionDraft.category || selectedInventoryItem?.category,
        inventoryId: transactionDraft.inventoryId || selectedInventoryItem?.id,
        inventoryName: selectedInventoryItem?.name || transactionDraft.inventoryName,
        inventoryPhoto: selectedInventoryItem?.image || '',
        saleDate: transactionDraft.soldDate,
        sellingPrice,
        profit,
        balanceDue,
        currency: transactionDraft.currency || businessCurrency || organizationSetup.currency || 'NGN (₦)',
        notes: transactionDraft.notes
      }],
      totalAmount: saleTotal,
      status: 'Completed',
      recordedBy: operatorName,
      transactionType: transactionDraft.transactionType,
      recipientId: transactionDraft.recipientId,
      recipientName,
      category: transactionDraft.category || selectedInventoryItem?.category,
      inventoryId: transactionDraft.inventoryId || selectedInventoryItem?.id,
      inventoryName: selectedInventoryItem?.name || transactionDraft.inventoryName,
      inventoryPhoto: selectedInventoryItem?.image || '',
      saleDate: transactionDraft.soldDate,
      purchasePrice,
      sellingPrice,
      profit,
      balanceDue,
      currency: transactionDraft.currency || businessCurrency || organizationSetup.currency || 'USD ($)',
      notes: transactionDraft.notes
    };

    try {
      const method = editingOrderId ? 'PUT' : 'POST';
      const response = await fetch(editingOrderId ? `/api/orders/${editingOrderId}` : '/api/orders', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Unable to save transaction.');
      }

      setReceiptDelivered(receiptRequested);
      setTransactionComplete(true);
      setTransactionNotice(editingOrderId ? 'Transaction updated and stored.' : 'Transaction recorded and stored.');
      setLastTransactionId(editingOrderId || `TX-${Math.floor(1000 + Math.random() * 9000)}`);
      setShowTransactionComposer(false);
      setTransactionComposerStep('form');
      setEditingOrderId(null);
      await loadAllData();
      handleResetTransaction();
    } catch (error) {
      console.error(error);
      setTransactionNotice(error instanceof Error ? error.message : 'Unable to save transaction.');
    }
  };

  const openTransactionComposer = (order?: Order | null) => {
    if (order) {
      const firstItem = order.items[0];
      setEditingOrderId(order.id);
      setTransactionDraft({
        transactionType: (order.transactionType || 'product-sale') as TransactionType,
        recipientId: order.recipientId || 'walk-in',
        category: order.category || '',
        inventoryId: order.inventoryId || '',
        inventoryName: order.inventoryName || firstItem?.productName || '',
        quantity: firstItem?.quantity || 1,
        soldDate: order.saleDate ? order.saleDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        purchasePrice: order.purchasePrice || firstItem?.purchasePrice || 0,
        sellingPrice: order.sellingPrice || firstItem?.sellingPrice || order.totalAmount || 0,
        notes: order.notes || '',
        paymentMethod: 'Cash',
        currency: order.currency || businessCurrency || organizationSetup.currency || 'NGN (₦)'
      });
    } else {
      setEditingOrderId(null);
      setTransactionDraft((prev) => ({ ...prev, transactionType: 'product-sale', recipientId: 'walk-in', category: '', inventoryId: '', inventoryName: '', quantity: 1, soldDate: new Date().toISOString().slice(0, 10), purchasePrice: 0, sellingPrice: 0, notes: '', currency: businessCurrency || organizationSetup.currency || 'NGN (₦)' }));
    }
    setShowTransactionComposer(true);
    setTransactionComposerStep('form');
    setTransactionNotice('');
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to delete transaction.');
      }
      await loadAllData();
      setTransactionNotice('Transaction deleted.');
    } catch (error) {
      console.error(error);
      setTransactionNotice(error instanceof Error ? error.message : 'Unable to delete transaction.');
    }
  };

  // Helper: Drag-and-drop file readers for product images
  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProductImageBase64(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // API Call: Add new product with image attachment support
  const openInventoryComposer = () => {
    if (!isOwnerSession) {
      requestOwnerAccess('Only the primary owner can create inventory records.');
      return;
    }
    setInventoryComposerStep('form');
    setRecordDraft({
      category: '',
      recordName: '',
      status: 'Active',
      note: '',
      description: '',
      tags: '',
      branch: '',
      department: '',
      details: {},
      attachments: []
    });
    setRecordSupplierSelection('');
    setShowRecordSupplierComposer(false);
    setRecordSupplierDraft({ name: '', businessName: '', address: '', whatsappNumber: '', email: '' });
    setProductImageBase64('');
    setShowAddProductModal(true);
  };

  const closeInventoryComposer = () => {
    setShowAddProductModal(false);
    setInventoryComposerStep('form');
    setRecordSupplierSelection('');
    setShowRecordSupplierComposer(false);
    setRecordSupplierDraft({ name: '', businessName: '', address: '', whatsappNumber: '', email: '' });
    setProductImageBase64('');
  };

  const handleInventoryComposerSubmit = async (event?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
    }

    if (inventoryComposerStep === 'form') {
      setInventoryComposerStep('preview');
      return;
    }

    if (!isOwnerSession) {
      requestOwnerAccess('Only the primary owner can create inventory records.');
      return;
    }

    const selectedCategory = recordDraft.category || 'Other';
    const recordName = (recordDraft.recordName || `${selectedCategory} record`).trim();

    // Category-specific ID prefixing
    const catKey = selectedCategory.toLowerCase();
    let idPrefix = 'REC';
    if (catKey.includes('product')) idPrefix = 'PRD';
    else if (catKey.includes('customer')) idPrefix = 'CUST';
    else if (catKey.includes('student')) idPrefix = 'STU';
    else if (catKey.includes('supplier') || catKey.includes('vendor')) idPrefix = 'SUP';

    const generatedRecordId = `${idPrefix}-${Date.now().toString().slice(-6)}`;

    // Simple validations for key categories
    if (idPrefix === 'PRD') {
      const nameField = recordDraft.details['productName'] || recordDraft.recordName || '';
      if (!nameField.trim()) {
        setTransactionNotice('Please provide a Product Name before saving.');
        setInventoryComposerStep('form');
        return;
      }
    }

    if (idPrefix === 'CUST') {
      const custName = recordDraft.details['fullName'] || recordDraft.details['businessName'] || recordDraft.recordName || '';
      if (!custName.trim()) {
        setTransactionNotice('Please provide a Customer name or business name before saving.');
        setInventoryComposerStep('form');
        return;
      }
    }

    if (idPrefix === 'STU') {
      const first = recordDraft.details['firstName'] || '';
      const last = recordDraft.details['lastName'] || '';
      if (!first.trim() || !last.trim()) {
        setTransactionNotice('Please provide at least first and last name for the student.');
        setInventoryComposerStep('form');
        return;
      }
    }

    // Inject auto-generated IDs into details where applicable
    const detailsWithIds = { ...recordDraft.details };
    if (idPrefix === 'PRD') detailsWithIds['productId'] = generatedRecordId;
    if (idPrefix === 'CUST') detailsWithIds['customerId'] = generatedRecordId;
    if (idPrefix === 'STU') {
      detailsWithIds['studentId'] = generatedRecordId;
      if (!detailsWithIds['admissionNumber']) detailsWithIds['admissionNumber'] = generatedRecordId;
    }

    const unitPrice = Number(detailsWithIds.price || 0);
    const costPrice = Number(detailsWithIds.cost || 0);
    const stockValue = Number(detailsWithIds.stock || 0);
    const minStockValue = Number(detailsWithIds.minStock || 0);

    const payload = {
      name: recordName,
      sku: generatedRecordId,
      category: selectedCategory,
      status: recordDraft.status,
      note: recordDraft.note,
      details: detailsWithIds,
      attachments: recordDraft.attachments,
      createdBy: getOperatorName(),
      lastModifiedBy: getOperatorName(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      image: productImageBase64 || '',
      price: unitPrice,
      cost: costPrice,
      stock: stockValue,
      minStock: minStockValue,
      currency: businessCurrency || organizationSetup.currency || 'NGN (₦)'
    };

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Unable to save the intake record.');
      }

      const savedRecord = await response.json();
      logAudit('Inventory', `Recorded ${recordName} under ${selectedCategory}.`);
      setProducts((current) => [savedRecord, ...current]);
      setSelectedInventoryRecord(savedRecord);
      setInventoryType(selectedCategory === 'Product' ? 'Products' : selectedCategory === 'Supplier' || selectedCategory === 'Vendor' ? 'Custom Inventory' : 'Products');
      setShowAddProductModal(false);
      setInventoryComposerStep('form');
      setProductImageBase64('');
      setRecordDraft({
        category: '',
        recordName: '',
        status: 'Active',
        note: '',
        description: '',
        tags: '',
        branch: '',
        department: '',
        details: {},
        attachments: []
      });
      setRecordSupplierSelection('');
      setShowRecordSupplierComposer(false);
      setRecordSupplierDraft({ name: '', businessName: '', address: '', whatsappNumber: '', email: '' });
      setShowInventorySavedModal(true);
      await loadAllData();
    } catch (err) {
      console.error(err);
      setTransactionNotice(err instanceof Error ? err.message : 'Unable to save the intake record.');
    }
  };

  // Auto-dismiss success modal and navigate to stock page
  useEffect(() => {
    if (showInventorySavedModal) {
      const timer = setTimeout(() => {
        setShowInventorySavedModal(false);
        setActiveTab('stock');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showInventorySavedModal]);

  // API Call: Edit product
  const handleExpenseDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerSession) {
      requestOwnerAccess('Only the primary owner can record operational costs.');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseDraft,
          amount: Number(expenseDraft.amount || 0),
          recordedBy: getOperatorName()
        })
      });

      if (!response.ok) {
        throw new Error('Unable to save the operating cost.');
      }

      setExpenseDraft({
        title: '',
        category: 'Utilities',
        amount: 0,
        date: new Date().toISOString().slice(0, 10),
        vendor: '',
        product: '',
        notes: '',
        receipt: ''
      });
      await loadAllData();
      logAudit('Inventory', `Recorded operating cost ${expenseDraft.title || 'expense'}.`);
    } catch (error) {
      console.error(error);
      setTransactionNotice(error instanceof Error ? error.message : 'Unable to save the operating cost.');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!canEditRecord()) {
      requestOwnerAccess('Only the primary owner can edit inventory records.');
      return;
    }
    try {
      const response = await fetch(`/api/inventory/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      if (response.ok) {
        setEditingProduct(null);
        logAudit('Inventory', `Updated inventory item ${editingProduct.name}.`);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Delete product
  const handleDeleteProduct = async (productId: string) => {
    const product = products.find((entry) => entry.id === productId);
    if (!product || !canEditRecord()) {
      requestOwnerAccess('Only the primary owner can remove inventory records.');
      return;
    }
    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        logAudit('Inventory', `Deleted inventory item ${productId}.`);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Quick stock replenish
  const handleQuickRestock = async (productId: string, amount: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !canEditRecord()) {
      requestOwnerAccess('Only the primary owner can adjust inventory levels.');
      return;
    }
    try {
      const updatedStock = (product.stock ?? 0) + amount;
      const response = await fetch(`/api/inventory/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: updatedStock })
      });
      if (response.ok) {
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredItems = newOrder.items.filter(item => item.productId !== '');
    if (filteredItems.length === 0) return;

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: newOrder.customerName,
          items: filteredItems,
          status: newOrder.status,
          recordedBy: getOperatorName()
        })
      });

      if (response.ok) {
        setShowAddOrderModal(false);
        setFormSuccessType('order');
        setNewOrder({
          customerName: '',
          items: [{ productId: '', quantity: 1 }],
          status: 'Pending'
        });
        
        // Log to ledger
        logAudit('Sales', `Sale recorded by ${getOperatorName()} for customer ${newOrder.customerName}.`);

        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add new Staff member
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaffMember)
      });
      if (response.ok) {
        setShowAddStaffModal(false);
        setFormSuccessType('staff');
        setNewStaffMember({ name: '', role: 'Sales Assistant', online: true });
        logAudit('Security', `Business owner registered new staff member: ${newStaffMember.name}.`);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Toggle staff member online/offline status
  const handleToggleStaffOnline = async (staffId: string, currentOnline: boolean) => {
    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ online: !currentOnline })
      });
      if (response.ok) {
        const found = staff.find(s => s.id === staffId);
        logAudit('Security', `Staff member ${found ? found.name : 'Unknown'} set to ${!currentOnline ? 'Online' : 'Offline'}.`);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Delete staff member
  const handleDeleteStaff = async (staffId: string) => {
    try {
      const response = await fetch(`/api/staff/${staffId}`, { method: 'DELETE' });
      if (response.ok) {
        logAudit('Security', `Removed staff member ${staffId}.`);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add new Customer to CRM
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerRecord)
      });
      if (response.ok) {
        setShowAddCustomerModal(false);
        setNewCustomerRecord({ name: '', email: '', phone: '', company: '', status: 'Active' });
        const newLog: AuditLog = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
          category: 'System',
          message: `Added new CRM customer contact: ${newCustomerRecord.name}.`
        };
        setAuditLogs(prev => [newLog, ...prev]);
        await loadAllData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulated Marketing Outreach campaign
  const handleTriggerOutreach = (e: React.FormEvent) => {
    e.preventDefault();
    setOutreachStatus('sending');
    setTimeout(() => {
      setOutreachStatus('success');
      logAudit('System', `Dispatched campaign outreach "${outreachSubject}" targeting ${customers.length} registered customers.`);
      setTimeout(() => {
        setShowEmailBlastModal(false);
        setOutreachStatus('idle');
        setOutreachSubject('');
        setOutreachMessage('');
      }, 1500);
    }, 1500);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierDraft.name.trim() || !supplierDraft.email.trim()) {
      setTransactionNotice('Please enter a supplier name and email before saving.');
      return;
    }

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...supplierDraft,
          contact: supplierDraft.whatsappNumber || supplierDraft.contact,
          specialty: supplierDraft.specialty || 'General Supply',
          leadTime: Number(supplierDraft.leadTime) || 3
        })
      });

      if (!response.ok) {
        throw new Error('Unable to save supplier.');
      }

      setSupplierDraft({ name: '', businessName: '', address: '', whatsappNumber: '', specialty: 'General Supply', leadTime: 3, contact: '', email: '' });
      setShowAddSupplierModal(false);
      setFormSuccessType('supplier');
      await loadAllData();
      logAudit('Procurement', `Registered supplier partner ${supplierDraft.name}.`);
      setTransactionNotice(`Saved ${supplierDraft.name} to your supplier roster.`);
    } catch (error) {
      console.error(error);
      setTransactionNotice(error instanceof Error ? error.message : 'Unable to save supplier.');
    }
  };

  // API Call: Submit prompt to Gemini Chat
  const handleSendPrompt = async (promptText?: string) => {
    const textToSend = promptText || userPrompt;
    if (!textToSend.trim() || aiGenerating) return;

    const updatedMessages = [...chatMessages, { role: 'user' as const, content: textToSend }];
    setChatMessages(updatedMessages);
    setUserPrompt('');
    setAiGenerating(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages })
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        const errorData = await response.json();
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `AI service error: ${errorData.details || errorData.error || 'Failed to analyze records.'}` 
        }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Network error: Could not reach the Eenvoq AI server.` 
      }]);
    } finally {
      setAiGenerating(false);
    }
  };

  // Quick Action SKU generator helper for creation form
  const generateSuggestedSKU = () => {
    if (!newProduct.name) return;
    const cleanPrefix = newProduct.category.substring(0, 3).toUpperCase();
    const cleanName = newProduct.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setNewProduct(prev => ({
      ...prev,
      sku: `EVQ-${cleanPrefix}-${cleanName}${randomSuffix}`
    }));
  };

  useEffect(() => {
    setInventoryCategoryFilter('All');
    setInventoryAlertFilter('All');
    setInventoryStatusFilter('All');
    setInventorySearch('');
    setSelectedInventoryRecord(null);
  }, [inventoryType]);

  useEffect(() => {
    const allowedTypes = new Set(inventoryTypeOptions.map((option) => option.id));
    if (!allowedTypes.has(inventoryType)) {
      setInventoryType(inventoryTypeOptions[0]?.id ?? 'Products');
    }
  }, [inventoryType, inventoryTypeOptions]);

  // Track active tab changes to enable returning to previous page
  useEffect(() => {
    setLastActiveTab(activeTab);
  }, [activeTab]);

  // Handle form success modals - auto-close and navigate back
  useEffect(() => {
    if (formSuccessType) {
      const timer = setTimeout(() => {
        setFormSuccessType(null);
        setActiveTab(lastActiveTab);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [formSuccessType, lastActiveTab]);

  const recordRows = products.map((record) => {
    const displayName = record.name || record.title || 'Untitled record';
    const displayCategory = record.category || 'Uncategorized';
    const displayStatus = record.status || (record.stock === 0 ? 'Out of Stock' : 'Active');
    const displayPrice = record.price !== undefined ? formatCurrency(record.price) : undefined;
    const displayValue = record.value ?? (record.stock !== undefined && record.price !== undefined ? record.stock * record.price : undefined);

    return {
      id: record.id,
      name: displayName,
      subtitle: record.sku ? `${record.sku} • ${displayCategory}` : displayCategory,
      category: displayCategory,
      status: displayStatus,
      primaryMetric: record.stock !== undefined ? `${record.stock} units` : record.details?.attendance || record.details?.Class || 'Active',
      secondaryMetric: displayPrice || record.details?.balance || record.details?.feeStatus || '',
      tags: [displayCategory],
      timeline: [{ label: 'Updated', detail: record.updatedAt || 'Recently' }],
      aiInsight: displayStatus === 'Out of Stock'
        ? 'This record has hit a critical status and needs attention.'
        : displayStatus === 'Low Stock' || displayStatus === 'Needs Attention'
          ? 'This record is nearing a review threshold and may require follow-up.'
          : 'This record is healthy and operating within expected ranges.',
      details: {
        Category: displayCategory,
        ...(record.details || {})
      },
      owner: record.lastModifiedBy || record.owner || 'Team',
      lastUpdated: record.updatedAt || record.lastUpdated || 'Today',
      stock: record.stock,
      unitPrice: record.price,
      value: displayValue
    };
  });

  const transactionInventoryCatalog = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    purchasePrice: product.cost ?? 0,
    sellingPrice: product.price ?? 0,
    image: product.image || '',
    stock: product.stock ?? 0,
    inventoryType: 'Products' as const,
    productId: product.id
  }));

  const sortedOrders = [...orders].sort((a, b) => {
    const aDate = new Date(a.date || '').getTime() || 0;
    const bDate = new Date(b.date || '').getTime() || 0;
    return bDate - aDate;
  });

  const transactionCategoryOptions = Array.from(new Set(transactionInventoryCatalog.map((item) => item.category))).sort();
  const selectedTransactionItem = transactionInventoryCatalog.find((item) => item.id === transactionDraft.inventoryId);
  const inventoryCategoryOptions = Array.from(new Set(products.map((product) => product.category))).sort();
  const inventoryChoiceOptions = products.filter((product) => product.category === inventoryDraft.category || !inventoryDraft.category);
  const saleQuantity = Math.max(1, Number(transactionDraft.quantity || 1));
  const saleCost = Number(selectedTransactionItem?.purchasePrice || transactionDraft.purchasePrice || 0) * saleQuantity;
  const saleRevenue = Number(transactionDraft.sellingPrice || selectedTransactionItem?.sellingPrice || 0) * saleQuantity;
  const saleProfit = saleRevenue - saleCost;
  const balanceDue = Math.max(0, saleRevenue);

  const inventoryTypeCategoryMap: Record<InventoryType, string[]> = {
    Products: ['Product', 'Service', 'Brand', 'Product Category', 'Asset/Equipment', 'Vehicle', 'Warehouse/Store'],
    Members: ['Subscription/Membership'],
    Patients: ['Patient'],
    Assets: ['Asset/Equipment'],
    Equipment: ['Asset/Equipment'],
    Vehicles: ['Vehicle'],
    'Custom Inventory': []
  };

  const inventoryRows = inventoryType === 'Custom Inventory'
    ? recordRows
    : recordRows.filter((record) => inventoryTypeCategoryMap[inventoryType].length === 0 || inventoryTypeCategoryMap[inventoryType].includes(record.category));

  const filteredInventory = inventoryRows.filter((record) => {
    const searchValue = `${record.name} ${record.subtitle} ${record.category} ${record.tags.join(' ')}`.toLowerCase();
    const matchesSearch = !inventorySearch || searchValue.includes(inventorySearch.toLowerCase());
    const matchesCategory = inventoryCategoryFilter === 'All' || record.category === inventoryCategoryFilter;
    const matchesAlert = inventoryType === 'Products'
      ? inventoryAlertFilter === 'All'
        ? true
        : inventoryAlertFilter === 'Low'
          ? record.status === 'Low Stock'
          : record.status === 'Out of Stock'
      : inventoryAlertFilter === 'All'
        ? true
        : inventoryAlertFilter === 'Active'
          ? record.status === 'Active'
          : inventoryAlertFilter === 'Needs Attention'
            ? record.status === 'Needs Attention'
            : record.status === 'Follow-Up Required';
    const matchesStatus = inventoryStatusFilter === 'All' || record.status === inventoryStatusFilter;

    return matchesSearch && matchesCategory && matchesAlert && matchesStatus;
  });

  const categories = ['All', ...allRecordCategories];
  const statusOptions = inventoryType === 'Products'
    ? ['All', 'Healthy', 'Low Stock', 'Out of Stock']
    : inventoryType === 'Members'
      ? ['All', 'Active', 'Needs Attention']
      : inventoryType === 'Patients'
        ? ['All', 'Active', 'Follow-Up Required']
        : inventoryType === 'Assets'
          ? ['All', 'Healthy', 'Needs Review']
          : inventoryType === 'Equipment'
            ? ['All', 'Healthy', 'Needs Review']
            : inventoryType === 'Vehicles'
              ? ['All', 'Healthy', 'Needs Review']
              : ['All', 'Active', 'Needs Attention'];

  const inventoryTableColumns = inventoryType === 'Products'
    ? [
        { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a6ff00] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
        { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
        { label: 'Stock', render: (record: any) => <span className="text-sm text-neutral-600">{record.stock ?? record.primaryMetric}</span> },
        { label: 'Unit Price', render: (record: any) => <span className="text-sm text-neutral-600">{record.unitPrice ? formatCurrency(record.unitPrice) : '—'}</span> },
        { label: 'Value', render: (record: any) => <span className="text-sm text-neutral-600">{record.value ? formatCurrency(record.value) : '—'}</span> },
        { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Healthy' || record.status === 'Active' ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : record.status === 'Low Stock' || record.status === 'Needs Attention' || record.status === 'Follow-Up Required' || record.status === 'Out of Stock' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-neutral-200 bg-white text-neutral-600'}`}>{record.status}</span> },
        { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || record.assignedTo || '—'}</span> },
        { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
        { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
      ]
    : inventoryType === 'Members'
        ? [
            { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a6ff00] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
            { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
            { label: 'Group', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Type || '—'}</span> },
            { label: 'Last Attendance', render: (record: any) => <span className="text-sm text-neutral-600">{record.timeline?.[1]?.detail || '—'}</span> },
            { label: 'Contributions', render: (record: any) => <span className="text-sm text-neutral-600">{record.secondaryMetric}</span> },
            { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
            { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
            { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
            { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
          ]
        : inventoryType === 'Patients'
          ? [
              { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a6ff00] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
              { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
              { label: 'Last Visit', render: (record: any) => <span className="text-sm text-neutral-600">{record.primaryMetric}</span> },
              { label: 'Balance', render: (record: any) => <span className="text-sm text-neutral-600">{record.secondaryMetric}</span> },
              { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
              { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
              { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
              { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
            ]
          : inventoryType === 'Assets'
            ? [
                { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a6ff00] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
                { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
                { label: 'Location', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Location || '—'}</span> },
                { label: 'Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                { label: 'Value', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Value || '—'}</span> },
                { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Healthy' ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
                { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
                { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
              ]
            : inventoryType === 'Equipment'
              ? [
                  { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a6ff00] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
                  { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
                  { label: 'Location', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Location || '—'}</span> },
                  { label: 'Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                  { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Healthy' ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
                  { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                  { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
                  { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
                ]
              : [
                  { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#a6ff00] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
                  { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
                  { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
                  { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                  { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
                  { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
                ];

  const overviewCards = inventoryType === 'Products'
    ? [
        { label: 'Total Products', value: `${inventoryRows.length}` },
        { label: 'Inventory Value', value: formatCurrency(inventoryRows.reduce((sum, record) => sum + (record.details && 'Price' in record.details && typeof record.details.Price === 'string' ? Number(String(record.details.Price).replace(/[^0-9.-]+/g, '')) : 0), 0)) },
        { label: 'Low Stock Items', value: `${inventoryRows.filter((record) => record.status === 'Low Stock').length}` },
        { label: 'Out Of Stock Items', value: `${inventoryRows.filter((record) => record.status === 'Out of Stock').length}` }
      ]
    : inventoryType === 'Members'
      ? [
          { label: 'Total Members', value: `${inventoryRows.length}` },
          { label: 'New Members', value: '8' },
          { label: 'Active Members', value: '19' },
          { label: 'Inactive Members', value: '3' }
        ]
      : inventoryType === 'Patients'
        ? [
            { label: 'Total Patients', value: `${inventoryRows.length}` },
            { label: 'Active Patients', value: '18' },
            { label: 'Pending Appointments', value: '6' },
            { label: 'Critical Follow-Ups', value: '2' }
          ]
        : inventoryType === 'Assets'
          ? [
              { label: 'Managed Assets', value: `${inventoryRows.length}` },
              { label: 'Healthy Assets', value: '1' },
              { label: 'Needs Review', value: '1' },
              { label: 'Utilization', value: '72%' }
            ]
          : inventoryType === 'Equipment'
            ? [
                { label: 'Tracked Equipment', value: `${inventoryRows.length}` },
                { label: 'Available', value: '4' },
                { label: 'Maintenance', value: '0' },
                { label: 'Downtime', value: '0%' }
              ]
            : [
                { label: 'All Records', value: `${inventoryRows.length}` },
                { label: 'Active', value: '1' },
                { label: 'Needs Attention', value: '0' },
                { label: 'Custom Fields', value: '4' }
              ];

  const aiInsightText = inventoryType === 'Products'
    ? 'I am tracking your product catalog using your categories and stock thresholds.'
    : inventoryType === 'Members'
      ? 'Membership records are current. Monitor renewals and engagement activity.'
      : inventoryType === 'Patients'
        ? 'Patient records are organized by status and follow-up readiness.'
        : 'Business records can be used for inventory, finance, or operations needs.';

  // Minimal Markdown UI Parser
  function renderMarkdown(text: string) {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check for tables
      if (line.trim().startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const isHeader = line.includes('---') || (idx > 0 && lines[idx - 1].includes('---'));
        if (line.includes('---')) return null;
        return (
          <div key={idx} className={`flex border-b border-neutral-200 py-1.5 text-sm font-normal text-black ${isHeader ? 'font-semibold bg-neutral-100' : ''}`}>
            {cells.map((cell, cidx) => (
              <div key={cidx} className="flex-1 px-1 truncate">{cell}</div>
            ))}
          </div>
        );
      }

      // Check for bullet list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleanLine = line.trim().substring(2);
        return (
          <li key={idx} className="list-disc list-inside text-sm font-normal text-black my-1">
            {parseInlines(cleanLine)}
          </li>
        );
      }

      // Check for numbered list
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)$/);
      if (numMatch) {
        return (
          <li key={idx} className="list-decimal list-inside text-sm font-normal text-black my-1">
            {parseInlines(numMatch[2])}
          </li>
        );
      }

      // Check for headers
      if (line.trim().startsWith('### ') || line.trim().startsWith('## ') || line.trim().startsWith('# ')) {
        const headingText = line.replace(/^#+\s+/, '');
        return (
          <h4 key={idx} className="text-sm font-semibold text-black mt-3 mb-1.5">
            {parseInlines(headingText)}
          </h4>
        );
      }

      return (
        <p key={idx} className="text-sm font-normal text-black leading-relaxed my-1">
          {parseInlines(line)}
        </p>
      );
    });
  }

  function parseInlines(text: string) {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-black">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1 bg-neutral-100 border border-neutral-200 text-black font-normal rounded text-sm">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  }

  const primaryActionClasses = 'inline-flex items-center justify-center gap-2 rounded-[12px] border border-black bg-[#a6ff00] px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#a6ff00] focus:outline-none focus:ring-2 focus:ring-[#a6ff00]';
  const secondaryActionClasses = 'inline-flex items-center justify-center gap-2 rounded-[12px] border border-black bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#a6ff00]';

  const dashboardMetrics = activeOrganizationProfile.dashboardMetrics.length > 0 ? activeOrganizationProfile.dashboardMetrics : [
    { label: 'Revenue', value: `$${summary.revenue.toLocaleString()}`, hint: 'Healthy momentum' },
    { label: 'Inventory Health', value: `${summary.lowStockCount} alerts`, hint: 'Keep an eye on replenishment' },
    { label: 'Pending Orders', value: `${summary.pendingOrdersCount} logged`, hint: 'Operations are active' },
    { label: 'Completed Orders', value: `${orders.filter((order) => order.status === 'Completed').length}`, hint: 'Closed sales this period' }
  ];

  const handleExecutiveBriefingAction = (kind: 'inventory' | 'fees' | 'members' | 'transactions') => {
    if (kind === 'inventory') {
      setActiveTab('stock');
      setInventoryType('Products');
      setInventoryAlertFilter('Low');
      setInventoryStatusFilter('All');
      return;
    }

    if (kind === 'fees') {
      setActiveTab('orders');
      setTransactionReviewMode('standard');
      return;
    }

    if (kind === 'members') {
      setActiveTab('crm');
      return;
    }

    setActiveTab('orders');
    setTransactionReviewMode('flagged');
  };

  const deskChartData = (() => {
    const now = new Date();
    const normalizedOrders = orders.map((order) => ({
      ...order,
      dateObj: new Date(order.date)
    }));

    const asRangePoints = () => {
      if (deskRange === 'Today') {
        const hours = [8, 10, 12, 14, 16];
        return hours.map((hour) => ({
          name: `${hour.toString().padStart(2, '0')}:00`,
          value: normalizedOrders.filter((order) => {
            const d = order.dateObj;
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate() && d.getHours() >= hour && d.getHours() < hour + 2;
          }).length
        }));
      }

      if (deskRange === 'Last 7 Days' || deskRange === 'Last 30 Days') {
        const length = deskRange === 'Last 7 Days' ? 7 : 30;
        return Array.from({ length }, (_, index) => {
          const day = new Date(now);
          day.setDate(now.getDate() - (length - 1 - index));
          return {
            name: day.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            value: normalizedOrders.filter((order) => {
              const d = order.dateObj;
              return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
            }).length
          };
        });
      }

      if (deskRange === 'This Month' || deskRange === 'Last Month') {
        const targetMonth = deskRange === 'This Month' ? now.getMonth() : (now.getMonth() + 11) % 12;
        const targetYear = deskRange === 'This Month' ? now.getFullYear() : (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
        return Array.from({ length: 5 }, (_, index) => ({
          name: `W${index + 1}`,
          value: normalizedOrders.filter((order) => {
            const d = order.dateObj;
            const start = new Date(targetYear, targetMonth, 1);
            const weekStart = new Date(start);
            weekStart.setDate(start.getDate() + index * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);
            return d >= weekStart && d < weekEnd && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
          }).length
        }));
      }

      if (deskRange === 'This Year') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((month, index) => ({
          name: month,
          value: normalizedOrders.filter((order) => {
            const d = order.dateObj;
            return d.getFullYear() === now.getFullYear() && d.getMonth() === index;
          }).length
        }));
      }

      return [
        { name: 'W1', value: normalizedOrders.length },
        { name: 'W2', value: 0 },
        { name: 'W3', value: 0 },
        { name: 'W4', value: 0 }
      ];
    };

    return asRangePoints();
  })();

  const dashboardFilterOptions: Array<{ value: typeof deskRange; label: string }> = [
    { value: 'Today', label: 'Today' },
    { value: 'Last 7 Days', label: 'Last 7 Days' },
    { value: 'Last 30 Days', label: 'Last 30 Days' },
    { value: 'This Month', label: 'This Month' },
    { value: 'Last Month', label: 'Last Month' },
    { value: 'This Year', label: 'This Year' },
    { value: 'Custom Range', label: 'Custom Range' }
  ];

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const startDate = (() => {
      switch (deskRange) {
        case 'Today':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        case 'Last 7 Days':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
        case 'Last 30 Days':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
        case 'This Month':
          return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        case 'Last Month':
          return new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        case 'This Year':
          return new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        default:
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
      }
    })();

    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const previousStart = (() => {
      switch (deskRange) {
        case 'Today':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
        case 'Last 7 Days':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
        case 'Last 30 Days':
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
        case 'This Month':
          return new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        case 'Last Month':
          return new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        case 'This Year':
          return new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        default:
          return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
      }
    })();

    const previousEnd = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - 1, 23, 59, 59, 999);

    const inRange = (date: string | Date) => {
      const itemDate = new Date(date);
      return itemDate >= startDate && itemDate <= endDate;
    };

    const inPreviousRange = (date: string | Date) => {
      const itemDate = new Date(date);
      return itemDate >= previousStart && itemDate <= previousEnd;
    };

    const currentOrders = orders.filter((order) => order.status === 'Completed' && inRange(order.date));
    const previousOrders = orders.filter((order) => order.status === 'Completed' && inPreviousRange(order.date));
    const currentRevenue = currentOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const trendValue = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : currentRevenue > 0 ? 100 : 0;
    const currentExpenses = expenses.filter((expense) => inRange(expense.date)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const previousExpenses = expenses.filter((expense) => inPreviousRange(expense.date)).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const lowStockCount = products.filter((product) => Number(product.stock || 0) <= Number(product.minStock || 0)).length;
    const outOfStockCount = products.filter((product) => Number(product.stock || 0) <= 0).length;
    const serviceOrders = orders.filter((order) => order.items.some((item) => String(item.category || '').toLowerCase().includes('service') || String(item.transactionType || '').toLowerCase().includes('service')));
    const productAndServiceCount = products.length + Math.max(serviceTemplates.length, serviceOrders.length > 0 ? 1 : 0);
    const outstandingBalance = orders.filter((order) => order.status !== 'Completed' || Number(order.balanceDue || 0) > 0).reduce((sum, order) => sum + Number(order.balanceDue || order.totalAmount || 0), 0);
    const aiScore = Math.max(62, Math.min(98, 72 + (currentRevenue > previousRevenue ? 8 : -2) - lowStockCount * 3 + (outstandingBalance > 0 ? -4 : 5) + (currentExpenses > 0 ? 2 : 0)));
    const aiInsight = currentRevenue >= previousRevenue && lowStockCount <= 2
      ? 'Momentum is healthy and stock risk is contained. Keep the top revenue streams active and review premium offers this week.'
      : currentRevenue < previousRevenue
        ? 'Revenue softened versus the previous period. Tighten follow-up on active leads and review pricing or service mix.'
        : 'Cash conversion is stable, but a few low-stock items and open balances deserve attention this cycle.';

    return [
      {
        id: 'revenue',
        label: 'Total Revenue',
        value: formatCurrencyValue(currentRevenue, organizationSetup.currency || 'NGN (₦)'),
        detail: `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}% vs prior window`,
        accent: 'from-[#FFF4D8] to-[#FFDD6F]',
        iconBg: 'bg-[#FFE39C]',
        iconTint: 'text-[#4F3A00]',
        icon: TrendingUp,
        page: 'analytics' as const,
        description: 'Revenue pulse'
      },
      {
        id: 'products-services',
        label: 'Active Products',
        value: `${productAndServiceCount} active`,
        detail: products.length > 0 ? `${products.length} products • ${serviceTemplates.length} service templates` : 'Service-led setup with no stock items',
        accent: 'from-[#F4F8FF] to-[#EAF2FF]',
        iconBg: 'bg-[#DCEBFF]',
        iconTint: 'text-[#3E63E6]',
        icon: Package,
        page: 'stock' as const,
        description: 'Offer mix'
      },
      {
        id: 'transactions',
        label: 'Transactions',
        value: `${currentOrders.length} completed`,
        detail: `${currentOrders.length >= previousOrders.length ? '+' : ''}${Math.max(0, currentOrders.length - previousOrders.length)} vs prior window`,
        accent: 'from-[#F5FBFF] to-[#E7F5FF]',
        iconBg: 'bg-[#D9F1FF]',
        iconTint: 'text-[#0F6C9E]',
        icon: ShoppingCart,
        page: 'orders' as const,
        description: 'Sales activity'
      },
      {
        id: 'customers',
        label: 'Customers',
        value: `${customers.length} total`,
        detail: `${customers.filter((customer) => customer.status === 'Follow Up' || customer.status === 'Contacted').length} in review`,
        accent: 'from-[#FFEAF7] to-[#FFD0E7]',
        iconBg: 'bg-[#FFB9D8]',
        iconTint: 'text-[#7C2554]',
        icon: Users,
        page: 'crm' as const,
        description: 'Customer base'
      },
      {
        id: 'inventory',
        label: 'Inventory Health',
        value: products.length === 0 ? 'Service-led' : `${Math.max(0, products.length - lowStockCount - outOfStockCount)} healthy`,
        detail: products.length === 0 ? 'No physical stock to monitor' : `${lowStockCount} low • ${outOfStockCount} out`,
        accent: 'from-[#FFF9ED] to-[#FFF3D9]',
        iconBg: 'bg-[#FDE8BF]',
        iconTint: 'text-[#A96B00]',
        icon: AlertTriangle,
        page: 'stock' as const,
        description: 'Stock resilience'
      },
      {
        id: 'cash-flow',
        label: 'Cash Flow',
        value: `${formatCurrencyValue(currentRevenue, organizationSetup.currency || 'NGN (₦)')} / ${formatCurrencyValue(currentExpenses, organizationSetup.currency || 'NGN (₦)')}`,
        detail: `Net ${formatCurrencyValue(currentRevenue - currentExpenses, organizationSetup.currency || 'NGN (₦)')}`,
        accent: 'from-[#FFF4D8] to-[#FFDE79]',
        iconBg: 'bg-[#FFE297]',
        iconTint: 'text-[#4F3A00]',
        icon: Activity,
        page: 'analytics' as const,
        description: 'Liquidity'
      },
      {
        id: 'payments',
        label: 'Outstanding Payments',
        value: formatCurrencyValue(outstandingBalance, organizationSetup.currency || 'NGN (₦)') ,
        detail: `${orders.filter((order) => Number(order.balanceDue || 0) > 0).length} balances open`,
        accent: 'from-[#FFF4F2] to-[#FFE9E3]',
        iconBg: 'bg-[#FFD8CF]',
        iconTint: 'text-[#C9533A]',
        icon: Clock3,
        page: 'orders' as const,
        description: 'Receivables'
      },
      {
        id: 'ai-score',
        label: 'AI Business Score',
        value: `${aiScore}/100`,
        detail: aiInsight,
        accent: 'from-[#F3FFF9] via-[#E4FAEE] to-[#DDF5F0]',
        iconBg: 'bg-[#021201]',
        iconTint: 'text-[#a6ff00]',
        icon: Sparkles,
        page: 'ai' as const,
        description: 'AI health insight'
      }
    ];
  }, [orders, products, customers, expenses, deskRange, organizationSetup.currency, serviceTemplates]);

  const briefingActions = activeOrganizationProfile.dashboardActions.length > 0 ? activeOrganizationProfile.dashboardActions.map((action) => ({
    title: action.title,
    detail: action.detail,
    action: () => {
      setActiveTab(action.targetTab === 'analytics' ? 'analytics' : action.targetTab === 'stock' ? 'stock' : action.targetTab === 'crm' ? 'crm' : action.targetTab === 'staff' ? 'staff' : action.targetTab === 'ai' ? 'ai' : 'orders');
      if (action.targetTab === 'orders') {
        setTransactionReviewMode('standard');
      }
    }
  })) : [
    {
      title: `${summary.lowStockCount} products may need restocking`,
      detail: 'Open the low-stock inventory view and replenish before demand slips.',
      action: () => { setActiveTab('stock'); setInventoryType('Products'); setInventoryAlertFilter('Low'); setInventoryStatusFilter('All'); }
    },
    {
      title: `${orders.filter((order) => order.status === 'Pending' || order.status === 'Processing').length} orders need follow-up`,
      detail: 'Review the pending operations and keep customer commitments on track.',
      action: () => { setActiveTab('orders'); setTransactionReviewMode('standard'); }
    },
    {
      title: `${customers.filter((customer) => customer.status === 'Follow Up' || customer.status === 'Contacted').length} customers are in contact review`,
      detail: 'Open the CRM and update customer statuses as conversations progress.',
      action: () => { setActiveTab('crm'); }
    },
    {
      title: '3 suspicious transactions detected',
      detail: 'Open the transaction review queue and investigate flagged activity.',
      action: () => { setActiveTab('orders'); setTransactionReviewMode('flagged'); }
    },
    {
      title: 'Inventory value increased 18% this month',
      detail: 'Jump into the analytics workspace for richer operating context.',
      action: () => { setActiveTab('analytics'); }
    },
    {
      title: 'Revenue increased 12% compared to last week',
      detail: 'Open the revenue reports and continue the growth momentum.',
      action: () => { setActiveTab('analytics'); }
    }
  ];

  if (appMode === 'onboarding') {
    return <OnboardingWizard onComplete={handleOrganizationSetup} setAppMode={setAppMode} />;
  }

  if (appMode === 'auth') {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authName={authName}
        authEmail={authEmail}
        authPassword={authPassword}
        setAuthName={setAuthName}
        setAuthEmail={setAuthEmail}
        setAuthPassword={setAuthPassword}
        setAppMode={setAppMode}
        onSubmit={handleAuthSubmit}
        onSelectDemoAccount={applyDemoAccount}
        isLoading={authLoading}
        authError={authError}
        passwordVisible={passwordVisible}
        setPasswordVisible={setPasswordVisible}
      />
    );
  }

  return (
    <>
      {showDashboardLoader && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#021201]/95 p-6 backdrop-blur-sm transition-opacity duration-500 ${dashboardLoaderFadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className={`flex w-full max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-white/10 bg-white/5 px-10 py-12 text-center shadow-[0_0_60px_rgba(166,255,0,0.16)] backdrop-blur-xl transition-transform duration-500 ${dashboardLoaderFadeOut ? '-translate-y-4' : 'translate-y-0'}`}>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/10 border-t-[#a6ff00] animate-spin" />
              <div className="space-y-2">
                <p className="text-3xl sm:text-4xl font-black tracking-[-0.03em] text-transparent bg-clip-text bg-gradient-to-r from-[#a6ff00] via-white to-[#7cffb4] drop-shadow-[0_0_20px_rgba(166,255,0,0.5)]">
                  Wᴇʟᴄᴏᴍᴇ ᴛᴏ ʏᴏᴜʀ ᴅᴀsʜʙᴏᴀʀᴅ
                </p>
                <p className="text-sm uppercase tracking-[0.35em] text-[#a6ff00]/90">Loading your workspace...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-white/75">
              <span className="inline-flex h-3 w-3 rounded-full bg-[#a6ff00] animate-pulse" />
              <span>Preparing your dashboard experience</span>
            </div>
          </div>
        </div>
      )}
      <div className={`min-h-screen bg-white text-sm font-normal text-black select-none transition-opacity duration-300 ${(splashActive || !startupComplete) && appMode === 'app' ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative min-h-screen w-full overflow-hidden bg-white">
        {(menuOpen || isDesktop) && (
          <div className={`${isDesktop ? 'fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-[#021201] bg-[#021201] p-5 lg:flex' : 'fixed inset-0 z-50 flex bg-[#021201]/90 lg:hidden'}`}>
            <div className={`${isDesktop ? 'flex h-full w-full flex-col justify-between bg-[#021201]' : 'w-[280px] h-full flex flex-col border-r border-[#021201] shadow-2xl p-5 justify-between bg-[#021201] animate-in slide-in-from-left duration-200'}`}>
              <div className="space-y-5">
                
                {/* Drawer Header */}
                <div className="flex justify-between items-center pb-4 border-b border-[#021201]">
                  <div className="flex items-center space-x-2">
                    <img src="/eenvoq-app-logo.png" alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white uppercase tracking-wider">EENVOQ</span>
                      {isDesktop && <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#a6ff00]">for {businessName}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => setMenuOpen(false)}
                    className="text-white hover:text-[#a6ff00]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Owner Profile Snippet */}
                <div className="flex items-center space-x-3 p-2 bg-[#021201]-50 rounded-lg">
                  <img 
                    src={profilePic} 
                    alt={ownerName} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#a6ff00] shadow-mint-glow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-400 leading-tight">{ownerName}</p>
                    <p className="text-xs font-normal text-neutral-400 leading-tight">{ownerRole}</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 overflow-y-auto max-h-[480px] pr-1">
                  <p className="text-sm font-semibold text-neutral-400 px-2 uppercase tracking-widest pb-1">Quick Access</p>

                  <SidebarNavButton
                    label={activeOrganizationProfile.navigation[0]?.label || 'Dashboard'}
                    icon={Activity}
                    active={activeTab === 'desk'}
                    onClick={() => { setActiveTab('desk'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label={activeOrganizationProfile.navigation.find((item) => item.tab === 'stock')?.label || 'Stock & Inventory'}
                    icon={Package}
                    active={activeTab === 'stock'}
                    onClick={() => { setActiveTab('stock'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label={activeOrganizationProfile.navigation.find((item) => item.tab === 'orders')?.label || 'Transactions'}
                    icon={ShoppingCart}
                    active={activeTab === 'orders'}
                    onClick={() => { setActiveTab('orders'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Eenvoq AI"
                    icon={MessageSquare}
                    active={activeTab === 'ai'}
                    onClick={() => { setActiveTab('ai'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Tags"
                    icon={MessageSquare}
                    active={activeTab === 'tag'}
                    badge={tagThreads.length > 0 ? tagThreads.length : undefined}
                    onClick={() => { setActiveTab('tag'); setMenuOpen(false); }}
                  />

                  <p className="text-sm font-semibold text-neutral-400 px-2 uppercase tracking-widest pt-3 pb-1">Business Add-ons</p>

                  <SidebarNavButton
                    label="Revenue & Analytics"
                    icon={TrendingUp}
                    active={activeTab === 'analytics'}
                    onClick={() => { setActiveTab('analytics'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Suppliers"
                    icon={Truck}
                    active={activeTab === 'procurement'}
                    onClick={() => { setActiveTab('procurement'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Audits"
                    icon={History}
                    active={activeTab === 'audits'}
                    onClick={() => { setActiveTab('audits'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label={`${customerLabel} CRM`}
                    icon={User}
                    active={activeTab === 'crm'}
                    onClick={() => { setActiveTab('crm'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label={`${staffLabel} & Access`}
                    icon={Users}
                    active={activeTab === 'staff'}
                    onClick={() => { setActiveTab('staff'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Profile & Settings"
                    icon={Sliders}
                    active={activeTab === 'settings'}
                    onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Visit Website"
                    icon={ArrowRight}
                    active={false}
                    onClick={() => {
                      window.open('https://eenvoq.com.ng', '_blank', 'noopener,noreferrer');
                      setMenuOpen(false);
                    }}
                  />
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="pt-3 border-t border-neutral-100 text-[10px] text-neutral-400 text-center font-normal uppercase tracking-wider">
                Eenvoq v2.4
              </div>
            </div>

            {!isDesktop && (
              <div className="flex-1" onClick={() => setMenuOpen(false)} />
            )}
          </div>
        )}

        <div className="min-h-screen flex-1 bg-white pt-14 lg:pl-72">
          {/* Top App Header */}
          <AppHeader
            ownerName={ownerName}
            currentOperatorId={currentOperatorId}
            staff={staff}
            lowStockCount={summary.lowStockCount}
            loading={loading}
            isDesktop={isDesktop}
            setMenuOpen={setMenuOpen}
            loadAllData={loadAllData}
            onOpenTagPage={() => setActiveTab('tag')}
            tagCount={tagThreads.length}
            searchQuery={headerSearchQuery}
            setSearchQuery={setHeaderSearchQuery}
            searchResults={filteredSearchResults}
            onSelectSearchResult={handleSearchSelect}
            searchOpen={headerSearchOpen}
            setSearchOpen={setHeaderSearchOpen}
            profilePic={profilePic}
          />

        {/* Dynamic App Content Box */}
        <div className="min-h-screen overflow-y-auto bg-white pb-20 lg:pb-0">
          {loading ? (
            <div className="p-5 space-y-4 animate-pulse">
              <div className="h-28 bg-neutral-100 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-neutral-100 rounded-lg"></div>
                <div className="h-20 bg-neutral-100 rounded-lg"></div>
              </div>
              <div className="h-40 bg-neutral-100 rounded-lg"></div>
            </div>
          ) : (
            <>
              {activeTab === 'tag' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="rounded-none border-0 bg-transparent p-0 py-4 shadow-none sm:py-5 lg:py-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Tag workspace</p>
                        <h2 className="text-lg font-semibold text-black">Tag business owner, manager or staff and leave requests they can respond to</h2>
                        <p className="mt-1 text-sm text-neutral-600">Use tags for stock checks, sales follow-ups, and operating requests that need another teammate to act on.</p>
                      </div>
                      <button type="button" onClick={() => setShowTagComposer(true)} className="flex md:inline-flex w-3/4 md:w-3/5 lg:w-auto items-center justify-center gap-2 rounded-2xl border border-black bg-[#a6ff00] px-3 py-2 text-sm font-semibold text-black">
                        <Plus className="h-4 w-4" />
                        New tag
                      </button>
                    </div>
                  </div>

                  {showTagComposer && (
                    <div className="rounded-none border-0 bg-transparent p-0 py-4 shadow-none sm:py-5 lg:py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Quick tag</p>
                          <p className="mt-1 text-sm font-semibold text-black">Tag business owner, manager or staff and leave requests they can respond to.</p>
                        </div>
                        <button type="button" onClick={() => setShowTagComposer(false)} className="rounded-full p-1 text-neutral-500 hover:bg-neutral-50 hover:text-black">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Tag</label>
                          <select
                            value={tagDraft.recipientId}
                            onChange={(e) => setTagDraft((draft) => ({ ...draft, recipientId: e.target.value }))}
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-black"
                          >
                            <option value="owner">{ownerName}</option>
                            {staff.map((member) => (
                              <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                          </select>
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Context</label>
                          <select
                            value={tagDraft.context}
                            onChange={(e) => setTagDraft((draft) => ({ ...draft, context: e.target.value }))}
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-black"
                          >
                            <option value="stock">Stock request</option>
                            <option value="sales">Sales follow-up</option>
                            <option value="ops">Operations note</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Message</label>
                          <textarea
                            value={tagDraft.message}
                            onChange={(e) => setTagDraft((draft) => ({ ...draft, message: e.target.value }))}
                            rows={4}
                            placeholder="Tag yourself and leave a note for the person you tagged..."
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-black"
                          />
                          <input
                            value={tagDraft.note}
                            onChange={(e) => setTagDraft((draft) => ({ ...draft, note: e.target.value }))}
                            placeholder="Add a short request or comment"
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!tagDraft.message.trim()) return;
                              const recipient = staff.find((member) => member.id === tagDraft.recipientId) || { id: 'owner', name: ownerName };
                              setTagThreads((threads) => [{
                                id: `thread-${Date.now()}`,
                                recipientId: recipient.id,
                                recipientName: recipient.name,
                                message: tagDraft.message.trim(),
                                context: tagDraft.context,
                                note: tagDraft.note.trim() || 'Tagged request',
                                createdAt: 'Just now'
                              }, ...threads]);
                              setTagDraft({ recipientId: tagDraft.recipientId, message: '', context: tagDraft.context, note: '' });
                              setShowTagComposer(false);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-black bg-[#a6ff00] px-3 py-2 text-sm font-semibold text-black"
                          >
                            <Send className="h-4 w-4" />
                            Send tag
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-none border-0 bg-transparent p-0 py-4 shadow-none sm:py-5 lg:py-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Tagged requests</p>
                        </div>
                        <div className="rounded-full border border-[#a6ff00] bg-[#a6ff00] px-2.5 py-1 text-[11px] font-semibold text-black">{tagThreads.length} active</div>
                      </div>
                      <div className="mt-3 space-y-3">
                        {tagThreads.map((thread) => (
                          <div key={thread.id} className="rounded-[18px] border border-neutral-200 bg-[#a6ff00] p-3">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-black">{thread.recipientName}</p>
                              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{thread.createdAt}</span>
                            </div>
                            <p className="mt-2 text-sm text-neutral-700">{thread.message}</p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{thread.context} • {thread.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-none border-0 bg-transparent p-0 py-4 shadow-none sm:py-5 lg:py-5">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">How it works</p>
                      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                        <li>• Mention a colleague, staff, or owner for stock, sales, or operational follow-up.</li>
                        <li>• Leave a concrete request so the tagged person can act on the note right away.</li>
                        <li>• Keep comments visible in the shared workspace so the next action is obvious.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

             {/* VIEW 1: DESK (DASHBOARD) */}
              {activeTab === 'desk' && (
                <div className="space-y-6 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="px-0 py-0 sm:px-0 lg:px-0">
                    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#021201] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-7 lg:p-8">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(166,255,0,0.18),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(95,232,210,0.16),transparent_24%),linear-gradient(135deg,#031204_0%,#021201_45%,#020d06_100%)]" aria-hidden="true" />
                      <div className="absolute inset-0 opacity-70" aria-hidden="true">
                        <svg viewBox="0 0 900 620" className="h-full w-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="hero-trace" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#A6FF00" stopOpacity="0.95" />
                              <stop offset="50%" stopColor="#5FE8D2" stopOpacity="0.75" />
                              <stop offset="100%" stopColor="#A6FF00" stopOpacity="0.4" />
                            </linearGradient>
                          </defs>
                          <path d="M-40 478C120 420 220 330 330 350C430 368 460 236 572 240C686 244 760 130 940 100" stroke="url(#hero-trace)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
                          <path d="M-20 160C96 112 154 176 272 208C386 240 462 164 590 166C700 168 786 92 926 82" stroke="url(#hero-trace)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.8" />
                          <path d="M78 622C170 560 240 500 346 504C448 508 520 430 636 428C742 426 804 488 924 470" stroke="url(#hero-trace)" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.7" />
                          <path d="M144 116C212 144 286 140 340 98C392 58 438 48 498 58C552 68 610 104 660 128" stroke="#A6FF00" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.56" />
                          <path d="M368 40C450 72 516 76 574 52C636 26 700 28 760 50" stroke="#5FE8D2" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.48" />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_46%,rgba(255,255,255,0.03))]" aria-hidden="true" />

                      <div className="relative z-10 flex flex-col">
                        <div className="space-y-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">{dashboardHeroLabel}</p>
                          <div>
                            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                              Good morning, {userFirstName}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] leading-6 text-white/60 sm:text-sm">
                              <span>Live overview</span>
                              <span className="h-1 w-1 rounded-full bg-white/40" />
                              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <span className="h-1 w-1 rounded-full bg-white/40" />
                              <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`mt-8 ${isDesktop ? 'flex flex-wrap items-center gap-2' : 'grid grid-cols-2 gap-2'}`}>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('orders'); setTransactionReviewMode('standard'); }}
                            className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#a6ff00] px-4 py-3 text-sm font-semibold text-[#042D17] transition ${isDesktop ? '' : 'w-3/4 md:w-3/5 justify-start'}`}
                          >
                            <Plus className="h-4 w-4" />
                            Record Sale
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('stock'); setInventoryType('Products'); setInventoryAlertFilter('Low'); setInventoryStatusFilter('All'); }}
                            className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 backdrop-blur-sm transition hover:bg-white/15 ${isDesktop ? '' : 'w-full justify-start'}`}
                          >
                            <Package className="h-4 w-4" />
                            Add Inventory
                          </button>
                          <button
                            type="button"
                            onClick={() => { setActiveTab('orders'); setTransactionReviewMode('standard'); }}
                            className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 ${isDesktop ? '' : 'w-full justify-start'}`}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            View Orders
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('analytics')}
                            className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 ${isDesktop ? '' : 'w-full justify-start'}`}
                          >
                            <Wallet className="h-4 w-4" />
                            Expenses
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 bg-transparent p-0 shadow-none sm:p-0 lg:p-0">
                    <div className="flex items-center justify-between gap-3"> 
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">Overview</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-black">Today's stats</h2>
                          <p className="text-sm italic text-neutral-500">(click a card to view details)</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                      {dashboardStats.map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => setActiveTab(card.page)}
                            className="min-h-[150px] rounded-[24px] border border-neutral-200 bg-white p-3 text-left shadow-[0_10px_22px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5"
                          >
                            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg} ${card.iconTint}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">{card.label}</p>
                            <p className="mt-2 text-base font-semibold text-black leading-tight">{card.value}</p>
                            <p className="mt-1 text-[11px] leading-5 text-neutral-600">{card.detail}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                    <div className="rounded-none border-0 bg-transparent p-0 py-5 shadow-none sm:py-6 lg:py-6">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold text-black">Graph representation</h2>
                          <p className="text-sm italic text-neutral-500">(filter by date, stock type, etc.)</p>
                        </div>
                        <div className="rounded-full border border-[#021201]/30 bg-[#021201] px-3 py-1.5 text-sm font-medium text-[#a6ff00]">
                          {deskRange}
                        </div>
                      </div>

                      <div className="mt-4 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={deskChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                              <linearGradient id="deskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a6ff00" stopOpacity={0.32} />
                                <stop offset="100%" stopColor="#a6ff00" stopOpacity={0.04} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#a6ff00" strokeWidth={2.5} fill="url(#deskGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>


                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-none border-0 bg-transparent p-0 py-5 shadow-none sm:py-6 lg:py-6">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Urgent attention</p>
                      <div className="mt-3 space-y-2">
                        {(() => {
                          const items = [] as Array<{ label: string; badge: string }>;
                          if (summary.lowStockCount > 0) {
                            items.push({ label: `${summary.lowStockCount} products are below reorder threshold and need attention.`, badge: 'Needs attention' });
                          }
                          const pendingOrders = orders.filter((order) => order.status === 'Pending' || order.status === 'Processing').length;
                          if (pendingOrders > 0) {
                            items.push({ label: `${pendingOrders} pending order${pendingOrders === 1 ? '' : 's'} require follow-up.`, badge: 'In progress' });
                          }
                          const crmFollowUps = customers.filter((customer) => customer.status === 'Follow Up' || customer.status === 'Contacted').length;
                          if (crmFollowUps > 0) {
                            items.push({ label: `${crmFollowUps} customer contact${crmFollowUps === 1 ? '' : 's'} awaiting outreach.`, badge: 'Follow up' });
                          }
                          if (items.length === 0) {
                            return (
                              <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-600">No active operational alerts at the moment.</div>
                            );
                          }
                          return items.map((item) => (
                            <div key={item.label} className="flex items-center justify-between rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                              <p className="text-sm text-black">{item.label}</p>
                              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600">{item.badge}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="rounded-none border-0 bg-transparent p-0 py-5 shadow-none sm:py-6 lg:py-6">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Recent activity</p>
                      <div className="mt-3 space-y-2">
                        {auditLogs.length > 0 ? auditLogs.slice(0, 4).map((log) => (
                          <div key={log.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-black">{log.message}</p>
                              <span className="rounded-full border border-[#a6ff00]/25 bg-[#a6ff00] px-2.5 py-1 text-xs font-semibold text-black">{log.category}</span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">{log.timestamp}</p>
                          </div>
                        )) : (
                          <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-6 text-sm text-neutral-500 text-center">No recent activity has been logged yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)] sm:col-span-1">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Team performance</p>
                      <div className="mt-3 space-y-3">
                        {[
                          { name: 'Staff online', role: `${staff.filter((member) => member.online).length} active`, metric: `${staff.length} total` },
                          { name: 'Role coverage', role: `${new Set(staff.map((member) => member.role)).size} roles`, metric: `${staff.length > 0 ? 'Configured' : 'None'}` },
                          { name: 'Order pipeline', role: `${orders.filter((order) => order.status !== 'Completed').length} pending`, metric: `${orders.length} total` }
                        ].map((person) => (
                          <div key={person.name} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-black">{person.name}</p>
                                <p className="text-sm text-neutral-600">{person.role}</p>
                              </div>
                              <p className="text-sm font-semibold text-black">{person.metric}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#a6ff00]/20 bg-[#021201] p-4 shadow-[0_10px_22px_rgba(0,0,0,0.06)] sm:col-span-1">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Verified transactions</p>
                      <div className="mt-3">
                        <p className="text-4xl font-semibold tracking-[-0.03em] text-[#a6ff00]">{orders.length > 0 ? `${Math.round((orders.filter((order) => order.status === 'Completed').length / orders.length) * 100)}%` : '0%'}</p>
                        <p className="mt-2 text-sm text-neutral-400">Completed order ratio based on current transaction activity.</p>
                      </div>
                      <button type="button" className="mt-4 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Review current order status</button>
                    </div>
                  </div>

                  <div className="rounded-none border-0 bg-transparent p-0 py-5 shadow-none sm:py-6 lg:py-6">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Eenvoq AI</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        placeholder="What should I focus on today?"
                        className="flex-1 rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-black outline-none focus:border-[#a6ff00]"
                      />
                      <button type="button" onClick={() => { setActiveTab('ai'); handleSendPrompt('Summarize the most urgent priorities for my organization today.'); }} className="rounded-[18px] border border-black bg-[#a6ff00] px-4 py-3 text-sm font-semibold text-[#021201]">Eenvoq my data → </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: STOCK (INVENTORY) */}
              {activeTab === 'stock' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{inventoryLabel} intelligence center</p>
                      <h2 className="text-lg font-semibold text-black">{inventoryLabel} & Assets</h2>
                      <p className="mt-1 text-sm text-neutral-600">Monitor the health, status, growth, and risk of every managed record in one calm command center.</p>
                    </div>
                    <button
                      type="button"
                      onClick={openInventoryComposer}
                      className="flex md:inline-flex w-2/4 md:w-3/5 lg:w-auto items-center justify-center gap-2 rounded-2xl border border-black bg-[#a6ff00] px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#a6ff00]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Record Inventory</span>
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Inventory type</p>
                        <h3 className="mt-1 text-base font-semibold text-black">Choose what to manage</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {inventoryTypeOptions.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setInventoryType(option.id)}
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${inventoryType === option.id ? 'border-[#a6ff00] bg-[#a6ff00] text-black' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600">{inventoryTypeOptions.find((option) => option.id === inventoryType)?.description}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {overviewCards.map((card) => (
                      <div key={card.label} className="rounded-[20px] border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.025)]">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">{card.label}</p>
                        <p className="mt-2 text-xl font-semibold text-black">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] border border-[#a6ff00]/25 bg-[#a6ff00] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.025)]">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">AI intelligence</p>
                        <p className="mt-1 text-sm font-semibold text-black">{aiInsightText}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#a6ff00]/30 bg-white px-3 py-2 text-sm font-medium text-black">
                        <Sparkles className="h-4 w-4 text-[#a6ff00]" />
                        <span>See what needs attention, why, and what to do</span>
                      </div>
                    </div>
                  </div>

                  

                  

                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Record inventory</p>
                        <h3 className="mt-1 text-base font-semibold text-black">All inventory records</h3>
                      </div>
                    </div>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-700">Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-700">Category</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-700">Stock</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-700">Price</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-700">Status</th>
                            <th className="px-4 py-3 text-left font-semibold text-neutral-700">Updated</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 bg-white">
                          {inventoryRows.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-6 text-center text-sm text-neutral-500">No inventory records are available yet.</td>
                            </tr>
                          ) : (
                            [...inventoryRows].sort((a, b) => {
                              const aTime = new Date(a.lastUpdated || '1970-01-01').getTime();
                              const bTime = new Date(b.lastUpdated || '1970-01-01').getTime();
                              return bTime - aTime;
                            }).map((record) => (
                              <tr key={record.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 text-neutral-900 font-semibold">{record.name}</td>
                                <td className="px-4 py-3 text-neutral-600">{record.category}</td>
                                <td className="px-4 py-3 text-neutral-600">{record.stock ?? record.primaryMetric ?? '—'}</td>
                                <td className="px-4 py-3 text-neutral-600">{record.unitPrice ? formatCurrency(record.unitPrice) : '—'}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${record.status === 'Healthy' || record.status === 'Active' ? 'bg-[#a6ff00] text-black border border-[#a6ff00]' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-neutral-600">{record.lastUpdated || 'Today'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <form onSubmit={handleExpenseDraftSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-black">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Cost title</span>
                          <input value={expenseDraft.title} onChange={(event) => setExpenseDraft(prev => ({ ...prev, title: event.target.value }))} placeholder="Rent, transport, packaging..." className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black" required />
                        </label>
                        <label className="space-y-2 text-sm text-black">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Category</span>
                          <select value={expenseDraft.category} onChange={(event) => setExpenseDraft(prev => ({ ...prev, category: event.target.value }))} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black">
                            {['Utilities','Inventory','Marketing','Operations','Payroll','Travel','Software','Other'].map((option) => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="space-y-2 text-sm text-black">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Amount</span>
                          <input type="number" min="0" step="0.01" value={expenseDraft.amount} onChange={(event) => setExpenseDraft(prev => ({ ...prev, amount: Number(event.target.value) || 0 }))} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black" required />
                        </label>
                        <label className="space-y-2 text-sm text-black">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Date</span>
                          <input type="date" value={expenseDraft.date} onChange={(event) => setExpenseDraft(prev => ({ ...prev, date: event.target.value }))} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black" />
                        </label>
                        <label className="space-y-2 text-sm text-black">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Vendor</span>
                          <input value={expenseDraft.vendor} onChange={(event) => setExpenseDraft(prev => ({ ...prev, vendor: event.target.value }))} placeholder="Supplier or partner" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black" />
                        </label>
                        <label className="space-y-2 text-sm text-black">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Related product</span>
                          <input value={expenseDraft.product} onChange={(event) => setExpenseDraft(prev => ({ ...prev, product: event.target.value }))} placeholder="SKU or item" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black" />
                        </label>
                        <label className="space-y-2 text-sm text-black md:col-span-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Receipt or notes</span>
                          <textarea rows={3} value={expenseDraft.notes} onChange={(event) => setExpenseDraft(prev => ({ ...prev, notes: event.target.value }))} placeholder="Add any receipt reference or context" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black" />
                        </label>
                        <div className="md:col-span-2 flex justify-end">
                          <button type="submit" className={primaryActionClasses}>Save operating cost</button>
                        </div>
                      </form>
                    </div>
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Finance snapshot</p>
                          <h3 className="mt-1 text-base font-semibold text-black">Profitability at a glance</h3>
                        </div>
                        <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-black">Live</div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Revenue</p>
                          <p className="mt-2 text-lg font-semibold text-black">{formatCurrencyValue(financeSummary.revenue)}</p>
                        </div>
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Expenses</p>
                          <p className="mt-2 text-lg font-semibold text-black">{formatCurrencyValue(financeSummary.expensesTotal)}</p>
                        </div>
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Gross profit</p>
                          <p className="mt-2 text-lg font-semibold text-black">{formatCurrencyValue(financeSummary.grossProfit)}</p>
                        </div>
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">Net profit</p>
                          <p className="mt-2 text-lg font-semibold text-black">{formatCurrencyValue(financeSummary.netProfit)}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {expenses.slice(0, 4).map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between rounded-[16px] border border-neutral-200 bg-white px-3 py-2.5 text-sm">
                            <div>
                              <p className="font-semibold text-black">{expense.title}</p>
                              <p className="text-xs text-neutral-500">{expense.vendor || 'Vendor'} • {expense.category}</p>
                            </div>
                            <span className="font-semibold text-black">{formatCurrencyValue(expense.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 3: ORDERS (FULFILLMENT) */}
              {activeTab === 'orders' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{transactionLabel} workspace</p>
                      <h2 className="text-lg font-semibold text-black">{transactionLabel}s</h2>
                      <p className="mt-1 text-sm text-neutral-600">Record a sale from the inventory catalog, review it carefully, and submit it once everything is verified.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openTransactionComposer(null)}
                      className="flex md:inline-flex w-2/4 md:w-3/5 lg:w-auto items-center justify-center gap-2 rounded-2xl border border-black bg-[#a6ff00] px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#a6ff00]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Record a Sale</span>
                    </button>
                  </div>

                  {transactionNotice && (
                    <div className="rounded-[16px] border border-[#a6ff00]/30 bg-[#a6ff00] px-4 py-3 text-sm text-neutral-700">
                      {transactionNotice}
                    </div>
                  )}

                  {!showTransactionComposer ? (
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="space-y-4">
                      

                        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Recent sales</p>
                              <h3 className="mt-1 text-base font-semibold text-black">Latest records</h3>
                            </div>
                            <button type="button" onClick={() => openTransactionComposer(null)} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-black">
                              Record Sale
                            </button>
                          </div>
                          <div className="mt-4 space-y-3">
                            {orders.length === 0 ? (
                              <div className="rounded-[18px] border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
                                No transactions recorded yet. Start with the new guided form.
                              </div>
                            ) : orders.slice(0, 6).map((order) => (
                              <div key={order.id} className="rounded-[18px] border border-neutral-200 bg-white p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-black">{order.customerName}</p>
                                    <p className="text-xs text-neutral-500">{order.items[0]?.productName || order.inventoryName || 'Recorded item'}</p>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <p className="text-sm font-semibold text-black">{formatCurrency(order.totalAmount)}</p>
                                    <p className="text-xs text-neutral-500">{order.date ? new Date(order.date).toLocaleDateString() : 'Recently recorded'}</p>
                                  </div>
                                </div>
                                {canManageTransactions && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button type="button" onClick={() => openTransactionComposer(order)} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-black">Edit</button>
                                    <button type="button" onClick={() => deleteOrder(order.id)} className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">Delete</button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <aside className="xl:sticky xl:top-20 xl:self-start">
                        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Transaction rules</p>
                              <h3 className="mt-1 text-base font-semibold text-black">How to record a sale</h3>
                            </div>
                          </div>
                          <div className="mt-4 space-y-3 rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <div>• Select a {customerLabel.toLowerCase()} from CRM or choose a walk-in guest.</div>
                            <div>• Pick an inventory category and the exact item from the matching catalog.</div>
                            <div>• Review profit, loss, and balance due before submitting.</div>
                            <div>• Only owner and manager roles can edit or delete completed {activeOrganizationProfile.terminology.salesLabel.toLowerCase()}.</div>
                          </div>
                          <div className="mt-4 rounded-[18px] border border-[#a6ff00]/30 bg-[#a6ff00] p-3 text-sm text-neutral-700">
                            Currency defaults to <span className="font-semibold text-black">{businessCurrency || organizationSetup.currency || 'NGN (₦)'}</span>. To choose your business currency, go to Profile & Settings.
                          </div>
                        </div>
                      </aside>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Record {transactionLabel.toLowerCase()}</p>
                              <h3 className="mt-1 text-base font-semibold text-black">{transactionComposerStep === 'form' ? `Fill in the ${transactionLabel.toLowerCase()} details` : 'Review and confirm'}</h3>
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => { setShowTransactionComposer(false); setTransactionComposerStep('form'); setTransactionNotice(''); }} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Cancel</button>
                              {transactionComposerStep === 'preview' && (
                                <button type="button" onClick={() => setTransactionComposerStep('form')} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Edit</button>
                              )}
                            </div>
                          </div>

                          {transactionComposerStep === 'form' ? (
                            <div className="mt-4 space-y-4">
                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Transaction type</span>
                                  <select
                                    value={transactionDraft.transactionType}
                                    onChange={(event) => setTransactionDraft((prev) => ({ ...prev, transactionType: event.target.value as TransactionType }))}
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                  >
                                    {transactionTypeOptions.map((option) => (
                                      <option key={option.id} value={option.id}>{option.label}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">{recipientLabel}</span>
                                  <select
                                    value={transactionDraft.recipientId}
                                    onChange={(event) => setTransactionDraft((prev) => ({ ...prev, recipientId: event.target.value }))}
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                  >
                                    <option value="walk-in">Walk-in customer</option>
                                    {customers.map((customer) => (
                                      <option key={customer.id} value={customer.id}>{customer.name} • {customer.company}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Category</span>
                                  <select
                                    value={transactionDraft.category}
                                    onChange={(event) => {
                                      const nextCategory = event.target.value;
                                      const firstMatch = transactionInventoryCatalog.find((item) => item.category === nextCategory);
                                      setTransactionDraft((prev) => ({ ...prev, category: nextCategory, inventoryId: firstMatch?.id || '', inventoryName: firstMatch?.name || '', purchasePrice: firstMatch?.purchasePrice || 0, sellingPrice: firstMatch?.sellingPrice || 0 }));
                                    }}
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                  >
                                    <option value="">Choose a category</option>
                                    {transactionCategoryOptions.map((category) => (
                                      <option key={category} value={category}>{category}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Inventory item</span>
                                  <select
                                    value={transactionDraft.inventoryId}
                                    onChange={(event) => {
                                      const nextItem = transactionInventoryCatalog.find((item) => item.id === event.target.value);
                                      setTransactionDraft((prev) => ({ ...prev, inventoryId: event.target.value, inventoryName: nextItem?.name || '', purchasePrice: nextItem?.purchasePrice || 0, sellingPrice: nextItem?.sellingPrice || 0 }));
                                    }}
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                    disabled={!transactionDraft.category}
                                  >
                                    <option value="">Select an item</option>
                                    {transactionInventoryCatalog.filter((item) => item.category === transactionDraft.category).map((item) => (
                                      <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>

                              {transactionDraft.category && (
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {transactionInventoryCatalog.filter((item) => item.category === transactionDraft.category).map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => setTransactionDraft((prev) => ({ ...prev, inventoryId: item.id, inventoryName: item.name, purchasePrice: item.purchasePrice, sellingPrice: item.sellingPrice }))}
                                      className={`rounded-[18px] border p-3 text-left ${transactionDraft.inventoryId === item.id ? 'border-[#a6ff00] bg-[#a6ff00]' : 'border-neutral-200 bg-white'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-black">
                                          {item.name.charAt(0)}
                                        </div>
                                        <div>
                                          <p className="text-sm font-semibold text-black">{item.name}</p>
                                          <p className="text-xs text-neutral-500">{item.inventoryType} • {item.stock} available</p>
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Quantity sold</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={transactionDraft.quantity}
                                    onChange={(event) => setTransactionDraft((prev) => ({ ...prev, quantity: Number(event.target.value) || 1 }))}
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                  />
                                </label>
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Date sold</span>
                                  <input
                                    type="date"
                                    value={transactionDraft.soldDate}
                                    onChange={(event) => setTransactionDraft((prev) => ({ ...prev, soldDate: event.target.value }))}
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                  />
                                </label>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Purchase price</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={transactionDraft.purchasePrice}
                                    readOnly
                                    className="w-full rounded-2xl border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-sm text-black"
                                  />
                                </label>
                                <label className="space-y-2 text-sm text-black">
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Selling price</span>
                                  <div className="flex items-center rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                                    <span className="mr-2 text-sm text-neutral-500">{getCurrencySymbol(transactionDraft.currency)}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={transactionDraft.sellingPrice}
                                      onChange={(event) => setTransactionDraft((prev) => ({ ...prev, sellingPrice: Number(event.target.value) || 0 }))}
                                      className="w-full border-none bg-transparent text-sm text-black outline-none"
                                    />
                                  </div>
                                </label>
                              </div>

                              <div className="flex justify-end">
                                <button type="button" onClick={() => setTransactionComposerStep('preview')} className={primaryActionClasses}>
                                  Proceed to review
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-4">
                              <div className="rounded-[20px] border border-[#a6ff00]/30 bg-[#a6ff00] p-4 text-sm text-neutral-700">
                                Please review the transaction carefully. You can return to edit anything before submitting it.
                              </div>
                              <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Summary</p>
                                    <h4 className="mt-1 text-base font-semibold text-black">{selectedTransactionItem?.name || transactionDraft.inventoryName || 'Selected inventory'}</h4>
                                  </div>
                                  <div className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-black">
                                    {transactionDraft.transactionType === 'product-sale' ? 'Sale' : 'Transaction'}
                                  </div>
                                </div>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-[16px] border border-neutral-200 bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Recipient</p>
                                    <p className="mt-1 text-sm font-semibold text-black">{transactionDraft.recipientId === 'walk-in' ? 'Walk-in customer' : customers.find((customer) => customer.id === transactionDraft.recipientId)?.name || 'Walk-in customer'}</p>
                                  </div>
                                  <div className="rounded-[16px] border border-neutral-200 bg-white p-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Category</p>
                                    <p className="mt-1 text-sm font-semibold text-black">{transactionDraft.category || 'Unselected'}</p>
                                  </div>
                                </div>
                                <div className="mt-3 rounded-[16px] border border-neutral-200 bg-white p-3">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Quantity</span>
                                    <span className="font-semibold text-black">{saleQuantity}</span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Purchase cost</span>
                                    <span className="font-semibold text-black">{formatCurrencyValue(saleCost, transactionDraft.currency)}</span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Selling value</span>
                                    <span className="font-semibold text-black">{formatCurrencyValue(saleRevenue, transactionDraft.currency)}</span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Profit / loss</span>
                                    <span className={`font-semibold ${saleProfit >= 0 ? 'text-black' : 'text-red-600'}`}>{saleProfit >= 0 ? '+' : ''}{formatCurrencyValue(saleProfit, transactionDraft.currency)}</span>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Balance due</span>
                                    <span className="font-semibold text-black">{formatCurrencyValue(balanceDue, transactionDraft.currency)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button type="button" onClick={() => setTransactionComposerStep('form')} className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-black">Return to edit</button>
                                <button type="button" onClick={submitTransaction} className={primaryActionClasses}>Submit transaction</button>
                              </div>
                            </div>
                          )}
                        </div>

                        <aside className="xl:sticky xl:top-20 xl:self-start">
                          <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Live preview</p>
                                <h3 className="mt-1 text-base font-semibold text-black">Auto-calculated values</h3>
                              </div>
                            </div>
                            <div className="mt-4 space-y-3 rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                              <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-base font-semibold text-black">
                                  {selectedTransactionItem?.name?.charAt(0) || 'I'}
                                </div>
                                <div>
                                  <p className="font-semibold text-black">{selectedTransactionItem?.name || transactionDraft.inventoryName || 'Selected item'}</p>
                                  <p className="text-xs text-neutral-500">{transactionDraft.category || 'Pick a category'}</p>
                                </div>
                              </div>
                              <div className="rounded-[16px] border border-neutral-200 bg-white p-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-neutral-500">Purchase price</span>
                                  <span className="font-semibold text-black">{formatCurrencyValue(Number(transactionDraft.purchasePrice || selectedTransactionItem?.purchasePrice || 0), transactionDraft.currency)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                  <span className="text-neutral-500">Selling price</span>
                                  <span className="font-semibold text-black">{formatCurrencyValue(Number(transactionDraft.sellingPrice || selectedTransactionItem?.sellingPrice || 0), transactionDraft.currency)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                  <span className="text-neutral-500">Profit / loss</span>
                                  <span className={`font-semibold ${saleProfit >= 0 ? 'text-black' : 'text-red-600'}`}>{saleProfit >= 0 ? '+' : ''}{formatCurrencyValue(saleProfit, transactionDraft.currency)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </aside>
                      </div>

                      <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Transaction ledger</p>
                            <h3 className="mt-1 text-base font-semibold text-black">Recent transaction history</h3>
                          </div>
                        </div>
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-neutral-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Date</th>
                                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Customer</th>
                                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Item</th>
                                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Qty</th>
                                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Total</th>
                                <th className="px-4 py-3 text-left font-semibold text-neutral-700">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 bg-white">
                              {sortedOrders.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-neutral-500">No transactions have been recorded yet.</td>
                                </tr>
                              ) : (
                                sortedOrders.map((order) => (
                                  <tr key={order.id} className="hover:bg-neutral-50">
                                    <td className="px-4 py-3 text-neutral-600">{order.date ? new Date(order.date).toLocaleDateString() : 'Unknown'}</td>
                                    <td className="px-4 py-3 text-neutral-900 font-semibold">{order.customerName}</td>
                                    <td className="px-4 py-3 text-neutral-600">{order.items[0]?.productName || order.inventoryName || 'Item'}</td>
                                    <td className="px-4 py-3 text-neutral-600">{order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}</td>
                                    <td className="px-4 py-3 text-neutral-900 font-semibold">{formatCurrency(order.totalAmount)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'Completed' ? 'bg-[#a6ff00] text-black border border-[#a6ff00]' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                        {order.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VIEW 4: AI COACH */}
              {activeTab === 'ai' && (
                <div className="px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex h-[520px] flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-white p-3 shadow-[0_16px_60px_rgba(0,0,0,0.03)] sm:p-4 md:h-[580px] lg:p-5">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Eenvoq your data</p>
                    <h2 className="text-lg font-semibold text-black">Eenvoq AI Consultant</h2>


                  {/* Chat messages stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                    {chatMessages.map((msg, idx) => {
                      const isAi = msg.role === 'assistant';

                      return (
                        <div key={idx} className={`flex ${isAi ? 'justify-start' : 'justify-end'} items-start space-x-2.5`}>
                          {isAi && (
                            <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                              AI
                            </div>
                          )}
                          <div className={`p-3.5 rounded-lg text-sm border leading-relaxed max-w-[85%] ${
                            isAi 
                              ? 'bg-neutral-50 text-black border-neutral-200' 
                              : 'bg-white text-black border-neutral-900'
                          }`}>
                            {isAi ? (
                              <div className="space-y-1.5">{renderMarkdown(msg.content)}</div>
                            ) : (
                              <p className="font-normal whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {aiGenerating && (
                      <div className="flex justify-start items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          AI
                        </div>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-400 text-sm">
                          Drafting ledger insights...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input box at the bottom */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendPrompt();
                    }}
                    className="p-3 border-t border-neutral-100 bg-white flex items-center space-x-2 flex-shrink-0"
                  >
                    <input
                      type="text"
                      placeholder="Ask AI Advisor anything..."
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      className="flex-1 bg-neutral-50 border border-neutral-200 px-3.5 py-2.5 rounded-md text-sm font-normal text-black focus:bg-white focus:outline-none focus:border-black"
                      disabled={aiGenerating}
                    />
                    <button
                      type="submit"
                      className="bg-neutral-950 hover:bg-black text-white p-2.5 rounded-md flex items-center justify-center disabled:opacity-40 transition-colors"
                      disabled={!userPrompt.trim() || aiGenerating}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>
                </div>
              )}

              {/* VIEW 5: ANALYTICS (PROJECTIONS & PERFORMANCE) */}
              {activeTab === 'analytics' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Finance workspace</p>
                      <h2 className="text-lg font-semibold text-black">Operations, cash flow, and profit health</h2>
                      <p className="mt-1 text-sm text-neutral-600">Review revenue, hidden operating costs, and the month-to-month trend in one place.</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('stock')} className={secondaryActionClasses}>Operational costs</button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: 'Revenue', value: formatCurrencyValue(financeSummary.revenue) },
                      { label: 'Cost of goods', value: formatCurrencyValue(financeSummary.costOfGoods) },
                      { label: 'Operating costs', value: formatCurrencyValue(financeSummary.expensesTotal) },
                      { label: 'Net profit', value: formatCurrencyValue(financeSummary.netProfit) }
                    ].map((card) => (
                      <div key={card.label} className="rounded-[20px] border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.025)]">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">{card.label}</p>
                        <p className="mt-2 text-xl font-semibold text-black">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Month trend</p>
                          <h3 className="mt-1 text-base font-semibold text-black">Income vs operating costs</h3>
                        </div>
                        <div className="rounded-full border border-[#a6ff00]/30 bg-[#a6ff00] px-3 py-1 text-xs font-medium text-black">Rolling 6 months</div>
                      </div>
                      <div className="mt-4 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={financeSummary.monthlyTrend.length > 0 ? financeSummary.monthlyTrend : [{ month: 'Jan', income: 0, expenses: 0 }] } margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a6ff00" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="#a6ff00" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="month" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip formatter={(value) => [formatCurrencyValue(Number(value ?? 0)), '']} />
                            <Area type="monotone" dataKey="income" stroke="#111111" strokeWidth={2.2} fill="url(#incomeGradient)" />
                            <Area type="monotone" dataKey="expenses" stroke="#9ca3af" strokeWidth={1.8} fill="none" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">All expenses</p>
                          <h3 className="mt-1 text-base font-semibold text-black">Where cash is moving</h3>
                        </div>
                        <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-black">Updated live</div>
                      </div>
                      <div className="mt-4 space-y-3">
                        {financeSummary.expenseBreakdown.length > 0 ? financeSummary.expenseBreakdown.map((item) => (
                          <div key={item.name} className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-3">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="font-semibold text-black">{item.name}</span>
                              <span className="font-semibold text-black">{formatCurrencyValue(item.value)}</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200">
                              <div className="h-2 rounded-full bg-[#a6ff00]" style={{ width: `${Math.max(8, (item.value / Math.max(financeSummary.expensesTotal, 1)) * 100)}%` }} />
                            </div>
                          </div>
                        )) : <div className="rounded-[16px] border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">No expense categories recorded yet.</div>}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Recent operating costs</p>
                        <h3 className="mt-1 text-base font-semibold text-black">Latest entries</h3>
                      </div>
                      <button type="button" onClick={() => setActiveTab('stock')} className={secondaryActionClasses}>Add another cost</button>
                    </div>
                    <div className="mt-4 space-y-2">
                      {expenses.length > 0 ? expenses.slice(0, 6).map((expense) => (
                        <div key={expense.id} className="flex flex-col gap-1 rounded-[16px] border border-neutral-200 bg-neutral-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-black">{expense.title}</p>
                            <p className="text-sm text-neutral-600">{expense.vendor || 'Vendor'} • {expense.category} • {expense.date}</p>
                          </div>
                          <span className="font-semibold text-black">{formatCurrencyValue(expense.amount)}</span>
                        </div>
                      )) : <div className="rounded-[16px] border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">No operating costs recorded yet.</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 6: PROCUREMENT & SUPPLIERS */}
              {activeTab === 'procurement' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Supply chain</p>
                      <h2 className="text-lg font-semibold text-black">Registered partners</h2>
                      <p className="mt-1 text-sm text-neutral-600">Keep procurement, stock safety, and audit history connected from one place.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddSupplierModal(true)}
                      className="flex md:inline-flex w-3/4 md:w-3/5 lg:w-auto items-center gap-2 rounded-[12px] border border-black bg-[#a6ff00] px-3 py-2 text-sm font-semibold text-black transition-all hover:-translate-y-0.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Register partner</span>
                    </button>
                  </div>

                  {summary.lowStockCount > 0 && (
                    <div className="rounded-[22px] border border-neutral-200 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.025)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Replenishment alerts</p>
                          <h3 className="mt-1 text-base font-semibold text-black">Low stock items need attention</h3>
                        </div>
                        <span className="rounded-full border border-[#a6ff00]/25 bg-[#a6ff00] px-3 py-1 text-xs font-medium text-black">{summary.lowStockCount} flagged</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {products.filter(p => p && (p.stock ?? 0) <= (p.minStock ?? 0)).map(prod => (
                          <div key={prod.id} className="flex flex-col gap-2 rounded-[16px] border border-neutral-200 bg-neutral-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-black">{prod.name}</p>
                              <p className="text-sm text-neutral-600">SKU {prod.sku} • stock {prod.stock} / min {prod.minStock}</p>
                            </div>
                            <button
                              onClick={() => {
                                handleQuickRestock(prod.id, 25);
                                const newLog: AuditLog = {
                                  id: `log-${Date.now()}`,
                                  timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                                  category: 'Procurement' as const,
                                  message: `Sourced safety restock of 25 units for SKU ${prod.sku} from primary supplier.`
                                };
                                setAuditLogs(prev => [newLog, ...prev]);
                              }}
                              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-100"
                            >
                              Dispatch +25
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Partner directory</p>
                          <h3 className="mt-1 text-base font-semibold text-black">Current supplier roster</h3>
                        </div>
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-black">{suppliers.length} active</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {suppliers.map(sup => (
                          <div key={sup.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-semibold text-black">{sup.name}</h4>
                                <p className="mt-1 text-sm text-neutral-600">{sup.specialty}</p>
                              </div>
                              <span className="rounded-full border border-[#a6ff00]/25 bg-[#a6ff00] px-2.5 py-1 text-[11px] font-semibold text-black">{sup.leadTime} days</span>
                            </div>
                            <div className="mt-3 grid gap-2 border-t border-neutral-200/60 pt-3 text-sm text-black sm:grid-cols-2">
                              <div>
                                <span className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500">Contact</span>
                                <span className="mt-1 block">{sup.contact}</span>
                              </div>
                              <div>
                                <span className="block text-[11px] uppercase tracking-[0.2em] text-neutral-500">Email</span>
                                <span className="mt-1 block truncate">{sup.email}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Procurement health</p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Inventory coverage</p>
                          <p className="mt-2 text-lg font-semibold text-black">{products.length} active SKUs</p>
                        </div>
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Pending orders</p>
                          <p className="mt-2 text-lg font-semibold text-black">{summary.pendingOrdersCount}</p>
                        </div>
                        <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Receivables</p>
                          <p className="mt-2 text-lg font-semibold text-black">{formatCurrencyValue(financeSummary.accountsReceivable)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 7: AUDITING & SYSTEM LOGS */}
              {activeTab === 'audits' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Operations intelligence</p>
                      <h2 className="text-lg font-semibold text-black">Audit ledger trail</h2>
                      <p className="mt-1 text-sm text-neutral-600">Every action from sales, inventory, suppliers, and staff is captured in one activity stream.</p>
                    </div>
                    <button
                      onClick={() => setAuditLogs([])}
                      className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-50"
                    >
                      Clear logs
                    </button>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Register statement</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input 
                        type="text"
                        placeholder="Log dynamic statement..."
                        value={newAuditMessage}
                        onChange={(e) => setNewAuditMessage(e.target.value)}
                        className="flex-1 rounded-[14px] border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black outline-none focus:border-black"
                      />
                      <button
                        onClick={() => {
                          if (!newAuditMessage.trim()) return;
                          const newLog: AuditLog = {
                            id: `log-${Date.now()}`,
                            timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                            category: 'System' as const,
                            message: newAuditMessage
                          };
                          setAuditLogs(prev => [newLog, ...prev]);
                          setNewAuditMessage('');
                        }}
                        className="rounded-[14px] border border-black bg-[#a6ff00] px-3 py-2.5 text-sm font-semibold text-black"
                      >
                        Log event
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {auditLogs.length === 0 ? (
                      <div className="rounded-[20px] border border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">No ledger entries yet.</div>
                    ) : (
                      auditLogs.map(log => (
                        <div key={log.id} className="rounded-[18px] border border-neutral-200 bg-white p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                              {log.category}
                            </span>
                            <span className="text-sm text-neutral-500">{log.timestamp}</span>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-black">{log.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 8: PROFILE & BUSINESS SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-black">Profile & Settings</h2>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <button type="button" onClick={handleLogout} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Log out</button>
                      <label className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-black">
                        <input
                          type="checkbox"
                          checked={bottomNavVisible}
                          onChange={(event) => setBottomNavVisible(event.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 bg-white text-[#a6ff00] focus:ring-[#a6ff00]"
                        />
                        <span className="text-sm">Bottom nav visible</span>
                      </label>
                    </div>
                  </div>

                  {currentOperatorId === 'owner' && (
                    <div className="rounded-[16px] border border-[#a6ff00]/25 bg-[#a6ff00] p-3 text-sm text-neutral-700">
                      <p className="font-semibold text-black">Need help with account edits?</p>
                      <p className="mt-1">If you need support updating your profile or business details, email support@eenvoq.com.ng and our team will assist you.</p>
                    </div>
                  )}

                  {/* Avatar Picker and Owner details block */}
                  <div className="bg-neutral-50 border border-neutral-200/50 rounded-lg p-4 space-y-4">
                    <p className="text-sm font-semibold text-black">Business Owner Profile</p>
                    
                    {/* Presets selection */}
                    <div className="space-y-2">
                      <span className="text-neutral-400 block text-sm">Choose Preset Profile Picture</span>
                      <div className="flex gap-2 pb-1">
                        {[
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
                          'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&q=80',
                          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80'
                        ].map((pic, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProfilePic(pic)}
                            disabled={!isOwnerSession}
                            className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${
                              profilePic === pic ? 'border-black scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                            } ${!isOwnerSession ? 'cursor-not-allowed opacity-40' : ''}`}
                          >
                            <img src={pic} alt="preset" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom pic URL */}
                    <div className="space-y-1">
                      <span className="text-neutral-400 block text-sm">Custom Profile Image URL</span>
                      <input 
                        type="text" 
                        value={profilePic}
                        disabled
                        className="w-full bg-neutral-100 border border-neutral-200 focus:border-black focus:outline-none px-3 py-1.5 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                        placeholder="Image URL"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black block">Owner Full Name</label>
                        <input 
                          type="text" 
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          disabled
                          className="w-full bg-neutral-100 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black block">Owner Professional Email</label>
                        <input 
                          type="email" 
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          disabled
                          className="w-full bg-neutral-100 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black block">Administrative Role</label>
                        <input 
                          type="text" 
                          value={ownerRole}
                          onChange={(e) => setOwnerRole(e.target.value)}
                          disabled
                          className="w-full bg-neutral-100 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business config block */}
                  <div className="bg-neutral-50 border border-neutral-200/50 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-black">Business Configuration</p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black block">Registered Business Name</label>
                        <input 
                          type="text" 
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          disabled
                          className="w-full bg-neutral-100 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-semibold text-black block">Corporate Tax ID / Reference</label>
                        <input 
                          type="text" 
                          value={businessTaxId}
                          onChange={(e) => setBusinessTaxId(e.target.value)}
                          disabled
                          className="w-full bg-neutral-100 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-black block">Reporting Currency</label>
                          <select 
                            value={businessCurrency}
                            onChange={(e) => setBusinessCurrency(e.target.value)}
                            disabled
                            className="w-full bg-neutral-100 border border-neutral-200 px-3 py-2 rounded-md text-sm font-normal text-neutral-500 cursor-not-allowed"
                          >
                            <option value="USD ($)">USD ($)</option>
                            <option value="EUR (€)">EUR (€)</option>
                            <option value="GBP (£)">GBP (£)</option>
                            <option value="JPY (¥)">JPY (¥)</option>
                            <option value="NGN (₦)">NGN (₦)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-sm font-semibold text-black block">Safety Warning Level</label>
                          <input 
                            type="number" 
                            value={warningThreshold}
                            onChange={(e) => setWarningThreshold(parseInt(e.target.value) || 1)}
                            disabled={!isOwnerSession}
                            className={`w-full bg-white border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black ${!isOwnerSession ? 'cursor-not-allowed bg-neutral-100 text-neutral-500' : ''}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save preferences verification banner */}
                  <div className="p-3 border border-black bg-white rounded-md text-center">
                    <p className="text-sm font-semibold text-black">Profile and business configuration fields are locked and managed centrally. Contact support if you require edits.</p>
                  </div>

                </div>
              )}

              {/* VIEW 9: CUSTOMER CRM */}
              {activeTab === 'crm' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{customerLabel} workspace</p>
                      <h2 className="text-lg font-semibold text-black">{customerLabel} CRM</h2>
                      <p className="mt-1 text-sm text-neutral-600">Manage your {customerLabel.toLowerCase()} relationships, track interactions, and nurture your customer base.</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setShowEmailBlastModal(true)}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:border-[#a6ff00]"
                      >
                        <Sparkles className="w-3 h-3 inline-block mr-1" />
                        Outreach Blast
                      </button>
                      <button 
                        onClick={() => setShowAddCustomerModal(true)}
                        className="rounded-full border border-black bg-[#a6ff00] px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-[#a6ff00]"
                      >
                        <Plus className="w-3.5 h-3.5 inline-block mr-1" />
                        Add {customerLabel}
                      </button>
                    </div>
                  </div>

                  {/* CRM Search and Status Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                      <input 
                        type="text" 
                        placeholder="Search name, company or email..."
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 pl-9 text-sm text-black focus:border-black focus:outline-none"
                      />
                    </div>

                    {/* Status Filter buttons */}
                    <div className="flex overflow-x-auto gap-1 pb-1 no-scrollbar">
                      {['All', 'Active', 'Contacted', 'Follow Up', 'Inactive'].map(stFilter => (
                        <button
                          key={stFilter}
                          onClick={() => setCrmStatusFilter(stFilter)}
                          className={`px-3 py-1 rounded-full text-xs font-normal whitespace-nowrap transition-colors ${
                            crmStatusFilter === stFilter 
                              ? 'bg-neutral-950 text-white' 
                              : 'bg-neutral-50 hover:bg-neutral-100 text-black border border-neutral-200'
                          }`}
                        >
                          {stFilter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Records cards list */}
                  <div className="space-y-3">
                    {(() => {
                      const filtered = customers.filter(c => {
                        const sLower = crmSearch.toLowerCase();
                        const matchesSearch = c.name.toLowerCase().includes(sLower) || 
                                              c.company.toLowerCase().includes(sLower) || 
                                              c.email.toLowerCase().includes(sLower);
                        const matchesStatus = crmStatusFilter === 'All' || c.status === crmStatusFilter;
                        return matchesSearch && matchesStatus;
                      });

                      if (filtered.length === 0) {
                        return <p className="text-sm font-normal text-neutral-400 text-center py-8">No {customerLabel.toLowerCase()} records matched the current filters.</p>;
                      }

                      return filtered.map(c => (
                        <div key={c.id} className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-semibold text-black">{c.name}</h3>
                              <p className="text-xs font-normal text-neutral-500">{c.company} | {c.email}</p>
                              <p className="text-xs font-normal text-neutral-500">{c.phone}</p>
                            </div>
                            <span className="text-xs font-normal px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-full text-black">
                              {c.status}
                            </span>
                          </div>

                          {/* Purchase indicators */}
                          <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-neutral-200 text-xs text-black">
                            <div>
                              <span className="text-neutral-400 block">Total Spent:</span>
                              <span className="font-semibold">${c.totalSpent.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-neutral-400 block">Orders Count:</span>
                              <span className="font-semibold">{c.ordersCount} {transactionLabel.toLowerCase()}s</span>
                            </div>
                          </div>

                          {c.lastPurchaseDate && (
                            <p className="text-[11px] font-normal text-neutral-400 mt-2">
                              Last interaction: {c.lastPurchaseDate}
                            </p>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* VIEW 10: STAFF & ACCESS */}
              {activeTab === 'staff' && (
                <div className="space-y-4 px-2 pt-4 pb-3 sm:px-2 sm:pt-4 sm:pb-4 lg:px-2 lg:pt-4 lg:pb-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Governance & access</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-black">{staffLabel} & Access Control</h2>
                      <p className="mt-2 text-sm leading-7 text-neutral-600">
                        Protect the operating system with clear ownership, dependable approvals, and active oversight across every session and record.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (currentOperatorId !== 'owner') {
                          setConfirmAction({
                            title: 'Owner-only access',
                            description: 'Only the primary business owner can create or modify staff members. Please switch back to the owner session to continue.',
                            onConfirm: () => setConfirmAction(null)
                          });
                          return;
                        }
                        setShowAddStaffModal(true);
                      }}
                      disabled={currentOperatorId !== 'owner'}
                      className={`flex md:inline-flex w-3/4 md:w-3/5 lg:w-auto items-center gap-2 rounded-[12px] border px-3 py-2 text-sm font-semibold transition-all ${
                        currentOperatorId === 'owner'
                          ? 'border-black bg-[#a6ff00] text-black hover:-translate-y-0.5 hover:bg-[#a6ff00]'
                          : 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400'
                      }`}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add {staffLabel}</span>
                    </button>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Directory</p>
                          <h3 className="mt-1 text-lg font-semibold text-black">Roster & access</h3>
                        </div>
                        <span className="text-sm font-medium text-neutral-600">{staff.length + 1} people</span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="h-2.5 w-2.5 rounded-full bg-black animate-pulse" title="Online" />
                              <div>
                                <h4 className="text-sm font-semibold text-black">{ownerName}</h4>
                                <p className="text-xs text-neutral-500">Managing Director • Owner</p>
                              </div>
                            </div>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                              Primary
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#a6ff00]/25 bg-[#a6ff00] px-2.5 py-1 text-[11px] font-medium text-black">Full control</span>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">Approvals</span>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">Audit visibility</span>
                          </div>
                        </div>

                        {staff.length === 0 ? (
                          <p className="rounded-[18px] border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">No staff members registered.</p>
                        ) : (
                          staff.map((member) => (
                            <div key={member.id} className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className={`h-2.5 w-2.5 rounded-full ${member.online ? 'bg-black animate-pulse' : 'bg-neutral-350'}`} title={member.online ? 'Online' : 'Offline'} />
                                  <div>
                                    <h4 className="text-sm font-semibold text-black">{member.name}</h4>
                                    <p className="text-xs text-neutral-500">{member.role}</p>
                                  </div>
                                </div>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                                  {member.online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">Can record {transactionLabel.toLowerCase()}s</span>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">View inventory</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-neutral-200/60 pt-2">
                                <span className="text-[11px] text-neutral-500">Last active: {member.lastActive}</span>
                                {currentOperatorId === 'owner' ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleToggleStaffOnline(member.id, member.online)}
                                      className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-black transition hover:bg-neutral-100"
                                    >
                                      Toggle Status
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStaff(member.id)}
                                      className="text-[11px] font-medium text-neutral-500 transition hover:text-black"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] italic text-neutral-400">Protected</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Active sessions</p>
                        <div className="mt-3 space-y-2">
                          {staffSessions.map((session) => (
                            <div key={session.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-black">{session.name}</p>
                                  <p className="text-sm text-neutral-600">{session.role} • {session.device}</p>
                                </div>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                                  {session.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Security posture</p>
                        <div className="mt-4 rounded-[22px] border border-[#a6ff00]/20 bg-[#a6ff00] p-4">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-black" />
                            <p className="text-sm font-semibold text-black">Primary owner session verified</p>
                          </div>
                          <p className="mt-2 text-sm leading-7 text-neutral-600">
                            {currentOperatorId === 'owner'
                              ? 'You are operating in administrator mode with unrestricted workflow access and full visibility into audit events.'
                              : 'Current access is restricted to read-only governance controls until the owner reactivates a privileged session.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Directory</p>
                          <h3 className="mt-1 text-lg font-semibold text-black">Roster & permissions</h3>
                        </div>
                        <span className="text-sm font-medium text-neutral-600">{staff.length + 1} people</span>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="h-2.5 w-2.5 rounded-full bg-black animate-pulse" title="Online" />
                              <div>
                                <h4 className="text-sm font-semibold text-black">{ownerName}</h4>
                                <p className="text-xs text-neutral-500">Managing Director • Owner</p>
                              </div>
                            </div>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-black">
                              Primary
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#a6ff00]/25 bg-[#a6ff00] px-2.5 py-1 text-[11px] font-medium text-black">Full control</span>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">Approvals</span>
                            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">Audit visibility</span>
                          </div>
                        </div>

                        {staff.length === 0 ? (
                          <p className="rounded-[18px] border border-dashed border-neutral-200 bg-neutral-50 p-4 text-center text-sm text-neutral-500">No staff members registered.</p>
                        ) : (
                          staff.map((member) => (
                            <div key={member.id} className="rounded-[20px] border border-neutral-200 bg-neutral-50 p-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className={`h-2.5 w-2.5 rounded-full ${member.online ? 'bg-black animate-pulse' : 'bg-neutral-350'}`} title={member.online ? 'Online' : 'Offline'} />
                                  <div>
                                    <h4 className="text-sm font-semibold text-black">{member.name}</h4>
                                    <p className="text-xs text-neutral-500">{member.role}</p>
                                  </div>
                                </div>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                                  {member.online ? 'Online' : 'Offline'}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">Can record {transactionLabel.toLowerCase()}s</span>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">View inventory</span>
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-neutral-200/60 pt-2">
                                <span className="text-[11px] text-neutral-500">Last active: {member.lastActive}</span>
                                {currentOperatorId === 'owner' ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleToggleStaffOnline(member.id, member.online)}
                                      className="rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-black transition hover:bg-neutral-100"
                                    >
                                      Toggle Status
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStaff(member.id)}
                                      className="text-[11px] font-medium text-neutral-500 transition hover:text-black"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] italic text-neutral-400">Protected</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Active sessions</p>
                        <div className="mt-3 space-y-2">
                          {staffSessions.map((session) => (
                            <div key={session.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-black">{session.name}</p>
                                  <p className="text-sm text-neutral-600">{session.role} • {session.device}</p>
                                </div>
                                <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                                  {session.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Role & permissions</p>
                        <div className="mt-3 space-y-2">
                          {[
                            { title: 'Owner', detail: 'Full control • Approvals • Audit visibility', badge: 'Primary' },
                            { title: 'Manager', detail: 'Inventory review • Transaction oversight • Staff visibility', badge: 'Elevated' },
                            { title: 'Cashier', detail: 'Record sales • View orders • Limited admin actions', badge: 'Standard' }
                          ].map((role) => (
                            <div key={role.title} className="flex items-center justify-between rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                              <div>
                                <p className="text-sm font-semibold text-black">{role.title}</p>
                                <p className="mt-1 text-sm text-neutral-600">{role.detail}</p>
                              </div>
                              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">
                                {role.badge}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Audit trail</p>
                          <h3 className="mt-1 text-lg font-semibold text-black">Recent activity</h3>
                        </div>
                        <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm font-medium text-neutral-600">Live</div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {auditLogs.slice(0, 4).map((log) => (
                          <div key={log.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-black">{log.message}</p>
                              <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600">{log.category}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>{log.timestamp}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">AI risk monitoring</p>
                      <div className="mt-3 space-y-2">
                        {riskAlerts.map((alert) => (
                          <div key={alert.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-black">{alert.label}</p>
                              <KeyRound className="h-4 w-4 text-black" />
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">{alert.detail}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ai')}
                        className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-black bg-[#a6ff00] px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#a6ff00]"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Open advisor</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Bottom Tab Bar Navigation - Standard mobile paradigm */}
        {bottomNavVisible && (
          <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 lg:hidden">
            <div className="overflow-hidden rounded-[32px] border border-[#a6ff00] bg-[#021201] shadow-[0_28px_80px_rgba(0,0,0,0.35)]">
              <nav className="flex items-center justify-between gap-2 px-3 py-3">
                <button
                  onClick={() => setActiveTab('desk')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl border px-2 py-2 text-xs transition ${
                    activeTab === 'desk'
                      ? 'border-[#a6ff00] bg-[#021201] text-[#a6ff00]'
                      : 'border-transparent text-white/70 hover:border-[#a6ff00]/30 hover:text-[#a6ff00] hover:bg-white/5'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  <span>Home</span>
                </button>

                <button
                  onClick={() => setActiveTab('stock')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl border px-2 py-2 text-xs transition ${
                    activeTab === 'stock'
                      ? 'border-[#a6ff00] bg-[#021201] text-[#a6ff00]'
                      : 'border-transparent text-white/70 hover:border-[#a6ff00]/30 hover:text-[#a6ff00] hover:bg-white/5'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>Stock</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl border px-2 py-2 text-xs transition ${
                    activeTab === 'orders'
                      ? 'border-[#a6ff00] bg-[#021201] text-[#a6ff00]'
                      : 'border-transparent text-white/70 hover:border-[#a6ff00]/30 hover:text-[#a6ff00] hover:bg-white/5'
                  }`}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Sales</span>
                </button>

                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl border px-2 py-2 text-xs transition ${
                    activeTab === 'ai'
                      ? 'border-[#a6ff00] bg-[#021201] text-[#a6ff00]'
                      : 'border-transparent text-white/70 hover:border-[#a6ff00]/30 hover:text-[#a6ff00] hover:bg-white/5'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>AI</span>
                </button>

                <button
                  onClick={() => setActiveTab('tag')}
                  className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-3xl border px-2 py-2 text-xs transition ${
                    activeTab === 'tag'
                      ? 'border-[#a6ff00] bg-[#021201] text-[#a6ff00]'
                      : 'border-transparent text-white/70 hover:border-[#a6ff00]/30 hover:text-[#a6ff00] hover:bg-white/5'
                  }`}
                >
                  <Send className="w-5 h-5" />
                  <span>Tags</span>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ---------------------------------------------------- */}
      {/* DIALOG MODALS SECTION (STRICT MINIMAL STYLING) */}
      {/* ---------------------------------------------------- */}

      {/* SUCCESS MODAL: INVENTORY SAVED */}
      {showInventorySavedModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/45 p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_24px_90px_rgba(0,0,0,0.16)] flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#a6ff00] text-black mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Inventory Saved</h3>
            <p className="text-sm text-neutral-600">Your record has been successfully stored. Redirecting to stock page...</p>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL: SALE RECORDED */}
      {formSuccessType === 'order' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/45 p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_24px_90px_rgba(0,0,0,0.16)] flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#a6ff00] text-black mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Sale Successfully Recorded</h3>
            <p className="text-sm text-neutral-600">Your sale has been recorded. Returning to previous page...</p>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL: STAFF ADDED */}
      {formSuccessType === 'staff' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/45 p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_24px_90px_rgba(0,0,0,0.16)] flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#a6ff00] text-black mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Staff Member Added Successfully</h3>
            <p className="text-sm text-neutral-600">New staff member has been registered. Returning to previous page...</p>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL: SUPPLIER REGISTERED */}
      {formSuccessType === 'supplier' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-900/45 p-4">
          <div className="w-full max-w-sm rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_24px_90px_rgba(0,0,0,0.16)] flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#a6ff00] text-black mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Partner Registered Successfully</h3>
            <p className="text-sm text-neutral-600">New supplier partner has been registered. Returning to previous page...</p>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PRODUCT */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/45 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_24px_90px_rgba(0,0,0,0.16)]">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#a6ff00] text-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-black">{confirmAction.title}</h3>
                <p className="text-sm text-neutral-600">{confirmAction.description}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Cancel</button>
              <button type="button" onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="rounded-full border border-black bg-[#a6ff00] px-3 py-2 text-sm font-semibold text-black">Continue</button>
            </div>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 p-2 sm:p-4">
          <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-[20px] border border-neutral-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-3 sm:px-5 sm:py-4">
              <div>
                <h3 className="text-sm font-semibold text-black">Record intake</h3>
                <p className="text-[11px] leading-5 text-neutral-500 sm:text-xs">Capture a new record, review it, and submit once you are happy.</p>
              </div>
              <button 
                onClick={closeInventoryComposer}
                className="text-neutral-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={(event) => { event.preventDefault(); void handleInventoryComposerSubmit(event); }} className="space-y-3 p-3 sm:space-y-4 sm:p-5">
              {inventoryComposerStep === 'form' ? (
                <>
                      <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
                    <label className="space-y-1.5 text-xs text-black sm:text-sm">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">Category</span>
                      <select value={recordDraft.category} onChange={(event) => setRecordDraft((prev) => ({ ...prev, category: event.target.value as RecordCategory, details: {} }))} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm">
                        <option value="">Select category</option>
                        {allRecordCategories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs text-black sm:text-sm">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">Record name</span>
                      <input value={recordDraft.recordName} onChange={(event) => setRecordDraft((prev) => ({ ...prev, recordName: event.target.value }))} placeholder="Name this intake" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                    </label>
                  </div>

                  <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
                    <label className="space-y-1.5 text-xs text-black sm:text-sm">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">Status</span>
                      <select value={recordDraft.status} onChange={(event) => setRecordDraft((prev) => ({ ...prev, status: event.target.value as RecordDraft['status'] }))} className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </label>
                    <label className="space-y-1.5 text-xs text-black sm:text-sm">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">Notes</span>
                      <textarea rows={3} value={recordDraft.note} onChange={(event) => setRecordDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="Add a short note or context" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                    </label>
                  </div>

                  {recordDraft.category && (
                    <div className="grid gap-3">
                      {(generalCategoryFields[recordDraft.category] || []).map((field) => {
                        const isPriceField = field.key === 'price' || field.key === 'cost';
                        const isSupplierField = field.key === 'supplier' || field.key === 'supplierName' || field.key === 'vendorName';
                        if (isSupplierField) {
                          return (
                            <div key={field.key} className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">{field.label}</span>
                                <button type="button" onClick={() => setShowRecordSupplierComposer((value) => !value)} className="text-[11px] font-medium text-black underline">{showRecordSupplierComposer ? 'Hide' : 'Add supplier'}</button>
                              </div>
                              <select
                                value={recordSupplierSelection}
                                onChange={(event) => {
                                  const selected = event.target.value;
                                  setRecordSupplierSelection(selected);
                                  if (selected) {
                                    const supplier = suppliers.find((item) => item.id === selected);
                                    if (supplier) {
                                      setRecordDraft((prev) => ({ ...prev, details: { ...prev.details, supplier: supplier.name, supplierName: supplier.name, contactPerson: supplier.contact, phone: supplier.contact, email: supplier.email, businessName: supplier.businessName || '', address: supplier.address || '', whatsappNumber: supplier.whatsappNumber || '' } }));
                                    }
                                  }
                                }}
                                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm"
                              >
                                <option value="">Select existing supplier</option>
                                {suppliers.map((supplier) => (
                                  <option key={supplier.id} value={supplier.id}>{supplier.name} • {supplier.businessName || supplier.specialty}</option>
                                ))}
                              </select>
                              {showRecordSupplierComposer && (
                                <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-3 space-y-2">
                                  <input value={recordSupplierDraft.name} onChange={(event) => setRecordSupplierDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Supplier name" className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                                  <input value={recordSupplierDraft.businessName} onChange={(event) => setRecordSupplierDraft((prev) => ({ ...prev, businessName: event.target.value }))} placeholder="Business name" className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                                  <input value={recordSupplierDraft.address} onChange={(event) => setRecordSupplierDraft((prev) => ({ ...prev, address: event.target.value }))} placeholder="Address" className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                                  <input value={recordSupplierDraft.whatsappNumber} onChange={(event) => setRecordSupplierDraft((prev) => ({ ...prev, whatsappNumber: event.target.value }))} placeholder="WhatsApp number" className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                                  <input type="email" value={recordSupplierDraft.email} onChange={(event) => setRecordSupplierDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="w-full rounded-2xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" />
                                  <button type="button" onClick={() => {
                                    if (!recordSupplierDraft.name.trim() || !recordSupplierDraft.email.trim()) return;
                                    const nextSupplier = {
                                      id: `sup-${Date.now().toString().slice(-4)}`,
                                      name: recordSupplierDraft.name,
                                      specialty: 'New supplier',
                                      leadTime: 3,
                                      contact: recordSupplierDraft.whatsappNumber || recordSupplierDraft.email,
                                      email: recordSupplierDraft.email,
                                      businessName: recordSupplierDraft.businessName,
                                      address: recordSupplierDraft.address,
                                      whatsappNumber: recordSupplierDraft.whatsappNumber
                                    };
                                    setSuppliers((current) => [nextSupplier, ...current]);
                                    setRecordSupplierSelection(nextSupplier.id);
                                    setRecordDraft((prev) => ({ ...prev, details: { ...prev.details, supplier: nextSupplier.name, supplierName: nextSupplier.name, contactPerson: nextSupplier.contact, phone: nextSupplier.contact, email: nextSupplier.email, businessName: nextSupplier.businessName || '', address: nextSupplier.address || '', whatsappNumber: nextSupplier.whatsappNumber || '' } }));
                                    setRecordSupplierDraft({ name: '', businessName: '', address: '', whatsappNumber: '', email: '' });
                                    setShowRecordSupplierComposer(false);
                                  }} className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-[11px] font-medium text-black">Save supplier</button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (isPriceField) {
                          return (
                            <label key={field.key} className="space-y-1.5 text-xs text-black sm:text-sm">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">{field.label}</span>
                              <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm">
                                <span className="text-neutral-500">{businessCurrency || organizationSetup.currency || 'NGN (₦)'}</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={recordDraft.details[field.key] || ''}
                                  placeholder={field.placeholder || ''}
                                  onChange={(event) => setRecordDraft((prev) => ({ ...prev, details: { ...prev.details, [field.key]: event.target.value } }))}
                                  className="w-full border-0 bg-transparent text-xs text-black outline-none sm:text-sm"
                                />
                              </div>
                            </label>
                          );
                        }

                        return (
                          <label key={field.key} className="space-y-1.5 text-xs text-black sm:text-sm">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">{field.label}</span>
                            {field.type === 'textarea' ? (
                              <textarea
                                rows={field.options ? 4 : 3}
                                value={recordDraft.details[field.key] || ''}
                                placeholder={field.placeholder || ''}
                                onChange={(event) => setRecordDraft((prev) => ({ ...prev, details: { ...prev.details, [field.key]: event.target.value } }))}
                                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm"
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={recordDraft.details[field.key] || ''}
                                onChange={(event) => setRecordDraft((prev) => ({ ...prev, details: { ...prev.details, [field.key]: event.target.value } }))}
                                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm"
                              >
                                <option value="">Select {field.label.toLowerCase()}</option>
                                {field.options?.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={field.type}
                                value={recordDraft.details[field.key] || ''}
                                placeholder={field.placeholder || ''}
                                onChange={(event) => setRecordDraft((prev) => ({ ...prev, details: { ...prev.details, [field.key]: event.target.value } }))}
                                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="rounded-[16px] border border-dashed border-neutral-200 bg-neutral-50 p-2.5 text-sm text-neutral-600 sm:p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-black sm:text-sm">Attachment</p>
                        <p className="text-[11px] text-neutral-500 sm:text-xs">Upload related image or document preview.</p>
                      </div>
                      <label className="cursor-pointer rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-black sm:px-3 sm:py-1.5 sm:text-xs">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        Upload
                      </label>
                    </div>
                    {productImageBase64 ? <img src={productImageBase64} alt="preview" className="mt-3 h-24 w-full rounded-[12px] object-cover" /> : null}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-[16px] border border-[#a6ff00]/30 bg-[#a6ff00] p-4 text-sm text-neutral-700">
                    Please review everything before saving. You can return to edit the details if needed.
                  </div>
                  <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Category</span>
                      <span className="font-semibold text-black">{recordDraft.category || 'Other'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Name</span>
                      <span className="font-semibold text-black">{recordDraft.recordName || 'Untitled intake'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Status</span>
                      <span className="font-semibold text-black">{recordDraft.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Unit price</span>
                      <span className="font-semibold text-black">{(recordDraft.details.price || recordDraft.details.cost || '0')} {businessCurrency || organizationSetup.currency || 'NGN (₦)'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Supplier</span>
                      <span className="font-semibold text-black">{recordDraft.details.supplier || recordDraft.details.supplierName || 'Not selected'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Notes</span>
                      <span className="font-semibold text-black">{recordDraft.note || 'No notes'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3 sm:pt-4">
                <button type="button" onClick={inventoryComposerStep === 'form' ? closeInventoryComposer : () => setInventoryComposerStep('form')} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-normal text-black transition-colors hover:bg-neutral-50 sm:px-4 sm:py-2 sm:text-sm">
                  {inventoryComposerStep === 'form' ? 'Cancel' : 'Edit'}
                </button>
                <button type="submit" className={primaryActionClasses}>
                  {inventoryComposerStep === 'form' ? 'Review & Save' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-neutral-300 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-black">Modify Asset</h3>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="font-semibold text-black block">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-black block">Category</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black block">SKU Code</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, sku: e.target.value }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-black block">Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, stock: parseInt(e.target.value) || 0 }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black block">Min Safety Level</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, minStock: parseInt(e.target.value) || 1 }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-black block">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, price: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black block">Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, cost: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-neutral-950 hover:bg-black text-white px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LOG SALES ORDER */}
      {showAddOrderModal && (
        <div className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-neutral-300 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-black">Log Sales Order</h3>
              <button 
                onClick={() => setShowAddOrderModal(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="font-semibold text-black block">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Industries"
                  required
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-black">Order Line Items</label>
                  <button
                    type="button"
                    onClick={() => setNewOrder(prev => ({
                      ...prev,
                      items: [...prev.items, { productId: '', quantity: 1 }]
                    }))}
                    className="text-sm font-semibold text-black underline"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {newOrder.items.map((lineItem, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-neutral-50 p-2 rounded-md border border-neutral-200">
                      <select
                        required
                        value={lineItem.productId}
                        onChange={(e) => {
                          const updatedItems = [...newOrder.items];
                          updatedItems[index].productId = e.target.value;
                          setNewOrder(prev => ({ ...prev, items: updatedItems }));
                        }}
                        className="flex-1 bg-white border border-neutral-200 rounded px-2 py-1.5 text-sm text-black font-normal"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stock === 0}>
                            {p.name} (${p.price})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        required
                        value={lineItem.quantity}
                        onChange={(e) => {
                          const updatedItems = [...newOrder.items];
                          updatedItems[index].quantity = parseInt(e.target.value) || 1;
                          setNewOrder(prev => ({ ...prev, items: updatedItems }));
                        }}
                        className="w-14 bg-white border border-neutral-200 rounded px-2 py-1.5 text-center text-sm font-normal text-black"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (newOrder.items.length === 1) return;
                          setNewOrder(prev => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-neutral-500 hover:text-black font-semibold text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Pipeline Stage</label>
                <select
                  value={newOrder.status}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-neutral-950 hover:bg-black text-white px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Log Order
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD NEW STAFF MEMBER */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-neutral-300 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-black">Add Staff Member</h3>
              <button 
                onClick={() => setShowAddStaffModal(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateStaff} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-black block">Staff Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ada Nwankwo"
                  required
                  value={newStaffMember.name}
                  onChange={(e) => setNewStaffMember(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Role</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Assistant"
                  required
                  value={newStaffMember.role}
                  onChange={(e) => setNewStaffMember(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Status</label>
                <select
                  value={newStaffMember.online ? 'Online' : 'Offline'}
                  onChange={(e) => setNewStaffMember(prev => ({ ...prev, online: e.target.value === 'Online' }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-neutral-950 hover:bg-black text-white px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-neutral-300 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-black">Add CRM Customer</h3>
              <button 
                onClick={() => setShowAddCustomerModal(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCustomer} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-black block">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kemi Adebayo"
                  required
                  value={newCustomerRecord.name}
                  onChange={(e) => setNewCustomerRecord(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-black block">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@example.com"
                    required
                    value={newCustomerRecord.email}
                    onChange={(e) => setNewCustomerRecord(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-black block">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 809 000 0000"
                    required
                    value={newCustomerRecord.phone}
                    onChange={(e) => setNewCustomerRecord(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Company</label>
                <input
                  type="text"
                  placeholder="e.g. Nile Manufacturing"
                  value={newCustomerRecord.company}
                  onChange={(e) => setNewCustomerRecord(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Status</label>
                <select
                  value={newCustomerRecord.status}
                  onChange={(e) => setNewCustomerRecord(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                >
                  <option value="Active">Active</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-neutral-950 hover:bg-black text-white px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REGISTER PARTNER (SUPPLIER) */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-neutral-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-neutral-300 w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-black">Register supplier partner</h3>
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSupplier} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-black block">Supplier name</label>
                <input
                  type="text"
                  placeholder="e.g. Optima Sensors"
                  required
                  value={supplierDraft.name}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Business name</label>
                <input
                  type="text"
                  placeholder="Business or company name"
                  value={supplierDraft.businessName}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Address</label>
                <input
                  type="text"
                  placeholder="Physical or digital address"
                  value={supplierDraft.address}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">WhatsApp number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0199"
                  value={supplierDraft.whatsappNumber}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Email</label>
                <input
                  type="email"
                  placeholder="e.g. sales@partner.com"
                  required
                  value={supplierDraft.email}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="bg-white text-black border border-neutral-300 hover:bg-neutral-50 px-4 py-2 rounded-md font-normal text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                    type="submit"
                    className="bg-neutral-950 hover:bg-black text-white px-4 py-2 rounded-md font-normal text-sm transition-colors"
                  >
                    Save partner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
