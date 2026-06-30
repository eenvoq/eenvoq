import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);

// Data persistence file
const DATA_FILE = path.join(process.cwd(), 'data.json');

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
  note?: string;
  tags?: string | string[];
  branch?: string;
  department?: string;
  details?: Record<string, any>;
  attachments?: string[];
  createdBy?: string;
  lastModifiedBy?: string;
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

interface OrganizationConfig {
  profileType: string;
  name: string;
  industry: string;
  location: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  staffCount: number;
  modules: string[];
  logoUrl: string;
}

interface Supplier {
  id: string;
  name: string;
  specialty: string;
  leadTime: number;
  contact: string;
  email: string;
}

interface Expense {
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

const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_ORDERS: Order[] = [];

const DEFAULT_STAFF: Staff[] = [];

const DEFAULT_CUSTOMERS: Customer[] = [];

let products: Product[] = [...DEFAULT_PRODUCTS];
let orders: Order[] = [...DEFAULT_ORDERS];
let staff: Staff[] = [...DEFAULT_STAFF];
let customers: Customer[] = [...DEFAULT_CUSTOMERS];
let suppliers: Supplier[] = [];
let expenses: Expense[] = [];
let organizationConfig: OrganizationConfig = {
  profileType: 'business',
  name: 'Your Business',
  industry: '',
  location: '',
  currency: 'USD ($)',
  contactEmail: '',
  contactPhone: '',
  staffCount: 0,
  modules: ['transactions', 'inventory', 'customers', 'staff', 'reports', 'ai'],
  logoUrl: ''
};

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.products)) products = data.products;
      if (Array.isArray(data.orders)) orders = data.orders;
      if (Array.isArray(data.staff)) staff = data.staff;
      if (Array.isArray(data.customers)) customers = data.customers;
      if (Array.isArray(data.suppliers)) suppliers = data.suppliers;
      if (Array.isArray(data.expenses)) expenses = data.expenses;
      if (data.organizationConfig) organizationConfig = data.organizationConfig;
      console.log('Database loaded successfully from data.json');
    } catch (e) {
      console.error('Error parsing data.json, starting with default seed data', e);
    }
  } else {
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ products, orders, staff, customers, suppliers, expenses, organizationConfig }, null, 2));
  } catch (e) {
    console.error('Error writing to data.json', e);
  }
}

loadData();

// Lazy initialize Gemini API client to prevent startup crash if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Go to Settings > Secrets to provide it.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/organization-config', (req, res) => {
  res.json(organizationConfig);
});

app.put('/api/organization-config', (req, res) => {
  organizationConfig = { ...organizationConfig, ...req.body };
  saveData();
  res.json(organizationConfig);
});

// Get complete inventory
app.get('/api/inventory', (req, res) => {
  res.json(products);
});

// Create product / generic inventory record
app.post('/api/inventory', (req, res) => {
  const { name, sku, category } = req.body;

  if (!name || !sku || !category) {
    return res.status(400).json({ error: 'Name, SKU, and Category are required.' });
  }

  const newProduct: Product = {
    id: Date.now().toString(),
    ...req.body
  } as Product;

  products.push(newProduct);
  saveData();
  res.status(201).json(newProduct);
});

// Update product
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, sku, category, stock, minStock, price, cost, image } = req.body;

  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  products[index] = {
    ...products[index],
    name: name ?? products[index].name,
    sku: sku ?? products[index].sku,
    category: category ?? products[index].category,
    stock: stock !== undefined ? Number(stock) : products[index].stock,
    minStock: minStock !== undefined ? Number(minStock) : products[index].minStock,
    price: price !== undefined ? Number(price) : products[index].price,
    cost: cost !== undefined ? Number(cost) : products[index].cost,
    image: image !== undefined ? image : products[index].image
  };

  saveData();
  res.json(products[index]);
});

// Delete product
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = products.length;
  products = products.filter(p => p.id !== id);
  
  if (products.length === initialLen) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  saveData();
  res.json({ success: true, message: 'Product deleted.' });
});

// Get orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// Create order & automatically deduct stock
app.post('/api/orders', (req, res) => {
  const {
    customerName,
    items,
    status,
    recordedBy,
    transactionType,
    recipientId,
    recipientName,
    category,
    inventoryId,
    inventoryName,
    inventoryPhoto,
    saleDate,
    purchasePrice,
    sellingPrice,
    profit,
    balanceDue,
    currency,
    notes,
    totalAmount: providedTotalAmount
  } = req.body;

  const normalizedItems = Array.isArray(items) ? items : [];
  const recipientDisplayName = recipientName || customerName || 'Walk-in customer';

  if (!recipientDisplayName || normalizedItems.length === 0) {
    return res.status(400).json({ error: 'Customer name and at least one item are required.' });
  }

  let totalAmount = Number(providedTotalAmount ?? 0);
  const processedItems: OrderItem[] = [];

  for (const item of normalizedItems) {
    const itemProductId = item.productId || item.inventoryId || item.id;
    const itemName = item.productName || item.inventoryName || item.name || 'Selected item';
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(item.price ?? item.sellingPrice ?? 0);
    const unitPurchasePrice = Number(item.purchasePrice ?? 0);

    const product = products.find(p => p.id === itemProductId);
    if (product) {
      product.stock = Math.max(0, product.stock - quantity);
    }

    const nextItem: OrderItem = {
      productId: itemProductId || `inventory-${Date.now()}`,
      productName: itemName,
      quantity,
      price: unitPrice,
      purchasePrice: unitPurchasePrice || undefined,
      transactionType: item.transactionType || transactionType,
      category: item.category || category,
      inventoryId: item.inventoryId || inventoryId || itemProductId,
      inventoryName: item.inventoryName || inventoryName || itemName,
      inventoryPhoto: item.inventoryPhoto || inventoryPhoto,
      saleDate: item.saleDate || saleDate,
      sellingPrice: Number(item.sellingPrice ?? unitPrice) || undefined,
      profit: Number(item.profit ?? (unitPrice * quantity - unitPurchasePrice * quantity)) || undefined,
      balanceDue: Number(item.balanceDue ?? unitPrice * quantity) || undefined,
      currency: item.currency || currency,
      notes: item.notes || notes
    };

    processedItems.push(nextItem);

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      totalAmount += unitPrice * quantity;
    }
  }

  const newOrder: Order = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    customerName: recipientDisplayName,
    items: processedItems,
    totalAmount: parseFloat((Number(totalAmount) || 0).toFixed(2)),
    date: new Date().toISOString(),
    status: status || 'Completed',
    recordedBy: recordedBy || 'System',
    transactionType,
    recipientId,
    recipientName: recipientDisplayName,
    category,
    inventoryId,
    inventoryName,
    inventoryPhoto,
    saleDate,
    purchasePrice: Number(purchasePrice ?? processedItems[0]?.purchasePrice ?? 0),
    sellingPrice: Number(sellingPrice ?? processedItems[0]?.sellingPrice ?? 0),
    profit: Number(profit ?? processedItems[0]?.profit ?? 0),
    balanceDue: Number(balanceDue ?? processedItems[0]?.balanceDue ?? totalAmount),
    currency,
    notes
  };

  orders.push(newOrder);

  // CRM Update logic
  try {
    const existingCust = customers.find(c => c.name.toLowerCase() === recipientDisplayName.toLowerCase() || c.company.toLowerCase() === recipientDisplayName.toLowerCase());
    if (existingCust) {
      existingCust.totalSpent = parseFloat((existingCust.totalSpent + newOrder.totalAmount).toFixed(2));
      existingCust.ordersCount += 1;
      existingCust.lastPurchaseDate = new Date().toISOString().slice(0, 10);
    } else {
      customers.push({
        id: `c-${Date.now()}`,
        name: recipientDisplayName,
        email: `${recipientDisplayName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: '+1 555-0100',
        company: recipientDisplayName,
        status: 'Active',
        totalSpent: parseFloat(newOrder.totalAmount.toFixed(2)),
        ordersCount: 1,
        lastPurchaseDate: new Date().toISOString().slice(0, 10)
      });
    }
  } catch (err) {
    console.error('CRM Autolink error:', err);
  }

  saveData();
  res.status(201).json(newOrder);
});

// Update order status or full record
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const {
    status,
    customerName,
    items,
    recordedBy,
    transactionType,
    recipientId,
    recipientName,
    category,
    inventoryId,
    inventoryName,
    inventoryPhoto,
    saleDate,
    purchasePrice,
    sellingPrice,
    profit,
    balanceDue,
    currency,
    notes,
    totalAmount: providedTotalAmount
  } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (status) {
    order.status = status;
  }
  if (customerName !== undefined) {
    order.customerName = customerName;
  }
  if (recordedBy !== undefined) {
    order.recordedBy = recordedBy;
  }
  if (Array.isArray(items)) {
    order.items = items.map((item: OrderItem) => ({ ...item }));
  }
  if (transactionType !== undefined) {
    order.transactionType = transactionType;
  }
  if (recipientId !== undefined) {
    order.recipientId = recipientId;
  }
  if (recipientName !== undefined) {
    order.recipientName = recipientName;
  }
  if (category !== undefined) {
    order.category = category;
  }
  if (inventoryId !== undefined) {
    order.inventoryId = inventoryId;
  }
  if (inventoryName !== undefined) {
    order.inventoryName = inventoryName;
  }
  if (inventoryPhoto !== undefined) {
    order.inventoryPhoto = inventoryPhoto;
  }
  if (saleDate !== undefined) {
    order.saleDate = saleDate;
  }
  if (providedTotalAmount !== undefined) {
    order.totalAmount = Number(providedTotalAmount);
  }
  if (purchasePrice !== undefined) {
    order.purchasePrice = Number(purchasePrice);
  }
  if (sellingPrice !== undefined) {
    order.sellingPrice = Number(sellingPrice);
  }
  if (profit !== undefined) {
    order.profit = Number(profit);
  }
  if (balanceDue !== undefined) {
    order.balanceDue = Number(balanceDue);
  }
  if (currency !== undefined) {
    order.currency = currency;
  }
  if (notes !== undefined) {
    order.notes = notes;
  }

  saveData();
  res.json(order);
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = orders.length;
  orders = orders.filter(o => o.id !== id);

  if (orders.length === initialLen) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  saveData();
  res.json({ success: true, message: 'Transaction deleted.' });
});

// ----------------------------------------------------
// STAFF ENDPOINTS
// ----------------------------------------------------
app.get('/api/staff', (req, res) => {
  res.json(staff);
});

app.post('/api/staff', (req, res) => {
  const { name, role, online } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required.' });
  }
  const newStaff: Staff = {
    id: `st-${Date.now()}`,
    name,
    role,
    online: online ?? false,
    lastActive: new Date().toISOString().slice(0, 16).replace('T', ' ')
  };
  staff.push(newStaff);
  saveData();
  res.status(201).json(newStaff);
});

app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, online } = req.body;
  const index = staff.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }
  staff[index] = {
    ...staff[index],
    name: name ?? staff[index].name,
    role: role ?? staff[index].role,
    online: online !== undefined ? online : staff[index].online,
    lastActive: new Date().toISOString().slice(0, 16).replace('T', ' ')
  };
  saveData();
  res.json(staff[index]);
});

app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = staff.length;
  staff = staff.filter(s => s.id !== id);
  if (staff.length === initialLen) {
    return res.status(404).json({ error: 'Staff member not found.' });
  }
  saveData();
  res.json({ success: true, message: 'Staff member deleted.' });
});

// ----------------------------------------------------
// CUSTOMER CRM ENDPOINTS
// ----------------------------------------------------
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, company, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Customer name is required.' });
  }
  const newCust: Customer = {
    id: `c-${Date.now()}`,
    name,
    email: email || '',
    phone: phone || '',
    company: company || '',
    status: status || 'Active',
    totalSpent: 0,
    ordersCount: 0,
    lastPurchaseDate: ''
  };
  customers.push(newCust);
  saveData();
  res.status(201).json(newCust);
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone, company, status, totalSpent, ordersCount, lastPurchaseDate } = req.body;
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  customers[index] = {
    ...customers[index],
    name: name ?? customers[index].name,
    email: email ?? customers[index].email,
    phone: phone ?? customers[index].phone,
    company: company ?? customers[index].company,
    status: status ?? customers[index].status,
    totalSpent: totalSpent !== undefined ? Number(totalSpent) : customers[index].totalSpent,
    ordersCount: ordersCount !== undefined ? Number(ordersCount) : customers[index].ordersCount,
    lastPurchaseDate: lastPurchaseDate ?? customers[index].lastPurchaseDate
  };
  saveData();
  res.json(customers[index]);
});

app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = customers.length;
  customers = customers.filter(c => c.id !== id);
  if (customers.length === initialLen) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  saveData();
  res.json({ success: true, message: 'Customer deleted.' });
});

// ----------------------------------------------------
// SUPPLIER ENDPOINTS
// ----------------------------------------------------
app.get('/api/suppliers', (req, res) => {
  res.json(suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const { name, specialty, leadTime, contact, email } = req.body;
  if (!name || !specialty || !contact || !email) {
    return res.status(400).json({ error: 'Supplier name, specialty, contact, and email are required.' });
  }

  const newSupplier: Supplier = {
    id: `sup-${Date.now().toString().slice(-4)}`,
    name,
    specialty,
    leadTime: Number(leadTime) || 3,
    contact,
    email
  };

  suppliers.push(newSupplier);
  saveData();
  res.status(201).json(newSupplier);
});

app.put('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const index = suppliers.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Supplier not found.' });
  }

  suppliers[index] = { ...suppliers[index], ...req.body, leadTime: Number(req.body.leadTime ?? suppliers[index].leadTime) };
  saveData();
  res.json(suppliers[index]);
});

app.delete('/api/suppliers/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = suppliers.length;
  suppliers = suppliers.filter(item => item.id !== id);
  if (suppliers.length === initialLen) {
    return res.status(404).json({ error: 'Supplier not found.' });
  }

  saveData();
  res.json({ success: true, message: 'Supplier removed.' });
});

// Compute financial & key performance indicator analytics
app.get('/api/sales-summary', (req, res) => {
  let totalRevenue = 0;
  let totalCost = 0;
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  const categorySalesMap: Record<string, number> = {};

  // Initialize analytics mapping
  products.forEach(p => {
    productSalesMap[p.id] = { name: p.name, quantity: 0, revenue: 0 };
  });

  orders.forEach(order => {
    // Only count processed/shipped/completed orders in revenue summaries
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      const costPerUnit = product ? product.cost : 0;
      const itemRevenue = item.price * item.quantity;
      const itemCost = costPerUnit * item.quantity;

      totalRevenue += itemRevenue;
      totalCost += itemCost;

      // Product sales stats
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += itemRevenue;
      }

      // Category breakdown
      const category = product ? product.category : 'Unknown';
      categorySalesMap[category] = (categorySalesMap[category] || 0) + itemRevenue;
    });
  });

  const totalProfit = totalRevenue - totalCost;
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Format chart data arrays
  const topSelling = Object.entries(productSalesMap)
    .map(([id, stats]) => ({ id, ...stats }))
    .filter(p => p.quantity > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const categoryBreakdown = Object.entries(categorySalesMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  res.json({
    revenue: parseFloat(totalRevenue.toFixed(2)),
    cost: parseFloat(totalCost.toFixed(2)),
    profit: parseFloat(totalProfit.toFixed(2)),
    totalProducts,
    lowStockCount,
    pendingOrdersCount: orders.filter(o => o.status === 'Pending').length,
    topSelling,
    categoryBreakdown
  });
});

app.get('/api/expenses', (req, res) => {
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  const { title, category, amount, date, vendor, product, notes, receipt, recordedBy } = req.body;

  if (!title || !category || amount === undefined) {
    return res.status(400).json({ error: 'Title, category, and amount are required.' });
  }

  const newExpense: Expense = {
    id: `EXP-${Date.now().toString().slice(-4)}`,
    title,
    category,
    amount: Number(amount),
    date: date || new Date().toISOString().slice(0, 10),
    vendor: vendor || 'Unspecified vendor',
    product,
    notes,
    receipt,
    recordedBy
  };

  expenses.push(newExpense);
  saveData();
  res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const expense = expenses.find(item => item.id === id);
  if (!expense) {
    return res.status(404).json({ error: 'Expense not found.' });
  }

  Object.assign(expense, req.body);
  saveData();
  res.json(expense);
});

app.delete('/api/expenses/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = expenses.length;
  expenses = expenses.filter(item => item.id !== id);
  if (expenses.length === initialLen) {
    return res.status(404).json({ error: 'Expense not found.' });
  }
  saveData();
  res.json({ success: true, message: 'Expense deleted.' });
});

app.get('/api/finance-summary', (req, res) => {
  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const costOfGoods = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + (Number(item.purchasePrice ?? 0) * Number(item.quantity ?? 1)), 0);
  }, 0);
  const expensesTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const grossProfit = revenue - costOfGoods;
  const netProfit = grossProfit - expensesTotal;
  const outstandingOrders = orders.filter((order) => order.status !== 'Completed' && Number(order.balanceDue ?? order.totalAmount) > 0);
  const accountsReceivable = outstandingOrders.reduce((sum, order) => sum + Number(order.balanceDue ?? order.totalAmount), 0);

  const expenseBreakdown = expenses.reduce<Record<string, number>>((map, expense) => {
    map[expense.category] = (map[expense.category] || 0) + Number(expense.amount || 0);
    return map;
  }, {});

  const monthlyTrend = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - (5 - index));
    const monthLabel = monthDate.toLocaleString('en-US', { month: 'short' });
    const monthIncome = orders.filter(order => new Date(order.date).getMonth() === monthDate.getMonth() && new Date(order.date).getFullYear() === monthDate.getFullYear()).reduce((sum, order) => sum + order.totalAmount, 0);
    const monthExpenses = expenses.filter(expense => new Date(expense.date).getMonth() === monthDate.getMonth() && new Date(expense.date).getFullYear() === monthDate.getFullYear()).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    return { month: monthLabel, income: parseFloat(monthIncome.toFixed(2)), expenses: parseFloat(monthExpenses.toFixed(2)) };
  });

  res.json({
    revenue: parseFloat(revenue.toFixed(2)),
    costOfGoods: parseFloat(costOfGoods.toFixed(2)),
    expensesTotal: parseFloat(expensesTotal.toFixed(2)),
    grossProfit: parseFloat(grossProfit.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    accountsReceivable: parseFloat(accountsReceivable.toFixed(2)),
    outstandingOrders: outstandingOrders.length,
    expenseBreakdown: Object.entries(expenseBreakdown).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })),
    monthlyTrend
  });
});

// Gemini AI Chatbot assistant with local context integration
app.post('/api/gemini/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages list is required.' });
  }

  try {
    const gemini = getGemini();

    // Construct system instructions with live db context
    const lowStockItems = products.filter(p => p.stock <= p.minStock);
    const systemInstruction = `
You are Eenvoq AI, an intelligent, enterprise-grade Sales, Inventory, and Stock Management Expert.
You are embedded inside the Eenvoq platform. You have real-time read access to the small business database:

=== LATEST REAL-TIME INVENTORY ===
${JSON.stringify(
  products.map(p => ({
    name: p.name,
    sku: p.sku,
    category: p.category,
    stock_remaining: p.stock,
    min_stock_alert_threshold: p.minStock,
    unit_price: p.price,
    unit_cost: p.cost,
    status: p.stock === 0 ? 'Out of Stock' : p.stock <= p.minStock ? 'Low Stock' : 'Optimal'
  })),
  null,
  2
)}

=== ACTIVE SALES ORDERS ===
${JSON.stringify(
  orders.map(o => ({
    order_id: o.id,
    customer: o.customerName,
    date: o.date,
    total_amount: o.totalAmount,
    status: o.status,
    items: o.items.map(it => `${it.productName} (x${it.quantity})`)
  })),
  null,
  2
)}

=== LOW STOCK WARNINGS ===
${
  lowStockItems.length > 0
    ? lowStockItems.map(p => `- WARNING: "${p.name}" is low or out of stock! Current stock: ${p.stock} (Threshold: ${p.minStock})`).join('\n')
    : 'None. All stock levels are currently optimal.'
}

Your capabilities & core responsibilities:
1. Provide extremely accurate stock analytics, draft restock orders, and explain sales performance directly from the data.
2. If products are in low stock status, proactively highlight them and generate restock instructions.
3. Help users draft purchase orders or invoices on-demand. Output them in structured, elegant markdown tables.
4. Keep answers readable, highly helpful, business-savvy, and conversational. Use bold and list bullets to make information scannable.
5. Do not hallucinate items that do not exist in the database. Rely strictly on the databases provided above.
6. Crucial instruction: Do NOT use any emojis, icons, or pictorial representations in your replies under any circumstances. Ensure every output is purely textual, highly professional, and sleek.
`;

    // Map conversation logs to standard Gemini SDK format
    // Filter to last 15 messages for safe token margins
    const chatContents = messages.slice(-15).map(msg => {
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });

    const response = await gemini.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: chatContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I'm having trouble analyzing the data right now. Please try again.";
    res.json({ reply });

  } catch (err: any) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ 
      error: 'AI assistant service failed.', 
      details: err.message || 'Unknown error' 
    });
  }
});

// ----------------------------------------------------
// STATIC ASSETS & VITE INTEGRATION
// ----------------------------------------------------

const isProd = process.env.NODE_ENV === 'production';

if (!isProd) {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });

  // Use vite dev server middlewares
  app.use(vite.middlewares);

  // Serve index.html dynamically with HMR transformations
  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    
    // Skip API routes so they fall through or return 404
    if (url.startsWith('/api/')) {
      return next();
    }

    try {
      let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Production static files
  app.use(express.static(path.resolve(process.cwd(), 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
  });
}

function startServer(port: number) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`EENVOQ Server running at http://0.0.0.0:${port} in ${isProd ? 'production' : 'development'} mode`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE' && port < 3100) {
      console.warn(`Port ${port} is busy, trying ${port + 1}`);
      server.close();
      startServer(port + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });
}

startServer(PORT);
