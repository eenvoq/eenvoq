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
  KeyRound
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
import { supabase } from './supabaseClient';

type AppSession = { user: { id: string; email?: string } } | null;

// Interfaces matching the server models
interface AppUser {
  id: string;
  business_id: string;
  full_name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
  profile_pic?: string;
  online?: boolean;
  last_active?: string;
  is_active?: boolean;
}

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

type TransactionType = 'product-sale' | 'service-payment' | 'school-fee' | 'donation' | 'membership' | 'event-registration' | 'subscription' | 'custom';
type OrganizationKind = 'business' | 'school';
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
type InventoryType = 'Products' | 'Students' | 'Members' | 'Patients' | 'Assets' | 'Equipment' | 'Vehicles' | 'Custom Inventory';

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
  { id: 'school-fee' as TransactionType, label: 'School Fee', copy: 'Tuition, transport, hostel, and more.' },
  { id: 'donation' as TransactionType, label: 'Donation', copy: 'Contributions and sponsorships.' },
  { id: 'membership' as TransactionType, label: 'Membership', copy: 'Annual dues and renewals.' },
  { id: 'event-registration' as TransactionType, label: 'Event Registration', copy: 'Workshops, conferences, and gatherings.' },
  { id: 'subscription' as TransactionType, label: 'Subscription', copy: 'Recurring service access.' },
  { id: 'custom' as TransactionType, label: 'Custom Transaction', copy: 'Flexible entry for any workflow.' }
];

const organizationTypeOptions = [
  { id: 'business' as OrganizationKind, label: 'Business', helper: 'Commercial businesses and retailers.' },
  { id: 'school' as OrganizationKind, label: 'School', helper: 'Educational institutions and training centers.' }
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

const inventoryTypeOptions: Array<{ id: InventoryType; label: string; description: string }> = [
  { id: 'Products', label: 'Products', description: 'Inventory-led commerce and stock control.' },
  { id: 'Students', label: 'Students', description: 'Admissions, fees, attendance, and academic progress.' },
  { id: 'Members', label: 'Members', description: 'Membership records, dues, and engagement.' },
  { id: 'Patients', label: 'Patients', description: 'Patient records, visits, and follow-ups.' },
  { id: 'Assets', label: 'Assets', description: 'Facilities, shared resources, and long-term value.' },
  { id: 'Equipment', label: 'Equipment', description: 'Tools, devices, and operational gear.' },
  { id: 'Vehicles', label: 'Vehicles', description: 'Fleet vehicles, transport, and assigned mobility assets.' },
  { id: 'Custom Inventory', label: 'Custom Records', description: 'Flexible records for any operational need.' }
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

const educationRecordCategories = [
  'Student',
  'Staff',
  'Course/Class',
  'Classroom',
  'Subject',
  'Parent/Guardian',
  'Department',
  'Campus/Branch',
  'Books/Library',
  'Examination',
  'Academic Session',
  'Term/Semester',
  'Fee Structure',
  'Transportation',
  'Hostel/Accommodation',
  'Scholarship',
  'Event',
  'Product',
  'Service',
  'Supplier/Vendor',
  'Asset/Equipment',
  'Other'
] as const;

type EducationRecordCategory = (typeof educationRecordCategories)[number];

type RecordCategory = BusinessRecordCategory | EducationRecordCategory | '';

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
    { key: 'title', label: 'Record Title', type: 'text' },
    { key: 'summary', label: 'Summary', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ]
};

const educationCategoryFields: Record<EducationRecordCategory, FieldDefinition[]> = {
  Student: [
    { key: 'admissionNumber', label: 'Admission Number', type: 'text', placeholder: 'School admission number' },
    { key: 'passportPhotograph', label: 'Passport Photograph URL', type: 'text', placeholder: 'Image or upload link' },
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'middleName', label: 'Middle Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'preferredName', label: 'Preferred Name', type: 'text' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'] },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'nationality', label: 'Nationality', type: 'text' },
    { key: 'stateRegion', label: 'State or Region', type: 'text' },
    { key: 'localGovernment', label: 'Local Government', type: 'text' },
    { key: 'religion', label: 'Religion', type: 'text' },
    { key: 'bloodGroup', label: 'Blood Group', type: 'text' },
    { key: 'medicalConditions', label: 'Medical Conditions', type: 'textarea' },
    { key: 'admissionDate', label: 'Admission Date', type: 'date' },
    { key: 'currentAcademicSession', label: 'Current Academic Session', type: 'text' },
    { key: 'currentTermSemester', label: 'Current Term or Semester', type: 'text' },
    { key: 'currentClassCourse', label: 'Current Class or Course', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'assignedClassTeacher', label: 'Assigned Class Teacher', type: 'text' },
    { key: 'studentStatus', label: 'Student Status', type: 'select', options: ['Active', 'Inactive', 'Alumni', 'Suspended'] },
    { key: 'homeAddress', label: 'Home Address', type: 'textarea' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'country', label: 'Country', type: 'text' },
    { key: 'postalCode', label: 'Postal Code', type: 'text' },
    { key: 'studentPhoneNumber', label: 'Student Phone Number', type: 'tel' },
    { key: 'studentEmailAddress', label: 'Student Email Address', type: 'email' },
    { key: 'parentGuardianInformation', label: 'Parent / Guardian Information', type: 'textarea', placeholder: 'Multiple guardians and contact details' },
    { key: 'emergencyContactInformation', label: 'Emergency Contact Information', type: 'textarea' },
    { key: 'tuitionHistory', label: 'Tuition History', type: 'textarea' },
    { key: 'outstandingBalance', label: 'Outstanding Balance', type: 'text' },
    { key: 'discountsScholarships', label: 'Discounts / Scholarships', type: 'text' },
    { key: 'paymentPlans', label: 'Payment Plans', type: 'textarea' },
    { key: 'paymentHistory', label: 'Payment History', type: 'textarea' },
    { key: 'supportingDocuments', label: 'Supporting Documents', type: 'textarea', placeholder: 'Birth certificate, admission letter, reports, records, etc.' }
  ],
  Staff: [
    { key: 'staffId', label: 'Staff ID', type: 'text', placeholder: 'Auto-generated staff ID' },
    { key: 'passportPhotograph', label: 'Passport Photograph URL', type: 'text' },
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say'] },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'tel' },
    { key: 'whatsappNumber', label: 'WhatsApp Number', type: 'tel' },
    { key: 'emailAddress', label: 'Email Address', type: 'email' },
    { key: 'homeAddress', label: 'Home Address', type: 'textarea' },
    { key: 'employmentDate', label: 'Employment Date', type: 'date' },
    { key: 'employmentType', label: 'Employment Type', type: 'select', options: ['Full time', 'Part time', 'Contract', 'Temporary', 'Internship'] },
    { key: 'staffRole', label: 'Staff Role', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'assignedClassesCourses', label: 'Assigned Classes / Courses', type: 'text' },
    { key: 'reportingManager', label: 'Reporting Manager', type: 'text' },
    { key: 'employmentStatus', label: 'Employment Status', type: 'select', options: ['Active', 'Inactive', 'Suspended', 'On leave'] },
    { key: 'salaryAmount', label: 'Salary Amount', type: 'text' },
    { key: 'paymentFrequency', label: 'Payment Frequency', type: 'select', options: ['Monthly', 'Biweekly', 'Weekly', 'Contract'] },
    { key: 'bankName', label: 'Bank Name', type: 'text' },
    { key: 'accountNumber', label: 'Account Number', type: 'text' },
    { key: 'taxInformation', label: 'Tax Information', type: 'textarea' },
    { key: 'employmentContract', label: 'Employment Contract', type: 'textarea' },
    { key: 'curriculumVitae', label: 'Curriculum Vitae', type: 'textarea' },
    { key: 'professionalCertificates', label: 'Professional Certificates', type: 'textarea' },
    { key: 'identificationDocuments', label: 'Identification Documents', type: 'textarea' },
    { key: 'otherUploadedFiles', label: 'Other Uploaded Files', type: 'textarea' }
  ],
  'Course/Class': [
    { key: 'courseName', label: 'Course or Class Name', type: 'text' },
    { key: 'courseCode', label: 'Course Code', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'academicLevel', label: 'Academic Level', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'assignedTeachers', label: 'Assigned Teacher(s)', type: 'text' },
    { key: 'assistantTeachers', label: 'Assistant Teacher(s)', type: 'text' },
    { key: 'academicSession', label: 'Academic Session', type: 'text' },
    { key: 'termSemester', label: 'Term or Semester', type: 'text' },
    { key: 'classSchedule', label: 'Class Schedule', type: 'text', placeholder: 'Days and times' },
    { key: 'assignedClassroom', label: 'Assigned Classroom', type: 'text' },
    { key: 'totalStudents', label: 'Total Students', type: 'number' },
    { key: 'availableSpaces', label: 'Available Spaces', type: 'number' },
    { key: 'completionRate', label: 'Completion Rate', type: 'text' }
  ],
  Classroom: [
    { key: 'classroomName', label: 'Classroom Name', type: 'text' },
    { key: 'classroomCode', label: 'Classroom Code', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'floor', label: 'Floor / Location', type: 'text' },
    { key: 'resources', label: 'Resources', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Under maintenance'] }
  ],
  Subject: [
    { key: 'subjectName', label: 'Subject Name', type: 'text' },
    { key: 'subjectCode', label: 'Subject Code', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'assignedTeacher', label: 'Assigned Teacher', type: 'text' },
    { key: 'creditUnits', label: 'Credit Units', type: 'text' }
  ],
  'Parent/Guardian': [
    { key: 'fullName', label: 'Full Name', type: 'text' },
    { key: 'relationship', label: 'Relationship', type: 'text' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'tel' },
    { key: 'whatsappNumber', label: 'WhatsApp Number', type: 'tel' },
    { key: 'emailAddress', label: 'Email Address', type: 'email' },
    { key: 'occupation', label: 'Occupation', type: 'text' },
    { key: 'employer', label: 'Employer', type: 'text' },
    { key: 'homeAddress', label: 'Home Address', type: 'textarea' },
    { key: 'useStudentAddress', label: 'Use student address', type: 'select', options: ['Yes', 'No'] }
  ],
  Department: [
    { key: 'departmentName', label: 'Department Name', type: 'text' },
    { key: 'departmentCode', label: 'Department Code', type: 'text' },
    { key: 'headOfDepartment', label: 'Head of Department', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' }
  ],
  'Campus/Branch': [
    { key: 'campusName', label: 'Campus / Branch Name', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'contactPhone', label: 'Contact Phone', type: 'tel' },
    { key: 'contactEmail', label: 'Contact Email', type: 'email' },
    { key: 'capacity', label: 'Capacity', type: 'number' }
  ],
  'Asset/Equipment': [
    { key: 'assetName', label: 'Asset / Equipment Name', type: 'text' },
    { key: 'assetTag', label: 'Asset Tag', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Good', 'Fair', 'Needs repair'] },
    { key: 'maintenanceSchedule', label: 'Maintenance Schedule', type: 'text' }
  ],
  Examination: [
    { key: 'examName', label: 'Examination Name', type: 'text' },
    { key: 'examCode', label: 'Exam Code', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'weighting', label: 'Weighting', type: 'text' },
    { key: 'relatedSubject', label: 'Related Subject', type: 'text' }
  ],
  'Academic Session': [
    { key: 'sessionName', label: 'Session Name', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ],
  'Term/Semester': [
    { key: 'termName', label: 'Term / Semester Name', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ],
  'Fee Structure': [
    { key: 'feeName', label: 'Fee Structure Name', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'paymentFrequency', label: 'Payment Frequency', type: 'select', options: ['One-time', 'Monthly', 'Termly', 'Yearly'] }
  ],
  Scholarship: [
    { key: 'scholarshipName', label: 'Scholarship Name', type: 'text' },
    { key: 'eligibility', label: 'Eligibility', type: 'textarea' },
    { key: 'amount', label: 'Amount', type: 'number' },
    { key: 'applicationDeadline', label: 'Application Deadline', type: 'date' }
  ],
  Event: [
    { key: 'eventName', label: 'Event Name', type: 'text' },
    { key: 'eventDate', label: 'Event Date', type: 'date' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' }
  ],
  Transportation: [
    { key: 'routeName', label: 'Route Name', type: 'text' },
    { key: 'vehicle', label: 'Vehicle', type: 'text' },
    { key: 'driver', label: 'Driver', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'number' }
  ],
  'Hostel/Accommodation': [
    { key: 'hostelName', label: 'Hostel Name', type: 'text' },
    { key: 'roomNumber', label: 'Room Number', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'number' },
    { key: 'availableSpaces', label: 'Available Spaces', type: 'number' },
    { key: 'supervisor', label: 'Supervisor', type: 'text' }
  ],
  Product: [
    { key: 'productName', label: 'Product Name', type: 'text' },
    { key: 'productCode', label: 'Product Code', type: 'text' },
    { key: 'category', label: 'Product Category', type: 'text' },
    { key: 'price', label: 'Unit Price', type: 'number' },
    { key: 'stock', label: 'Stock Quantity', type: 'number' },
    { key: 'supplier', label: 'Supplier', type: 'text' }
  ],
  Service: [
    { key: 'serviceName', label: 'Service Name', type: 'text' },
    { key: 'description', label: 'Service Description', type: 'textarea' },
    { key: 'price', label: 'Service Price', type: 'number' },
    { key: 'provider', label: 'Service Provider', type: 'text' }
  ],
  'Books/Library': [
    { key: 'title', label: 'Book Title', type: 'text' },
    { key: 'author', label: 'Author', type: 'text' },
    { key: 'isbn', label: 'ISBN', type: 'text' },
    { key: 'location', label: 'Library Location', type: 'text' },
    { key: 'copiesAvailable', label: 'Copies Available', type: 'number' }
  ],
  'Supplier/Vendor': [
    { key: 'vendorName', label: 'Vendor / Supplier Name', type: 'text' },
    { key: 'vendorCategory', label: 'Category', type: 'text' },
    { key: 'contactPerson', label: 'Contact Person', type: 'text' },
    { key: 'phoneNumber', label: 'Phone Number', type: 'tel' },
    { key: 'emailAddress', label: 'Email Address', type: 'email' },
    { key: 'address', label: 'Address', type: 'textarea' }
  ],
  Other: [
    { key: 'title', label: 'Record Title', type: 'text' },
    { key: 'summary', label: 'Summary', type: 'textarea' },
    { key: 'notes', label: 'Notes', type: 'textarea' }
  ]
};

const generalCategoryFields: Record<Exclude<RecordCategory, ''>, FieldDefinition[]> = {
  ...businessCategoryFields,
  ...educationCategoryFields
};

const getRecordCategories = (profileType: OrganizationTypeKey) =>
  profileType === 'school' ? educationRecordCategories : businessRecordCategories;

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
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [businessId, setBusinessId] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetPasswordMessage, setResetPasswordMessage] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordCooldown, setResetPasswordCooldown] = useState(0);

  useEffect(() => {
    setForgotPasswordMode(false);
    setResetPasswordMessage('');
    setResetPasswordError('');
    setPasswordVisible(false);
    setResetPasswordCooldown(0);
  }, [authMode]);

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
  const [ownerName, setOwnerName] = useState('Business Owner');
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
  const [splashActive, setSplashActive] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [glowVisible, setGlowVisible] = useState(false);
  const [splashMessageIndex, setSplashMessageIndex] = useState(0);
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
  const activeOrganizationProfile = getOrganizationProfile(organizationSetup.profileType || organizationType);
  const transactionLabel = activeOrganizationProfile.terminology.transactionLabel;
  const customerLabel = activeOrganizationProfile.terminology.customerLabel;
  const inventoryLabel = activeOrganizationProfile.terminology.inventoryLabel;
  const staffLabel = activeOrganizationProfile.terminology.staffLabel;
  const dashboardLabel = activeOrganizationProfile.terminology.dashboardLabel;
  const recipientLabel = activeOrganizationProfile.terminology.recipientLabel;
  const summaryLabel = activeOrganizationProfile.terminology.summaryLabel;
  const allRecordCategories = getRecordCategories(organizationSetup.profileType || organizationType);
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
  const [deskRange, setDeskRange] = useState<'Today' | 'This Week' | 'This Month' | 'This Quarter' | 'This Year'>('This Week');
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
  const [supplierDraft, setSupplierDraft] = useState({ name: '', specialty: 'Smart Devices & Security', leadTime: 5, contact: '', email: '' });
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
  const [newOrder, setNewOrder] = useState<{
    customerName: string;
    items: Array<OrderItem>;
    status: 'Pending';
  }>({
    customerName: '',
    items: [{ productId: '', productName: '', quantity: 1, price: 0 }],
    status: 'Pending'
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
      authMode
    };
    localStorage.setItem('eenvoq-session', JSON.stringify(session));
  }, [appMode, activeTab, authMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionData = localStorage.getItem('eenvoq-session');
    if (sessionData) {
      try {
        const savedSession = JSON.parse(sessionData) as { isLoggedIn: boolean; appMode: AppMode; activeTab: typeof activeTab; authMode: 'login' | 'signup' };
        if (savedSession.isLoggedIn) {
          setAppMode('app');
          setActiveTab(savedSession.activeTab);
          setAuthMode(savedSession.authMode);
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
        setOrganizationSetup(parsed);
        setBusinessName(parsed.name || 'Your Business');
        setBusinessCurrency(parsed.currency || 'NGN (₦)');
        setOrganizationType(parsed.profileType as OrganizationKind);
      } catch (error) {
        console.error('Unable to restore organization config', error);
      }
    }

    const initSupabaseAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase auth init error', error);
        return;
      }

      if (data?.session?.user) {
        await handleAuthSession(data.session as AppSession);
      } else {
        setAppMode('auth');
      }
    };

    initSupabaseAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event: string, session: AppSession) => {
      if (session?.user) {
        await handleAuthSession(session);
      } else {
        setSession(null);
        setProfile(null);
        setBusinessId('');
        setAppMode('auth');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw error;
    }

    return data as AppUser & { business_name?: string; business_currency?: string };
  };

  const createBusinessAndProfile = async (userId: string, fullName: string, email: string) => {
    const defaultBusiness = {
      name: `${fullName.split(' ')[0] || 'Team'}'s business`,
      industry: 'Retail',
      subtype: 'Retail Store',
      location: 'Lagos, Nigeria',
      currency: 'USD ($)',
      contact_email: email,
      contact_phone: '',
      modules: organizationSetup.modules,
      logo_url: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert(defaultBusiness)
      .select()
      .single();

    if (businessError || !businessData) {
      throw businessError || new Error('Unable to create business.');
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        business_id: businessData.id,
        full_name: fullName,
        email,
        role: 'owner',
        profile_pic: '',
        online: true,
        last_active: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError || !profileData) {
      throw profileError || new Error('Unable to create profile.');
    }

    return { business: businessData, profile: profileData };
  };

  const handleAuthSession = async (authSession: AppSession) => {
    if (!authSession?.user) {
      setAppMode('auth');
      return;
    }

    setSession(authSession);

    try {
      const accountProfile = await fetchProfile(authSession.user.id);
      setProfile(accountProfile);
      setBusinessId(accountProfile.business_id);
      setOwnerName(accountProfile.full_name || 'Business Owner');
      setOwnerEmail(accountProfile.email || '');
      setOwnerRole(accountProfile.role || 'Owner');
      setBusinessName(accountProfile.business_name || businessName);
      setBusinessCurrency(accountProfile.business_currency || businessCurrency);
      setAuthName(accountProfile.full_name || '');
      setAuthEmail(accountProfile.email || '');
      setAuthError('');
      setAppMode('app');
      await loadAllData(accountProfile.business_id);
      await loadOrganizationConfig();
    } catch (error) {
      console.error('Error loading profile data', error);
      setAppMode('onboarding');
    }
  };

  const handleAuthSubmit = async (mode: 'login' | 'signup') => {
    setAuthError('');
    setAuthLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        });

        if (error) {
          setAuthError(error.message);
          return;
        }

        if (data?.session) {
          await handleAuthSession(data.session);
        } else if (data?.user) {
          await createBusinessAndProfile(data.user.id, authName || data.user.email || 'Business Owner', authEmail);
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            await handleAuthSession(sessionData.session);
          }
        }
      } else {
        if (!authName.trim() || !authEmail.trim() || !authPassword.trim()) {
          setAuthError('Name, email, and password are required.');
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword
        });

        if (error) {
          setAuthError(error.message);
          return;
        }

        const signedUpUserId = data?.user?.id;
        const session = data?.session;

        if (session && signedUpUserId) {
          await createBusinessAndProfile(signedUpUserId, authName, authEmail);
          await handleAuthSession(session);
          return;
        }

        if (signedUpUserId) {
          setAuthError('Account created. Please confirm your email before logging in.');
          return;
        }

        setAuthError('Account created. Please check your email to confirm sign up.');
      }
    } catch (error) {
      console.error('Authentication error', error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else if (error && typeof error === 'object' && 'message' in error) {
        setAuthError((error as { message?: string }).message || 'An unexpected auth error occurred.');
      } else {
        setAuthError('An unexpected auth error occurred.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (resetPasswordCooldown > 0) {
      setResetPasswordError(`Please wait ${resetPasswordCooldown} second${resetPasswordCooldown === 1 ? '' : 's'} before requesting another reset email.`);
      return;
    }

    setResetPasswordError('');
    setResetPasswordMessage('');
    setResetPasswordLoading(true);

    if (!authEmail.trim()) {
      setResetPasswordError('Please enter your email address to reset your password.');
      setResetPasswordLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      });

      if (error) {
        const message = error.message || 'Unable to send reset email. Please try again.';
        setResetPasswordError(message.includes('rate limit') || message.includes('Rate limit') ? 'Email send rate limit exceeded. Please wait a few minutes and try again.' : message);
        setResetPasswordCooldown(60);
      } else {
        setResetPasswordMessage('If an account exists for that email, a reset link has been sent. Please check your inbox.');
        setResetPasswordCooldown(60);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset email. Please try again.';
      setResetPasswordError(message.includes('rate limit') || message.includes('Rate limit') ? 'Email send rate limit exceeded. Please wait a few minutes and try again.' : message);
      setResetPasswordCooldown(60);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error', error);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('eenvoq-session');
    }

    setSession(null);
    setProfile(null);
    setBusinessId('');
    setAppMode('auth');
    setAuthMode('login');
    setAuthName('');
    setAuthEmail('');
    setAuthPassword('');
    setPasswordVisible(false);
    setForgotPasswordMode(false);
    setResetPasswordMessage('');
    setResetPasswordError('');
    setResetPasswordCooldown(0);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('eenvoq-organization-config', JSON.stringify(organizationSetup));
  }, [organizationSetup]);

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
      applyTheme('#8EE5C2');
    }
  }, [appMode]);

  useEffect(() => {
    if (resetPasswordCooldown <= 0) return;

    const interval = window.setInterval(() => {
      setResetPasswordCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resetPasswordCooldown]);

  useEffect(() => {
    if (appMode !== 'app') {
      setSplashActive(false);
      setLogoVisible(false);
      setGlowVisible(false);
      setSplashMessageIndex(0);
      return;
    }

    setSplashActive(true);
    setLogoVisible(false);
    setGlowVisible(false);
    setSplashMessageIndex(0);

    const logoTimer = window.setTimeout(() => setLogoVisible(true), 40);
    const glowTimer = window.setTimeout(() => setGlowVisible(true), 560);
    const glowFadeTimer = window.setTimeout(() => setGlowVisible(false), 1120);
    const messageTimer = window.setInterval(() => {
      setSplashMessageIndex((currentIndex) => (currentIndex + 1) % splashMessages.length);
    }, 800);
    const completionTimer = window.setTimeout(() => setSplashActive(false), 1800);

    return () => {
      window.clearTimeout(logoTimer);
      window.clearTimeout(glowTimer);
      window.clearTimeout(glowFadeTimer);
      window.clearInterval(messageTimer);
      window.clearTimeout(completionTimer);
    };
  }, [appMode, splashMessages.length]);

  // Initial Data Fetching
  const getActiveBusinessId = () => businessId || profile?.business_id;

  const loadAllData = async (businessIdOverride?: string) => {
    const activeBusinessId = businessIdOverride || getActiveBusinessId();
    if (!activeBusinessId) {
      return;
    }

    try {
      setLoading(true);
      const [productsResponse, ordersResponse, customersResponse, suppliersResponse, expensesResponse, staffResponse] = await Promise.all([
        supabase.from('products').select('*').eq('business_id', activeBusinessId),
        supabase.from('orders').select('*').eq('business_id', activeBusinessId),
        supabase.from('customers').select('*').eq('business_id', activeBusinessId),
        supabase.from('suppliers').select('*').eq('business_id', activeBusinessId),
        supabase.from('expenses').select('*').eq('business_id', activeBusinessId),
        supabase.from('profiles').select('*').eq('business_id', activeBusinessId)
      ]);

      if (productsResponse.error) throw productsResponse.error;
      if (ordersResponse.error) throw ordersResponse.error;
      if (customersResponse.error) throw customersResponse.error;
      if (suppliersResponse.error) throw suppliersResponse.error;
      if (expensesResponse.error) throw expensesResponse.error;
      if (staffResponse.error) throw staffResponse.error;

      const productRecords = (productsResponse.data || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        stock: product.stock ?? 0,
        minStock: product.min_stock ?? 0,
        price: Number(product.price ?? 0),
        cost: Number(product.cost ?? 0),
        image: product.image_url || product.image || '',
        status: product.status,
        note: product.note,
        details: product.details ?? {},
        lastModifiedBy: product.last_modified_by ?? '',
        owner: product.owner ?? '',
        updatedAt: product.updated_at ?? '',
        createdAt: product.created_at ?? '',
        tags: product.tags ?? [],
        attachments: product.attachments ?? []
      })) as Product[];

      const orderRecords = (ordersResponse.data || []).map((order: any) => ({
        id: order.id,
        customerName: order.customer_name,
        items: order.items ?? [],
        totalAmount: Number(order.total_amount ?? 0),
        date: order.date || order.created_at || '',
        status: order.status,
        recordedBy: order.recorded_by,
        transactionType: order.transaction_type,
        recipientId: order.recipient_id,
        recipientName: order.recipient_name,
        category: order.category,
        inventoryId: order.inventory_id,
        inventoryName: order.inventory_name,
        inventoryPhoto: order.inventory_photo,
        saleDate: order.sale_date,
        purchasePrice: Number(order.purchase_price ?? 0),
        sellingPrice: Number(order.selling_price ?? 0),
        profit: Number(order.profit ?? 0),
        balanceDue: Number(order.balance_due ?? 0),
        currency: order.currency,
        notes: order.notes,
        createdAt: order.created_at ?? '',
        updatedAt: order.updated_at ?? ''
      })) as Order[];

      const customerRecords = (customersResponse.data || []).map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        status: customer.status,
        totalSpent: Number(customer.total_spent ?? 0),
        ordersCount: customer.orders_count ?? 0,
        lastPurchaseDate: customer.last_purchase_date,
        createdAt: customer.created_at ?? '',
        updatedAt: customer.updated_at ?? ''
      })) as Customer[];

      const supplierRecords = (suppliersResponse.data || []).map((supplier: any) => ({
        id: supplier.id,
        name: supplier.name,
        specialty: supplier.specialty,
        leadTime: supplier.lead_time ?? 0,
        contact: supplier.contact ?? '',
        email: supplier.email ?? '',
        createdAt: supplier.created_at ?? '',
        updatedAt: supplier.updated_at ?? ''
      })) as Supplier[];

      const expenseRecords = (expensesResponse.data || []).map((expense: any) => ({
        id: expense.id,
        title: expense.title,
        category: expense.category,
        amount: Number(expense.amount ?? 0),
        date: expense.date,
        vendor: expense.vendor ?? '',
        product: expense.product ?? '',
        notes: expense.notes ?? '',
        receipt: expense.receipt_url ?? expense.receipt ?? '',
        recordedBy: expense.recorded_by,
        createdAt: expense.created_at ?? '',
        updatedAt: expense.updated_at ?? ''
      })) as ExpenseRecord[];

      const staffRecords = (staffResponse.data || []).map((profileItem: any) => ({
        id: profileItem.id,
        name: profileItem.full_name || profileItem.email || 'Team member',
        role: profileItem.role || 'Staff',
        online: profileItem.online || false,
        lastActive: profileItem.last_active || ''
      }));

      setProducts(productRecords);
      setOrders(orderRecords);
      setCustomers(customerRecords);
      setSuppliers(supplierRecords);
      setExpenses(expenseRecords);
      setStaff(staffRecords);

      const revenue = orderRecords.reduce((acc, order) => acc + Number(order.totalAmount || 0), 0);
      const cost = orderRecords.reduce((acc, order) => acc + Number(order.purchasePrice || 0), 0);
      const profit = revenue - cost;
      const lowStockCount = productRecords.filter((product) => (product.stock ?? 0) <= (product.minStock ?? 0)).length;
      const pendingOrdersCount = orderRecords.filter((order) => ['Pending', 'Processing'].includes(order.status)).length;
      const categoryBreakdown = Array.from(
        productRecords.reduce((map, product) => {
          const category = product.category || 'Other';
          const value = Number(product.price ?? 0) * Number(product.stock ?? 0);
          map.set(category, (map.get(category) || 0) + value);
          return map;
        }, new Map<string, number>())
      ).map(([name, value]) => ({ name, value }));

      setSummary({
        revenue,
        cost,
        profit,
        totalProducts: productRecords.length,
        lowStockCount,
        pendingOrdersCount,
        topSelling: [],
        categoryBreakdown
      });
    } catch (e) {
      console.error('Error loading data from Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    loadOrganizationConfig();
  }, []);

  // Helper: Active Session User Name
  const getOperatorName = () => {
    if (currentOperatorId === 'owner') return ownerName;
    const found = staff.find(s => s.id === currentOperatorId);
    return found ? found.name : ownerName;
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
    const activeBusinessId = getActiveBusinessId();
    if (!activeBusinessId) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', activeBusinessId)
        .single();

      if (error) {
        console.error('Unable to load business config', error);
        return;
      }

      if (data) {
        const config: OrganizationSetupConfig = {
          profileType: organizationSetup.profileType,
          name: data.name || 'Your Business',
          industry: data.industry || organizationSetup.industry,
          subtype: data.subtype || organizationSetup.subtype,
          location: data.location || organizationSetup.location,
          currency: data.currency || organizationSetup.currency,
          contactEmail: data.contact_email || organizationSetup.contactEmail,
          contactPhone: data.contact_phone || organizationSetup.contactPhone,
          staffCount: organizationSetup.staffCount,
          modules: (data.modules as ModuleKey[]) || organizationSetup.modules,
          logoUrl: data.logo_url || organizationSetup.logoUrl
        };

        setOrganizationSetup(config);
        setBusinessName(config.name || 'Your Business');
        setBusinessCurrency(config.currency || 'NGN (₦)');
        setOrganizationType(config.profileType as OrganizationKind);

        if (typeof window !== 'undefined') {
          localStorage.setItem('eenvoq-organization-config', JSON.stringify(config));
        }
      }
    } catch (error) {
      console.error('Unable to load organization config', error);
    }
  };

  const handleOrganizationSetup = async (config: OrganizationSetupConfig) => {
    setOrganizationSetup(config);
    setBusinessName(config.name || 'Your Business');
    setBusinessCurrency(config.currency || 'NGN (₦)');
    setOrganizationType(config.profileType as OrganizationKind);
    setAppMode('app');
    setActiveTab('desk');

    if (typeof window !== 'undefined') {
      localStorage.setItem('eenvoq-organization-config', JSON.stringify(config));
    }

    const activeBusinessId = getActiveBusinessId();
    if (!activeBusinessId) {
      return;
    }

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: config.name,
          industry: config.industry,
          subtype: config.subtype,
          location: config.location,
          currency: config.currency,
          contact_email: config.contactEmail,
          contact_phone: config.contactPhone,
          modules: config.modules,
          logo_url: config.logoUrl
        })
        .eq('id', activeBusinessId);

      if (error) {
        console.error('Unable to persist organization config', error);
      }
    } catch (error) {
      console.error('Unable to persist organization config', error);
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

  const isOwnerSession = currentOperatorId === 'owner';

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
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) throw new Error('Unable to determine active business for the transaction.');

      const response = await supabase.from('orders').insert({
        business_id: activeBusinessId,
        customer_name: recipientName,
        items: payload.items,
        total_amount: saleTotal,
        status: 'Completed',
        recorded_by: profile?.id ?? null,
        transaction_type: transactionDraft.transactionType,
        recipient_id: transactionDraft.recipientId && transactionDraft.recipientId !== 'walk-in' ? transactionDraft.recipientId : null,
        recipient_name: recipientName,
        category: transactionDraft.category || selectedInventoryItem?.category,
        inventory_id: transactionDraft.inventoryId || selectedInventoryItem?.id || null,
        inventory_name: selectedInventoryItem?.name || transactionDraft.inventoryName,
        inventory_photo: selectedInventoryItem?.image || '',
        sale_date: transactionDraft.soldDate || null,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        profit,
        balance_due: balanceDue,
        currency: transactionDraft.currency || businessCurrency || organizationSetup.currency || 'USD ($)',
        notes: transactionDraft.notes
      });

      if (response.error) {
        throw response.error;
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
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) {
        throw error;
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
    setProductImageBase64('');
    setShowAddProductModal(true);
  };

  const closeInventoryComposer = () => {
    setShowAddProductModal(false);
    setInventoryComposerStep('form');
    setProductImageBase64('');
  };

  const handleInventoryComposerSubmit = async (event?: React.FormEvent) => {
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
      image: productImageBase64 || ''
    };

    try {
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) {
        throw new Error('Unable to determine active business for inventory creation.');
      }

      const tagsArray = recordDraft.tags ? recordDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

      const { error } = await supabase.from('products').insert({
        business_id: activeBusinessId,
        created_by: profile?.id ?? null,
        name: recordName,
        sku: generatedRecordId,
        category: selectedCategory,
        status: recordDraft.status,
        note: recordDraft.note,
        details: detailsWithIds,
        attachments: recordDraft.attachments,
        image_url: productImageBase64 || '',
        branch: recordDraft.branch,
        department: recordDraft.department,
        tags: tagsArray,
        last_modified_by: getOperatorName(),
        owner: getOperatorName()
      });

      if (error) {
        throw error;
      }

      logAudit('Inventory', `Recorded ${recordName} under ${selectedCategory}.`);
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
      await loadAllData();
    } catch (err) {
      console.error(err);
      setTransactionNotice(err instanceof Error ? err.message : 'Unable to save the intake record.');
    }
  };

  // API Call: Edit product
  const handleExpenseDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerSession) {
      requestOwnerAccess('Only the primary owner can record operational costs.');
      return;
    }

    try {
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) {
        throw new Error('Unable to determine active business for expense record.');
      }

      const { error } = await supabase.from('expenses').insert({
        business_id: activeBusinessId,
        title: expenseDraft.title,
        category: expenseDraft.category,
        amount: Number(expenseDraft.amount || 0),
        date: expenseDraft.date,
        vendor: expenseDraft.vendor,
        product: expenseDraft.product,
        notes: expenseDraft.notes,
        receipt_url: expenseDraft.receipt,
        recorded_by: profile?.id ?? null
      });

      if (error) {
        throw error;
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
      const { error } = await supabase.from('products').update({
        name: editingProduct.name,
        sku: editingProduct.sku,
        category: editingProduct.category,
        stock: editingProduct.stock,
        min_stock: editingProduct.minStock,
        price: editingProduct.price,
        cost: editingProduct.cost,
        image_url: editingProduct.image,
        status: editingProduct.status,
        note: editingProduct.note,
        details: editingProduct.details,
        branch: editingProduct.branch,
        department: editingProduct.department,
        last_modified_by: getOperatorName(),
        owner: editingProduct.owner,
        updated_at: new Date().toISOString()
      }).eq('id', editingProduct.id);

      if (!error) {
        setEditingProduct(null);
        logAudit('Inventory', `Updated inventory item ${editingProduct.name}.`);
        await loadAllData();
      } else {
        throw error;
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
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        throw error;
      }
      logAudit('Inventory', `Deleted inventory item ${productId}.`);
      await loadAllData();
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
      const { error } = await supabase.from('products').update({ stock: updatedStock }).eq('id', productId);
      if (error) {
        throw error;
      }
      await loadAllData();
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
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) {
        throw new Error('Unable to determine active business for order creation.');
      }

      const { error } = await supabase.from('orders').insert({
        business_id: activeBusinessId,
        customer_name: newOrder.customerName,
        items: filteredItems,
        total_amount: filteredItems.reduce((sum, item) => {
          const product = products.find((product) => product.id === item.productId);
          return sum + Number(product?.price ?? 0) * item.quantity;
        }, 0),
        status: newOrder.status,
        recorded_by: profile?.id ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      setShowAddOrderModal(false);
      setNewOrder({
        customerName: '',
        items: [{ productId: '', productName: '', quantity: 1, price: 0 }],
        status: 'Pending'
      });

      logAudit('Sales', `Sale recorded by ${getOperatorName()} for customer ${newOrder.customerName}.`);

      await loadAllData();
    } catch (err) {
      console.error(err);
      setTransactionNotice(err instanceof Error ? err.message : 'Unable to create order.');
    }
  };

  // API Call: Update order status
  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) {
        throw error;
      }
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add new Staff member
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) {
        throw new Error('Unable to determine active business for staff creation.');
      }

      const staffData = {
        id: `staff-${Date.now()}`,
        name: newStaffMember.name,
        role: newStaffMember.role,
        online: newStaffMember.online,
        lastActive: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };

      const { error } = await supabase.from('profiles').insert({
        user_id: null,
        business_id: activeBusinessId,
        full_name: staffData.name,
        email: '',
        role: 'staff',
        online: staffData.online,
        last_active: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      setShowAddStaffModal(false);
      setNewStaffMember({ name: '', role: 'Sales Assistant', online: true });
      logAudit('Security', `Business owner registered new staff member: ${newStaffMember.name}.`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Toggle staff member online/offline status
  const handleToggleStaffOnline = async (staffId: string, currentOnline: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ online: !currentOnline, updated_at: new Date().toISOString() }).eq('id', staffId);
      if (error) {
        throw error;
      }
      const found = staff.find(s => s.id === staffId);
      logAudit('Security', `Staff member ${found ? found.name : 'Unknown'} set to ${!currentOnline ? 'Online' : 'Offline'}.`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Delete staff member
  const handleDeleteStaff = async (staffId: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', staffId);
      if (error) {
        throw error;
      }
      logAudit('Security', `Removed staff member ${staffId}.`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add new Customer to CRM
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) {
        throw new Error('Unable to determine active business for customer creation.');
      }

      const { error } = await supabase.from('customers').insert({
        business_id: activeBusinessId,
        name: newCustomerRecord.name,
        email: newCustomerRecord.email,
        phone: newCustomerRecord.phone,
        company: newCustomerRecord.company,
        status: newCustomerRecord.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

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
    if (!supplierDraft.name.trim() || !supplierDraft.contact.trim() || !supplierDraft.email.trim()) {
      return;
    }

    try {
      const activeBusinessId = getActiveBusinessId();
      if (!activeBusinessId) {
        throw new Error('Unable to determine active business for supplier creation.');
      }

      const { error } = await supabase.from('suppliers').insert({
        business_id: activeBusinessId,
        name: supplierDraft.name,
        specialty: supplierDraft.specialty,
        lead_time: supplierDraft.leadTime,
        contact: supplierDraft.contact,
        email: supplierDraft.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        throw error;
      }

      setSupplierDraft({ name: '', specialty: 'Smart Devices & Security', leadTime: 5, contact: '', email: '' });
      setShowAddSupplierModal(false);
      await loadAllData();
      logAudit('Procurement', `Registered supplier partner ${supplierDraft.name}.`);
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
    purchasePrice: product.cost,
    sellingPrice: product.price,
    image: product.image || '',
    stock: product.stock,
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
    Students: ['Student'],
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
    : inventoryType === 'Students'
      ? ['All', 'Active', 'Outstanding Fees', 'Needs Attention']
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
        { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
        { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
        { label: 'Stock', render: (record: any) => <span className="text-sm text-neutral-600">{record.stock ?? record.primaryMetric}</span> },
        { label: 'Unit Price', render: (record: any) => <span className="text-sm text-neutral-600">{record.unitPrice ? formatCurrency(record.unitPrice) : '—'}</span> },
        { label: 'Value', render: (record: any) => <span className="text-sm text-neutral-600">{record.value ? formatCurrency(record.value) : '—'}</span> },
        { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Healthy' || record.status === 'Active' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : record.status === 'Low Stock' || record.status === 'Needs Attention' || record.status === 'Follow-Up Required' || record.status === 'Out of Stock' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-neutral-200 bg-white text-neutral-600'}`}>{record.status}</span> },
        { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || record.assignedTo || '—'}</span> },
        { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
        { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
      ]
    : inventoryType === 'Students'
      ? [
          { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
          { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
          { label: 'Class', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Class || '—'}</span> },
          { label: 'Fee Status', render: (record: any) => <span className="text-sm text-neutral-600">{record.secondaryMetric}</span> },
          { label: 'Attendance', render: (record: any) => <span className="text-sm text-neutral-600">{record.primaryMetric}</span> },
          { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
          { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || 'Guardian'}</span> },
          { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
          { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
        ]
      : inventoryType === 'Members'
        ? [
            { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
            { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
            { label: 'Group', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Type || '—'}</span> },
            { label: 'Last Attendance', render: (record: any) => <span className="text-sm text-neutral-600">{record.timeline?.[1]?.detail || '—'}</span> },
            { label: 'Contributions', render: (record: any) => <span className="text-sm text-neutral-600">{record.secondaryMetric}</span> },
            { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
            { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
            { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
            { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
          ]
        : inventoryType === 'Patients'
          ? [
              { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
              { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
              { label: 'Last Visit', render: (record: any) => <span className="text-sm text-neutral-600">{record.primaryMetric}</span> },
              { label: 'Balance', render: (record: any) => <span className="text-sm text-neutral-600">{record.secondaryMetric}</span> },
              { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
              { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
              { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
              { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
            ]
          : inventoryType === 'Assets'
            ? [
                { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
                { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
                { label: 'Location', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Location || '—'}</span> },
                { label: 'Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                { label: 'Value', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Value || '—'}</span> },
                { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Healthy' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
                { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
                { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
              ]
            : inventoryType === 'Equipment'
              ? [
                  { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
                  { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
                  { label: 'Location', render: (record: any) => <span className="text-sm text-neutral-600">{record.details?.Location || '—'}</span> },
                  { label: 'Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                  { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Healthy' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
                  { label: 'Owner/Assigned To', render: (record: any) => <span className="text-sm text-neutral-600">{record.owner || '—'}</span> },
                  { label: 'Last Updated', render: (record: any) => <span className="text-sm text-neutral-600">{record.lastUpdated || record.updated || '—'}</span> },
                  { label: 'Actions', render: (record: any) => <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedInventoryRecord(record); }} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-black">View</button> }
                ]
              : [
                  { label: 'Name', render: (record: any) => <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F7FFF9] text-sm font-semibold text-black">{record.name.charAt(0)}</div><div><p className="font-semibold text-black">{record.name}</p><p className="text-xs text-neutral-500">{record.subtitle}</p></div></div> },
                  { label: 'Category', render: (record: any) => <span className="text-sm text-neutral-600">{record.category}</span> },
                  { label: 'Status', render: (record: any) => <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${record.status === 'Active' ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>{record.status}</span> },
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
    : inventoryType === 'Students'
      ? [
          { label: 'Total Students', value: `${inventoryRows.length}` },
          { label: 'New Admissions', value: '24' },
          { label: 'Outstanding Fees', value: '12' },
          { label: 'At-Risk Students', value: '3' }
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
                  { label: 'Custom Records', value: `${inventoryRows.length}` },
                  { label: 'Active', value: '1' },
                  { label: 'Needs Attention', value: '0' },
                  { label: 'Custom Fields', value: '4' }
                ];

  const aiInsightText = organizationType === 'school'
    ? inventoryType === 'Products'
      ? 'Supplies and inventory are tracked by categories and stock thresholds.'
      : inventoryType === 'Students'
        ? 'Student records show a handful of accounts with outstanding follow-up and fee action needed.'
        : inventoryType === 'Members'
          ? 'Member accounts are active. Track renewals and benefits for continuing engagement.'
          : inventoryType === 'Patients'
            ? 'Patient records are set up for follow-up and care coordination.'
            : 'Academic records are ready for review and can be extended with additional data.'
    : inventoryType === 'Products'
      ? 'Your product catalog is being tracked by categories and stock thresholds.'
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

  const primaryActionClasses = 'inline-flex items-center justify-center gap-2 rounded-[12px] border border-black bg-[#8EE5C2] px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7fe2bf] focus:outline-none focus:ring-2 focus:ring-[#bff7e4]';
  const secondaryActionClasses = 'inline-flex items-center justify-center gap-2 rounded-[12px] border border-black bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[#bff7e4]';

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

    const asDayCount = (date: Date) => normalizedOrders.filter((order) => {
      const d = order.dateObj;
      return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    }).length;

    const asWeekCount = (weekday: number) => normalizedOrders.filter((order) => {
      const d = order.dateObj;
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);
      const diff = Math.floor((d.getTime() - currentWeekStart.getTime()) / 86400000);
      return diff >= 0 && diff < 7 && d.getDay() === weekday;
    }).length;

    const asMonthWeekCount = (weekIndex: number) => normalizedOrders.filter((order) => {
      const d = order.dateObj;
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const weekStart = new Date(firstOfMonth);
      weekStart.setDate(firstOfMonth.getDate() + weekIndex * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return d >= weekStart && d < weekEnd && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const asQuarterMonthCount = (monthIndex: number) => normalizedOrders.filter((order) => {
      const d = order.dateObj;
      return d.getFullYear() === now.getFullYear() && d.getMonth() === monthIndex;
    }).length;

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

    if (deskRange === 'This Week') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((label, index) => ({ name: label, value: asWeekCount(index) }));
    }

    if (deskRange === 'This Month') {
      return [
        { name: 'W1', value: asMonthWeekCount(0) },
        { name: 'W2', value: asMonthWeekCount(1) },
        { name: 'W3', value: asMonthWeekCount(2) },
        { name: 'W4', value: asMonthWeekCount(3) }
      ];
    }

    if (deskRange === 'This Quarter') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return [
        { name: 'M1', value: asQuarterMonthCount(quarterStartMonth) },
        { name: 'M2', value: asQuarterMonthCount(quarterStartMonth + 1) },
        { name: 'M3', value: asQuarterMonthCount(quarterStartMonth + 2) }
      ];
    }

    const quarterly = [
      { name: 'Q1', value: asQuarterMonthCount(0) + asQuarterMonthCount(1) + asQuarterMonthCount(2) },
      { name: 'Q2', value: asQuarterMonthCount(3) + asQuarterMonthCount(4) + asQuarterMonthCount(5) },
      { name: 'Q3', value: asQuarterMonthCount(6) + asQuarterMonthCount(7) + asQuarterMonthCount(8) },
      { name: 'Q4', value: asQuarterMonthCount(9) + asQuarterMonthCount(10) + asQuarterMonthCount(11) }
    ];

    return quarterly;
  })();

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
      title: `${summary.lowStockCount} products may need replenishment`,
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
        isLoading={authLoading}
        authError={authError}
        passwordVisible={passwordVisible}
        setPasswordVisible={setPasswordVisible}
        forgotPasswordMode={forgotPasswordMode}
        setForgotPasswordMode={setForgotPasswordMode}
        resetPasswordMessage={resetPasswordMessage}
        resetPasswordError={resetPasswordError}
        resetPasswordLoading={resetPasswordLoading}
        resetPasswordCooldown={resetPasswordCooldown}
        onResetPassword={handleResetPassword}
      />
    );
  }

  return (
    <>
      <div className={`fixed inset-0 z-[120] flex min-h-screen flex-col overflow-hidden bg-white transition-opacity duration-300 ${splashActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="space-y-3">
              <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
              <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-[26px] border border-neutral-200 bg-white p-5">
                  <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-3 h-8 w-24 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-4 h-4 w-12 animate-pulse rounded bg-neutral-100" />
                </div>
              ))}
            </div>

            {/* Content skeleton */}
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
                <div className="space-y-4">
                  <div className="h-3 w-32 animate-pulse rounded bg-neutral-200" />
                  <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
                <div className="space-y-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                  <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={`min-h-screen bg-white text-sm font-normal text-black select-none transition-opacity duration-300 ${splashActive ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white lg:flex-row">
        {(menuOpen || isDesktop) && (
          <div className={`${isDesktop ? 'hidden w-72 flex-col border-r border-neutral-200 bg-white p-5 lg:flex' : 'absolute inset-0 z-50 flex bg-neutral-950/40 lg:hidden'}`}>
            <div className={`${isDesktop ? 'flex h-full w-full flex-col justify-between' : 'w-[280px] h-full flex flex-col border-r border-neutral-200 shadow-2xl p-5 justify-between bg-white animate-in slide-in-from-left duration-200'}`}>
              <div className="space-y-5">
                
                {/* Drawer Header */}
                <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                  <div className="flex items-center space-x-2">
                    <img src="https://i.ibb.co/1f3mhnj4/file-000000009c0871f4a926f8036d1d614e.png" alt="Logo" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-black uppercase tracking-wider">EENVOQ</span>
                      {isDesktop && <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500">for {businessName}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => setMenuOpen(false)}
                    className="text-neutral-400 hover:text-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Owner Profile Snippet */}
                <div className="flex items-center space-x-3 p-2 bg-neutral-50 rounded-lg">
                  <img 
                    src={profilePic} 
                    alt={ownerName} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#8EE5C2] shadow-mint-glow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-semibold text-black leading-tight">{ownerName}</p>
                    <p className="text-xs font-normal text-neutral-400 leading-tight">{ownerRole}</p>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-1 overflow-y-auto max-h-[480px] pr-1">
                  <p className="text-sm font-semibold text-neutral-400 px-2 uppercase tracking-widest pb-1">Quick Access</p>

                  <SidebarNavButton
                    label={activeOrganizationProfile.navigation[0]?.label || 'Desk (Dashboard)'}
                    icon={Activity}
                    active={activeTab === 'desk'}
                    onClick={() => { setActiveTab('desk'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label={activeOrganizationProfile.navigation.find((item) => item.tab === 'stock')?.label || 'Inventory & Assets'}
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
                    label="Tag"
                    icon={MessageSquare}
                    active={activeTab === 'tag'}
                    badge={tagThreads.length > 0 ? tagThreads.length : undefined}
                    onClick={() => { setActiveTab('tag'); setMenuOpen(false); }}
                  />

                  <p className="text-sm font-semibold text-neutral-400 px-2 uppercase tracking-widest pt-3 pb-1">Business Add-ons</p>

                  <SidebarNavButton
                    label="Smart Analytics"
                    icon={TrendingUp}
                    active={activeTab === 'analytics'}
                    onClick={() => { setActiveTab('analytics'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Suppliers List"
                    icon={Truck}
                    active={activeTab === 'procurement'}
                    onClick={() => { setActiveTab('procurement'); setMenuOpen(false); }}
                  />
                  <SidebarNavButton
                    label="Auditing Logs"
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
                    onClick={() => { setAppMode('onboarding'); setMenuOpen(false); }}
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

        <div className="flex min-h-screen flex-1 flex-col">
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
          />

        {/* Dynamic App Content Box */}
        <div className="flex-1 overflow-y-auto bg-white pb-20 lg:pb-0">
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
                <div className="space-y-4 p-3 sm:p-4 lg:p-5">
                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Tag workspace</p>
                        <h2 className="text-lg font-semibold text-black">Tag yourself and leave requests for your team</h2>
                        <p className="mt-1 text-sm text-neutral-600">Use tags for stock checks, sales follow-ups, and operating requests that need another teammate to act on.</p>
                      </div>
                      <button type="button" onClick={() => setShowTagComposer(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black bg-[#8EE5C2] px-3 py-2 text-sm font-semibold text-black">
                        <Plus className="h-4 w-4" />
                        New tag
                      </button>
                    </div>
                  </div>

                  {showTagComposer && (
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Quick tag</p>
                          <p className="mt-1 text-sm font-semibold text-black">Tag yourself and leave a request for another operator.</p>
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
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-black bg-[#8EE5C2] px-3 py-2 text-sm font-semibold text-black"
                          >
                            <Send className="h-4 w-4" />
                            Send tag
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Tagged requests</p>
                        </div>
                        <div className="rounded-full border border-[#8EE5C2] bg-[#F7FFF9] px-2.5 py-1 text-[11px] font-semibold text-black">{tagThreads.length} active</div>
                      </div>
                      <div className="mt-3 space-y-3">
                        {tagThreads.map((thread) => (
                          <div key={thread.id} className="rounded-[18px] border border-neutral-200 bg-[#F9FFFC] p-3">
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
                    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">How it works</p>
                      <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                        <li>• Tag yourself and mention a teammate for stock, sales, or operational follow-up.</li>
                        <li>• Leave a concrete request so the tagged person can act on the note right away.</li>
                        <li>• Keep comments visible in the shared workspace so the next action is obvious.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 1: DESK (DASHBOARD) */}
              {activeTab === 'desk' && (
                <div className="space-y-4 p-4 sm:p-5 lg:p-6">
                  <div className="relative rounded-[30px] border border-[#8EE5C2] bg-white/90 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-6 lg:p-8">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{dashboardHeroLabel}</p>
                          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-black sm:text-4xl">
                            {getGreeting()}, {userFirstName}.
                          </h2>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button type="button" onClick={() => { setActiveTab('orders'); setTransactionReviewMode('standard'); }} className={primaryActionClasses}>Record {transactionLabel}</button>
                          <button type="button" onClick={() => { setActiveTab('stock'); setInventoryType('Products'); setInventoryAlertFilter('Low'); setInventoryStatusFilter('All'); }} className={secondaryActionClasses}>Add {inventoryLabel}</button>
                        </div>
                      </div>
                    </div>

                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {[
                      { label: 'Revenue', value: `$${summary.revenue.toLocaleString()}`, trend: '+12.4%' },
                      organizationType === 'school'
                        ? { label: 'Fee Collection', value: '82%', trend: '+8.1%' }
                        : { label: 'Transactions', value: `${summary.pendingOrdersCount} logged`, trend: '+8.1%' },
                      organizationType === 'school'
                        ? { label: 'Outstanding Fees', value: '27 overdue', trend: '-3.2%' }
                        : { label: 'Inventory Health', value: `${summary.lowStockCount} alerts`, trend: '-3.2%' },
                      organizationType === 'school'
                        ? { label: 'Attendance Rate', value: '91%', trend: '+5.6%' }
                        : { label: 'Verified Sales', value: '92%', trend: '+5.6%' }
                    ].map((card) => (
                      <div key={card.label} className="group relative overflow-hidden rounded-[26px] border border-neutral-200 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
                        <p className="text-[11px] uppercase tracking-[0.27em] text-neutral-500">{card.label}</p>
                        <p className="mt-3 text-2xl font-semibold leading-tight text-black">{card.value}</p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-3 py-2 text-xs font-semibold text-black">
                          <TrendingUp className="h-4 w-4 text-[#2a8d5b]" />
                          <span>{card.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Organization health score</p>
                          <h3 className="mt-1 text-lg font-semibold text-black">Health Score</h3>
                        </div>
                        <div className="rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-3 py-1 text-sm font-medium text-black">Healthy</div>
                      </div>
                      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-4xl font-semibold tracking-[-0.03em] text-black">87 / 100</p>
                          <p className="mt-2 max-w-md text-sm leading-7 text-neutral-600">Fee recovery and engagement continue to improve while inventory risk remains tightly controlled.</p>
                        </div>
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-[#8EE5C2] bg-neutral-50 text-lg font-semibold text-black">87</div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button type="button" onClick={() => { setActiveTab('orders'); setTransactionReviewMode('standard'); }} className={primaryActionClasses}>Record {transactionLabel}</button>
                        <button type="button" onClick={() => { setActiveTab('stock'); setInventoryType('Products'); setInventoryAlertFilter('Low'); setInventoryStatusFilter('All'); }} className={secondaryActionClasses}>Add {inventoryLabel}</button>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">AI action center</p>
                      <div className="mt-3 space-y-2">
                        {briefingActions.map((action) => (
                          <button key={action.title} type="button" onClick={action.action} className="flex w-full items-center justify-between rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3 text-left transition hover:border-[#8EE5C2] hover:bg-[#F7FFF9]">
                            <div className="pr-3">
                              <p className="text-sm font-semibold text-black">{action.title}</p>
                              <p className="mt-1 text-sm text-neutral-600">{action.detail}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-black" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Performance overview</p>
                        <h3 className="mt-1 text-lg font-semibold text-black">A calm view of momentum</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'] as const).map((range) => (
                          <button key={range} type="button" onClick={() => setDeskRange(range)} className={`rounded-full border px-3 py-1.5 text-sm ${deskRange === range ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-neutral-200 bg-white text-neutral-600'}`}>
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={deskChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                          <defs>
                            <linearGradient id="deskGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8EE5C2" stopOpacity={0.32} />
                              <stop offset="100%" stopColor="#8EE5C2" stopOpacity={0.04} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#8EE5C2" strokeWidth={2.5} fill="url(#deskGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Watchlist</p>
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

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Recent activity</p>
                      <div className="mt-3 space-y-2">
                        {auditLogs.length > 0 ? auditLogs.slice(0, 4).map((log) => (
                          <div key={log.id} className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-black">{log.message}</p>
                              <span className="rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-2.5 py-1 text-xs font-semibold text-black">{log.category}</span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-600">{log.timestamp}</p>
                          </div>
                        )) : (
                          <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-6 text-sm text-neutral-500 text-center">No recent activity has been logged yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Team performance</p>
                      <div className="mt-3 space-y-3">
                        {[
                          { name: 'Staff online', role: `${staff.filter((member) => member.online).length} active`, metric: `${staff.length} total` },
                          { name: 'Role coverage', role: `${new Set(staff.map((member) => member.role)).size} roles`, metric: `${staff.length > 0 ? 'Configured' : 'None'}` },
                          { name: 'Order pipeline', role: `${orders.filter((order) => order.status !== 'Completed').length} pending`, metric: `${orders.length} total` }
                        ].map((person) => (
                          <div key={person.name} className="flex items-center justify-between rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3">
                            <div>
                              <p className="text-sm font-semibold text-black">{person.name}</p>
                              <p className="text-sm text-neutral-600">{person.role}</p>
                            </div>
                            <p className="text-sm font-semibold text-black">{person.metric}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Verified transactions</p>
                      <div className="mt-3 rounded-[22px] border border-[#8EE5C2]/20 bg-[#F7FFF9] p-4">
                        <p className="text-4xl font-semibold tracking-[-0.03em] text-black">{orders.length > 0 ? `${Math.round((orders.filter((order) => order.status === 'Completed').length / orders.length) * 100)}%` : '0%'}</p>
                        <p className="mt-2 text-sm text-neutral-600">Completed order ratio based on current transaction activity.</p>
                      </div>
                      <button type="button" className="mt-3 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Review current order status</button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Global AI ask bar</p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        placeholder="What should I focus on today?"
                        className="flex-1 rounded-[18px] border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-black outline-none focus:border-[#8EE5C2]"
                      />
                      <button type="button" onClick={() => { setActiveTab('ai'); handleSendPrompt('Summarize the most urgent priorities for my organization today.'); }} className="rounded-[18px] border border-black bg-[#8EE5C2] px-4 py-3 text-sm font-semibold text-black">Ask</button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: STOCK (INVENTORY) */}
              {activeTab === 'stock' && (
                <div className="p-3 sm:p-4 lg:p-5 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{inventoryLabel} intelligence center</p>
                      <h2 className="text-lg font-semibold text-black">{inventoryLabel} & Assets</h2>
                      <p className="mt-1 text-sm text-neutral-600">Monitor the health, status, growth, and risk of every managed record in one calm command center.</p>
                    </div>
                    <button
                      type="button"
                      onClick={openInventoryComposer}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black bg-[#8EE5C2] px-3 py-2 text-sm font-semibold text-black transition hover:bg-[#7EE7C1]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Record</span>
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
                            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${inventoryType === option.id ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'}`}
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

                  <div className="rounded-[24px] border border-[#8EE5C2]/25 bg-[#F7FFF9] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.025)]">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">AI intelligence</p>
                        <p className="mt-1 text-sm font-semibold text-black">{aiInsightText}</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-[#8EE5C2]/30 bg-white px-3 py-2 text-sm font-medium text-black">
                        <Sparkles className="h-4 w-4 text-[#8EE5C2]" />
                        <span>Always explain what needs attention and why</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          value={inventorySearch}
                          onChange={(event) => setInventorySearch(event.target.value)}
                          placeholder={`Search ${inventoryType.toLowerCase()} by name, id, SKU, tag, or custom field...`}
                          className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 pl-9 text-sm text-black outline-none focus:border-[#8EE5C2]"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setInventoryCategoryFilter(category)}
                            className={`rounded-full border px-3 py-1.5 text-sm ${inventoryCategoryFilter === category ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-neutral-200 bg-white text-neutral-600'}`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {statusOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setInventoryStatusFilter(option)}
                          className={`rounded-full border px-3 py-1.5 text-sm ${inventoryStatusFilter === option ? 'border-[#8EE5C2] bg-[#F7FFF9] text-black' : 'border-neutral-200 bg-white text-neutral-600'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 text-sm">
                          <thead className="bg-neutral-50">
                            <tr>
                              {inventoryTableColumns.map((column) => (
                                <th key={column.label} className="px-4 py-3 text-left font-semibold text-black">{column.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 bg-white">
                            {filteredInventory.length === 0 ? (
                              <tr>
                                <td colSpan={inventoryTableColumns.length} className="px-4 py-8 text-center text-sm text-neutral-500">No matching records found for this inventory view.</td>
                              </tr>
                            ) : (
                              filteredInventory.map((record) => (
                                <tr key={record.id} className="cursor-pointer transition hover:bg-neutral-50" onClick={() => setSelectedInventoryRecord(record)}>
                                  {inventoryTableColumns.map((column) => (
                                    <td key={`${record.id}-${column.label}`} className="px-4 py-3 align-middle">
                                      {column.render(record)}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <aside className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Detail drawer</p>
                          <h3 className="mt-1 text-base font-semibold text-black">{selectedInventoryRecord ? selectedInventoryRecord.name : 'Open a record for full context'}</h3>
                        </div>
                        <div className="rounded-full border border-[#8EE5C2]/30 bg-[#F7FFF9] px-3 py-1 text-xs font-medium text-black">Smart view</div>
                      </div>
                      {selectedInventoryRecord ? (
                        <div className="mt-4 space-y-3">
                          <div className="rounded-[18px] border border-neutral-200 bg-[#F9FFFC] p-3 text-sm text-neutral-700">
                            <p className="font-semibold text-black">{selectedInventoryRecord.aiInsight || 'AI insight ready.'}</p>
                          </div>
                          <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Overview</p>
                            <div className="mt-2 space-y-2">
                              {Object.entries(selectedInventoryRecord.details || {}).slice(0, 5).map(([label, value]) => (
                                <div key={label} className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2 last:border-b-0 last:pb-0">
                                  <span className="text-neutral-500">{label}</span>
                                  <span className="text-right font-medium text-black">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Timeline</p>
                            <div className="mt-2 space-y-2">
                              {(selectedInventoryRecord.timeline || []).map((item: any) => (
                                <div key={item.label} className="rounded-[12px] border border-neutral-200 bg-white p-2">
                                  <p className="text-sm font-semibold text-black">{item.label}</p>
                                  <p className="text-xs text-neutral-500">{item.detail}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                          Click any row to open a focused side view with history, notes, supplier context, timeline, AI insights, and audit-ready details without crowding the table.
                        </div>
                      )}
                    </aside>
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
                                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${record.status === 'Healthy' || record.status === 'Active' ? 'bg-[#F7FFF9] text-black border border-[#8EE5C2]' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
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
                <div className="p-3 sm:p-4 lg:p-5 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{transactionLabel} workspace</p>
                      <h2 className="text-lg font-semibold text-black">{transactionLabel}s</h2>
                      <p className="mt-1 text-sm text-neutral-600">Record a sale from the inventory catalog, review it carefully, and submit it once everything is verified.</p>
                    </div>
                    <button type="button" onClick={() => openTransactionComposer(null)} className={primaryActionClasses}>
                      <Plus className="h-4 w-4" />
                      Record Transaction
                    </button>
                  </div>

                  {transactionNotice && (
                    <div className="rounded-[16px] border border-[#8EE5C2]/30 bg-[#F7FFF9] px-4 py-3 text-sm text-neutral-700">
                      {transactionNotice}
                    </div>
                  )}

                  {!showTransactionComposer ? (
                    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="space-y-4">
                        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Guided flow</p>
                              <h3 className="mt-1 text-base font-semibold text-black">Create a transaction in minutes</h3>
                            </div>
                            <div className="rounded-full border border-[#8EE5C2]/30 bg-[#F7FFF9] px-3 py-1 text-xs font-medium text-black">
                              {canManageTransactions ? 'Owner / Manager' : 'Operator'}
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Step 1</p>
                              <p className="mt-2 text-sm font-semibold text-black">Pick a recipient</p>
                            </div>
                            <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Step 2</p>
                              <p className="mt-2 text-sm font-semibold text-black">Choose inventory</p>
                            </div>
                            <div className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Step 3</p>
                              <p className="mt-2 text-sm font-semibold text-black">Review and submit</p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Recent sales</p>
                              <h3 className="mt-1 text-base font-semibold text-black">Latest records</h3>
                            </div>
                            <button type="button" onClick={() => openTransactionComposer(null)} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-black">
                              Record Transaction
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
                              <h3 className="mt-1 text-base font-semibold text-black">What happens next</h3>
                            </div>
                          </div>
                          <div className="mt-4 space-y-3 rounded-[18px] border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                            <div>• Select a customer from CRM or choose walk-in.</div>
                            <div>• Pick an inventory category and the exact item from the matching catalog.</div>
                            <div>• Review profit, loss, and balance due before submitting.</div>
                            <div>• Only owner and manager roles can edit or delete completed sales.</div>
                          </div>
                          <div className="mt-4 rounded-[18px] border border-[#8EE5C2]/30 bg-[#F7FFF9] p-3 text-sm text-neutral-700">
                            Currency defaults to the value saved in settings: <span className="font-semibold text-black">{businessCurrency || organizationSetup.currency || 'NGN (₦)'}</span>
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
                              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Record transaction</p>
                              <h3 className="mt-1 text-base font-semibold text-black">{transactionComposerStep === 'form' ? 'Fill in the sale details' : 'Review and confirm'}</h3>
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
                                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Recipient</span>
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
                                      onClick={() => setTransactionDraft((prev) => ({ ...prev, inventoryId: item.id, inventoryName: item.name, purchasePrice: item.purchasePrice ?? 0, sellingPrice: item.sellingPrice ?? 0 }))}
                                      className={`rounded-[18px] border p-3 text-left ${transactionDraft.inventoryId === item.id ? 'border-[#8EE5C2] bg-[#F7FFF9]' : 'border-neutral-200 bg-white'}`}
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

                              <label className="space-y-2 text-sm text-black">
                                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Notes</span>
                                <textarea
                                  value={transactionDraft.notes}
                                  onChange={(event) => setTransactionDraft((prev) => ({ ...prev, notes: event.target.value }))}
                                  rows={3}
                                  placeholder="Add a quick note or internal reference"
                                  className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm text-black"
                                />
                              </label>

                              <div className="flex justify-end">
                                <button type="button" onClick={() => setTransactionComposerStep('preview')} className={primaryActionClasses}>
                                  Proceed to review
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-4">
                              <div className="rounded-[20px] border border-[#8EE5C2]/30 bg-[#F7FFF9] p-4 text-sm text-neutral-700">
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
                                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'Completed' ? 'bg-[#F7FFF9] text-black border border-[#8EE5C2]' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
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
                <div className="flex flex-col h-[520px] md:h-[580px]">
                  
                  {/* Quick Audit suggested capsules row */}
                  <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex overflow-x-auto gap-2 no-scrollbar flex-shrink-0">
                    <button
                      onClick={() => handleSendPrompt('Evaluate current supply chain risks, highlight low stock items, and generate recommended reorder limits.')}
                      className="bg-white hover:bg-neutral-100 text-black px-3 py-1.5 rounded-full border border-neutral-200 text-sm whitespace-nowrap font-normal"
                      disabled={aiGenerating}
                    >
                      Stock safety assessment
                    </button>
                    <button
                      onClick={() => handleSendPrompt('Provide a full financial health report including total revenues, operational cost of goods, net profits, and our most profitable categories.')}
                      className="bg-white hover:bg-neutral-100 text-black px-3 py-1.5 rounded-full border border-neutral-200 text-sm whitespace-nowrap font-normal"
                      disabled={aiGenerating}
                    >
                      Profit analysis
                    </button>
                  </div>

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
              )}

              {/* VIEW 5: ANALYTICS (PROJECTIONS & PERFORMANCE) */}
              {activeTab === 'analytics' && (
                <div className="p-4 sm:p-5 lg:p-6 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Finance workspace</p>
                      <h2 className="text-lg font-semibold text-black">Operations, cash flow, and profit health</h2>
                      <p className="mt-1 text-sm text-neutral-600">Review revenue, hidden operating costs, and the month-to-month trend in one place.</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('stock')} className={secondaryActionClasses}>Open cost intake</button>
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
                        <div className="rounded-full border border-[#8EE5C2]/30 bg-[#F7FFF9] px-3 py-1 text-xs font-medium text-black">Rolling 6 months</div>
                      </div>
                      <div className="mt-4 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={financeSummary.monthlyTrend.length > 0 ? financeSummary.monthlyTrend : [{ month: 'Jan', income: 0, expenses: 0 }] } margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <defs>
                              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8EE5C2" stopOpacity={0.28} />
                                <stop offset="100%" stopColor="#8EE5C2" stopOpacity={0.02} />
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
                          <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Expense mix</p>
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
                              <div className="h-2 rounded-full bg-[#8EE5C2]" style={{ width: `${Math.max(8, (item.value / Math.max(financeSummary.expensesTotal, 1)) * 100)}%` }} />
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
                <div className="p-5 space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Supply chain</p>
                      <h2 className="text-lg font-semibold text-black">Registered partners and replenishment actions</h2>
                      <p className="mt-1 text-sm text-neutral-600">Keep procurement, stock safety, and audit history connected from one place.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddSupplierModal(true)}
                      className="inline-flex items-center gap-2 rounded-[12px] border border-black bg-[#8EE5C2] px-3 py-2 text-sm font-semibold text-black transition-all hover:-translate-y-0.5"
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
                        <span className="rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-3 py-1 text-xs font-medium text-black">{summary.lowStockCount} flagged</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {products.filter(p => (p.stock ?? 0) <= (p.minStock ?? 0)).map(prod => (
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
                              <span className="rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-2.5 py-1 text-[11px] font-semibold text-black">{sup.leadTime} days</span>
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
                <div className="p-5 space-y-4">
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
                        className="rounded-[14px] border border-black bg-[#8EE5C2] px-3 py-2.5 text-sm font-semibold text-black"
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
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-black">Profile & Settings</h2>
                    <button type="button" onClick={handleLogout} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Log out</button>
                  </div>

                  {currentOperatorId === 'owner' && (
                    <div className="rounded-[16px] border border-[#8EE5C2]/25 bg-[#F7FFF9] p-3 text-sm text-neutral-700">
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
                <div className="p-5 space-y-4">
                  {/* Action row with marketing campaigns */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-semibold text-black">{customerLabel} CRM</h2>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setShowEmailBlastModal(true)}
                        className="bg-white hover:bg-neutral-50 text-black border border-neutral-300 px-2.5 py-1.5 rounded-md font-normal text-xs transition-colors inline-flex items-center space-x-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Outreach Blast</span>
                      </button>
                      <button 
                        onClick={() => setShowAddCustomerModal(true)}
                        className="bg-neutral-950 hover:bg-black text-white px-2.5 py-1.5 rounded-md font-normal text-xs transition-colors inline-flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add {customerLabel}</span>
                      </button>
                    </div>
                  </div>

                  {/* CRM Search and Status Filters */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                      <input 
                        type="text" 
                        placeholder="Search name, company or email..."
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none p-2.5 pl-9 rounded-md text-sm font-normal text-black"
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
                        <div key={c.id} className="bg-neutral-50 border border-neutral-200/50 rounded-lg p-3.5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-semibold text-black">{c.name}</h3>
                              <p className="text-xs font-normal text-neutral-400">{c.company} | {c.email}</p>
                              <p className="text-xs font-normal text-neutral-400">{c.phone}</p>
                            </div>
                            <span className="text-xs font-normal px-2 py-0.5 bg-white border border-neutral-200 rounded text-black">
                              {c.status}
                            </span>
                          </div>

                          {/* Purchase indicators */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200/50 text-xs text-black">
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
                            <p className="text-[11px] font-normal text-neutral-400">
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
                <div className="space-y-4 p-4 sm:p-5 lg:p-6">
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
                      className={`inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-sm font-semibold transition-all ${
                        currentOperatorId === 'owner'
                          ? 'border-black bg-[#8EE5C2] text-black hover:-translate-y-0.5 hover:bg-[#7fe2bf]'
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
                          <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Workforce overview</p>
                          <h3 className="mt-1 text-lg font-semibold text-black">Accountability at a glance</h3>
                        </div>
                        <div className="rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-3 py-1 text-sm font-medium text-black">
                          {staff.filter((member) => member.online).length + 1} active
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {[
                          { label: 'People under oversight', value: `${staff.length + 1}` },
                          { label: 'Verified roles', value: '3 core' },
                          { label: 'Open approvals', value: '2 pending' }
                        ].map((item) => (
                          <div key={item.label} className="rounded-[18px] border border-neutral-200 bg-neutral-50 p-3">
                            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{item.label}</p>
                            <p className="mt-2 text-lg font-semibold text-black">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-[0_16px_60px_rgba(0,0,0,0.03)]">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Security posture</p>
                      <div className="mt-4 rounded-[22px] border border-[#8EE5C2]/20 bg-[#F7FFF9] p-4">
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

                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
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
                            <span className="rounded-full border border-[#8EE5C2]/25 bg-[#F7FFF9] px-2.5 py-1 text-[11px] font-medium text-black">Full control</span>
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
                        className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-black bg-[#8EE5C2] px-4 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7fe2bf]"
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
        <nav className="sticky bottom-0 z-40 flex h-16 flex-shrink-0 items-center justify-around border-t border-neutral-100 bg-white px-2 lg:hidden">
          <button
            onClick={() => setActiveTab('desk')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'desk' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-black font-normal'
            }`}
          >
            <Activity className="w-4 h-4 mb-1" />
            <span className="text-sm">Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'stock' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-black font-normal'
            }`}
          >
            <Package className="w-4 h-4 mb-1" />
            <span className="text-sm">Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'orders' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-black font-normal'
            }`}
          >
            <ShoppingCart className="w-4 h-4 mb-1" />
            <span className="text-sm">Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'ai' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-black font-normal'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-1" />
            <span className="text-sm">Advisor</span>
          </button>

          <button
            onClick={() => setActiveTab('tag')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'tag' ? 'text-black font-semibold' : 'text-neutral-400 hover:text-black font-normal'
            }`}
          >
            <Send className="w-4 h-4 mb-1" />
            <span className="text-sm">Tag</span>
          </button>
        </nav>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DIALOG MODALS SECTION (STRICT MINIMAL STYLING) */}
      {/* ---------------------------------------------------- */}

      {/* MODAL 1: ADD PRODUCT */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-neutral-900/45 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_24px_90px_rgba(0,0,0,0.16)]">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7FFF9] text-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-black">{confirmAction.title}</h3>
                <p className="text-sm text-neutral-600">{confirmAction.description}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmAction(null)} className="rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-black">Cancel</button>
              <button type="button" onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="rounded-full border border-black bg-[#8EE5C2] px-3 py-2 text-sm font-semibold text-black">Continue</button>
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
            
            <form onSubmit={handleInventoryComposerSubmit} className="space-y-3 p-3 sm:space-y-4 sm:p-5">
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
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-xs">Record title</span>
                      <input value={recordDraft.recordName} onChange={(event) => setRecordDraft((prev) => ({ ...prev, recordName: event.target.value }))} placeholder="Enter a record title" className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-xs text-black sm:px-3 sm:py-2.5 sm:text-sm" required />
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
                      {(generalCategoryFields[recordDraft.category] || []).map((field) => (
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
                      ))}
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
                  <div className="rounded-[16px] border border-[#8EE5C2]/30 bg-[#F7FFF9] p-4 text-sm text-neutral-700">
                    Please review everything before saving. You can return to edit the details if needed.
                  </div>
                  <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Category</span>
                      <span className="font-semibold text-black">{recordDraft.category || 'Other'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Record title</span>
                      <span className="font-semibold text-black">{recordDraft.recordName || 'Untitled record'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Status</span>
                      <span className="font-semibold text-black">{recordDraft.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-neutral-500">Notes</span>
                      <span className="font-semibold text-black">{recordDraft.note || 'No notes added'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3 sm:pt-4">
                <button type="button" onClick={inventoryComposerStep === 'form' ? closeInventoryComposer : () => setInventoryComposerStep('form')} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-xs font-normal text-black transition-colors hover:bg-neutral-50 sm:px-4 sm:py-2 sm:text-sm">
                  {inventoryComposerStep === 'form' ? 'Cancel' : 'Edit'}
                </button>
                <button type="submit" className="rounded-md bg-neutral-950 px-3 py-2 text-xs font-normal text-white transition-colors hover:bg-black sm:px-4 sm:py-2 sm:text-sm">
                  {inventoryComposerStep === 'form' ? 'Review' : 'Save intake'}
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
                      items: [...prev.items, { productId: '', productName: '', quantity: 1, price: 0 }]
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
                          const selectedProduct = products.find((p) => p.id === e.target.value);
                          const updatedItems = [...newOrder.items];
                          updatedItems[index] = {
                            ...updatedItems[index],
                            productId: e.target.value,
                            productName: selectedProduct?.name || '',
                            price: selectedProduct?.price ?? 0
                          };
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
              <h3 className="font-semibold text-sm text-black">Register Supplier Partner</h3>
              <button 
                onClick={() => setShowAddSupplierModal(false)}
                className="text-neutral-400 hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSupplier} className="p-5 space-y-4">
              
              <div className="space-y-1">
                <label className="font-semibold text-black block">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Optima Sensors"
                  required
                  value={supplierDraft.name}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-black block">Specialty Category</label>
                  <select
                    value={supplierDraft.specialty}
                    onChange={(e) => setSupplierDraft(prev => ({ ...prev, specialty: e.target.value }))}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  >
                    <option value="Smart Devices & Security">Smart Devices</option>
                    <option value="Sensors & Electronics">Sensors</option>
                    <option value="Networking & Cables">Networking</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-black block">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={supplierDraft.leadTime}
                    onChange={(e) => setSupplierDraft(prev => ({ ...prev, leadTime: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Contact Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 555-0199"
                  required
                  value={supplierDraft.contact}
                  onChange={(e) => setSupplierDraft(prev => ({ ...prev, contact: e.target.value }))}
                  className="w-full bg-neutral-50 border border-neutral-200 focus:border-black focus:outline-none px-3 py-2 rounded-md text-sm font-normal text-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-black block">Email Address</label>
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
                  Save Partner
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
