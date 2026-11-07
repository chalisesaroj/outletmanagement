import {
  Product,
  ProductCategory,
  ProductBrand,
  ProductUnit,
  ProductSerial,
  Customer,
  Supplier,
  Sale,
  Purchase,
  StockMovement,
  CashAccount,
  Expense,
  Warranty,
  ServiceRequest,
  StoreSettings,
  UserProfile
} from '@/types';

export const INITIAL_SETTINGS: StoreSettings = {
  id: '00000000-0000-0000-0000-000000000001',
  store_name: 'Himalayan Smart Appliances & Electronics Hub',
  store_phone: '+977-1-4228900 / 9851000000',
  store_email: 'sales@himalayanappliances.com.np',
  store_address: 'Maha Boudha, New Road, Kathmandu 44600, Nepal',
  pan_vat_number: '301294856',
  default_vat_percent: 13.0,
  currency_code: 'NPR',
  currency_symbol: 'रू',
  invoice_header_note: 'Authorized Multi-Brand Retailer & Service Partner',
  invoice_footer_note: 'Goods once sold are covered under authorized manufacturer warranty. Thank you for shopping with us!',
  enable_serial_tracking: true,
  default_print_format: 'a4',
};

export const INITIAL_CATEGORIES: ProductCategory[] = [
  { id: 'cat-1', name: 'Smart Televisions', code: 'CAT-TV', description: '4K Ultra HD, OLED, QLED & Smart TVs', is_active: true },
  { id: 'cat-2', name: 'Refrigerators & Freezers', code: 'CAT-REF', description: 'Double Door, Inverter & Deep Freezers', is_active: true },
  { id: 'cat-3', name: 'Washing Machines', code: 'CAT-WASH', description: 'Front Load, Top Load & AI Washers', is_active: true },
  { id: 'cat-4', name: 'Inverter Air Conditioners', code: 'CAT-AC', description: 'Split Inverter Hot & Cold ACs', is_active: true },
  { id: 'cat-5', name: 'Kitchen Appliances', code: 'CAT-KTCH', description: 'Microwave Ovens, Inductions, Chimneys', is_active: true },
  { id: 'cat-6', name: 'Small Home Appliances', code: 'CAT-SMAL', description: 'Steam Irons, Vacuum Cleaners, Geysers', is_active: true }
];

export const INITIAL_BRANDS: ProductBrand[] = [
  { id: 'br-1', name: 'Samsung', origin_country: 'South Korea', is_active: true },
  { id: 'br-2', name: 'LG Electronics', origin_country: 'South Korea', is_active: true },
  { id: 'br-3', name: 'Sony Bravia', origin_country: 'Japan', is_active: true },
  { id: 'br-4', name: 'Whirlpool', origin_country: 'USA', is_active: true },
  { id: 'br-5', name: 'Bosch', origin_country: 'Germany', is_active: true },
  { id: 'br-6', name: 'Philips', origin_country: 'Netherlands', is_active: true },
  { id: 'br-7', name: 'Midea', origin_country: 'China', is_active: true }
];

export const INITIAL_UNITS: ProductUnit[] = [
  { id: 'un-1', name: 'Piece', code: 'pcs' },
  { id: 'un-2', name: 'Set', code: 'set' },
  { id: 'un-3', name: 'Box', code: 'box' }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Samsung 55" Crystal 4K UHD Smart TV',
    sku: 'SAM-TV-55CU7700',
    barcode: '8806091827361',
    category_id: 'cat-1',
    brand_id: 'br-1',
    unit_id: 'un-1',
    model_number: 'UA55CU7700RXZN',
    specifications: {
      'Screen Size': '55 Inch',
      'Resolution': '3840 x 2160 (4K)',
      'Operating System': 'Tizen OS',
      'Audio': '20W Dolby Digital Plus',
      'Ports': '3 HDMI, 1 USB, Optical'
    },
    is_serialized: true,
    purchase_price: 68000,
    selling_price: 82500,
    mrp: 94990,
    vat_percent: 13,
    min_stock_level: 2,
    current_stock: 5,
    warranty_months: 24,
    is_active: true,
  },
  {
    id: 'prod-2',
    name: 'LG 8.0 Kg Front Load AI DD Washing Machine',
    sku: 'LG-WM-FHP1408',
    barcode: '8801048291024',
    category_id: 'cat-3',
    brand_id: 'br-2',
    unit_id: 'un-1',
    model_number: 'FHP1408Z9B',
    specifications: {
      'Capacity': '8.0 Kg',
      'Motor': 'AI Direct Drive Inverter',
      'Max Spin': '1400 RPM',
      'Features': 'SteamWash 99.9% Allergy Care, TurboWash'
    },
    is_serialized: true,
    purchase_price: 62000,
    selling_price: 74900,
    mrp: 86990,
    vat_percent: 13,
    min_stock_level: 2,
    current_stock: 4,
    warranty_months: 24,
    is_active: true,
  },
  {
    id: 'prod-3',
    name: 'Samsung 253L Digital Inverter Double Door Refrigerator',
    sku: 'SAM-REF-RT28K',
    barcode: '8806094918274',
    category_id: 'cat-2',
    brand_id: 'br-1',
    unit_id: 'un-1',
    model_number: 'RT28K3032GS',
    specifications: {
      'Capacity': '253 Liters',
      'Compressor': 'Digital Inverter (10 Year Warranty)',
      'Cooling': 'All-Around Cooling + MoistFresh Zone',
      'Energy Rating': '3 Star'
    },
    is_serialized: true,
    purchase_price: 44000,
    selling_price: 52900,
    mrp: 59990,
    vat_percent: 13,
    min_stock_level: 3,
    current_stock: 4,
    warranty_months: 24,
    is_active: true,
  },
  {
    id: 'prod-4',
    name: 'LG Dual Inverter 1.5 Ton Hot & Cold Split AC',
    sku: 'LG-AC-18T-HC',
    barcode: '8801039485721',
    category_id: 'cat-4',
    brand_id: 'br-2',
    unit_id: 'un-2',
    model_number: 'LS-Q18PWXA',
    specifications: {
      'Capacity': '1.5 Ton (18,000 BTU)',
      'Type': 'Dual Inverter Hot & Cold (All Seasons)',
      'Copper': '100% Ocean Black Fin Anti-corrosion',
      'Refrigerant': 'R32 Eco'
    },
    is_serialized: true,
    purchase_price: 84000,
    selling_price: 99500,
    mrp: 114990,
    vat_percent: 13,
    min_stock_level: 2,
    current_stock: 3,
    warranty_months: 36,
    is_active: true,
  },
  {
    id: 'prod-5',
    name: 'Philips Viva Collection 2100W Induction Cooktop',
    sku: 'PHI-IND-HD4928',
    barcode: '8710103628192',
    category_id: 'cat-5',
    brand_id: 'br-6',
    unit_id: 'un-1',
    model_number: 'HD4928/01',
    specifications: {
      'Power': '2100 Watts',
      'Timer': '0 to 3 Hours',
      'Cook Menus': 'Roti/Dosa, Curry, Gravy, Milk Boiling',
      'Plate': 'Full Crystal Glass Top'
    },
    is_serialized: false,
    purchase_price: 4200,
    selling_price: 5490,
    mrp: 6290,
    vat_percent: 13,
    min_stock_level: 5,
    current_stock: 16,
    warranty_months: 12,
    is_active: true,
  },
  {
    id: 'prod-6',
    name: 'Bosch 28L Convection Microwave Oven',
    sku: 'BOS-MW-HMB28',
    barcode: '4242005281920',
    category_id: 'cat-5',
    brand_id: 'br-5',
    unit_id: 'un-1',
    model_number: 'HMB28C50IN',
    specifications: {
      'Capacity': '28 Liters',
      'Functions': 'Baking, Grilling, Reheating, Defrosting',
      'Cavity': 'Stainless Steel Anti-bacterial',
      'Auto Cook': '120 Auto Menus'
    },
    is_serialized: true,
    purchase_price: 21000,
    selling_price: 26900,
    mrp: 31990,
    vat_percent: 13,
    min_stock_level: 2,
    current_stock: 4,
    warranty_months: 12,
    is_active: true,
  },
  {
    id: 'prod-7',
    name: 'Sony Bravia 65" 4K Google TV X75L',
    sku: 'SNY-TV-65X75L',
    barcode: '4548736142981',
    category_id: 'cat-1',
    brand_id: 'br-3',
    unit_id: 'un-1',
    model_number: 'KD-65X75L',
    specifications: {
      'Screen': '65 Inch 4K HDR Direct LED',
      'Processor': 'X1 4K Processor',
      'Sound': '20W Open Baffle with Dolby Audio',
      'OS': 'Google TV with Voice Search'
    },
    is_serialized: true,
    purchase_price: 124000,
    selling_price: 148000,
    mrp: 169900,
    vat_percent: 13,
    min_stock_level: 2,
    current_stock: 3,
    warranty_months: 24,
    is_active: true,
  }
];

export const INITIAL_SERIALS: ProductSerial[] = [
  { id: 'ser-1', product_id: 'prod-1', serial_number: 'SAMTV55-CU7700-001', status: 'in_stock' },
  { id: 'ser-2', product_id: 'prod-1', serial_number: 'SAMTV55-CU7700-002', status: 'in_stock' },
  { id: 'ser-3', product_id: 'prod-1', serial_number: 'SAMTV55-CU7700-003', status: 'in_stock' },
  { id: 'ser-4', product_id: 'prod-1', serial_number: 'SAMTV55-CU7700-004', status: 'in_stock' },
  { id: 'ser-5', product_id: 'prod-1', serial_number: 'SAMTV55-CU7700-005', status: 'in_stock' },
  { id: 'ser-6', product_id: 'prod-2', serial_number: 'LGWM80-FHP140-001', status: 'in_stock' },
  { id: 'ser-7', product_id: 'prod-2', serial_number: 'LGWM80-FHP140-002', status: 'in_stock' },
  { id: 'ser-8', product_id: 'prod-2', serial_number: 'LGWM80-FHP140-003', status: 'in_stock' },
  { id: 'ser-9', product_id: 'prod-2', serial_number: 'LGWM80-FHP140-004', status: 'in_stock' },
  { id: 'ser-10', product_id: 'prod-3', serial_number: 'SAMREF253-RT28-001', status: 'in_stock' },
  { id: 'ser-11', product_id: 'prod-3', serial_number: 'SAMREF253-RT28-002', status: 'in_stock' },
  { id: 'ser-12', product_id: 'prod-3', serial_number: 'SAMREF253-RT28-003', status: 'in_stock' },
  { id: 'ser-13', product_id: 'prod-3', serial_number: 'SAMREF253-RT28-004', status: 'in_stock' },
  { id: 'ser-14', product_id: 'prod-4', serial_number: 'LGAC15-LSQ18-001', status: 'in_stock' },
  { id: 'ser-15', product_id: 'prod-4', serial_number: 'LGAC15-LSQ18-002', status: 'in_stock' },
  { id: 'ser-16', product_id: 'prod-4', serial_number: 'LGAC15-LSQ18-003', status: 'in_stock' },
  { id: 'ser-17', product_id: 'prod-6', serial_number: 'BOSMW28-HMB-001', status: 'in_stock' },
  { id: 'ser-18', product_id: 'prod-6', serial_number: 'BOSMW28-HMB-002', status: 'in_stock' },
  { id: 'ser-19', product_id: 'prod-6', serial_number: 'BOSMW28-HMB-003', status: 'in_stock' },
  { id: 'ser-20', product_id: 'prod-6', serial_number: 'BOSMW28-HMB-004', status: 'in_stock' },
  { id: 'ser-21', product_id: 'prod-7', serial_number: 'SNYTV65-KD75-001', status: 'in_stock' },
  { id: 'ser-22', product_id: 'prod-7', serial_number: 'SNYTV65-KD75-002', status: 'in_stock' },
  { id: 'ser-23', product_id: 'prod-7', serial_number: 'SNYTV65-KD75-003', status: 'in_stock' },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Rajesh Shrestha',
    phone: '9851023456',
    email: 'rajesh.shrestha@gmail.com',
    pan_number: '601928374',
    address: 'Jhamsikhel, Lalitpur',
    opening_balance: 0,
    current_balance: 45000,
    credit_limit: 150000,
    is_active: true
  },
  {
    id: 'cust-2',
    name: 'Bikash Adhikari',
    phone: '9841892746',
    email: 'bikash.adh@yahoo.com',
    address: 'Baneshwor, Kathmandu',
    opening_balance: 0,
    current_balance: 0,
    credit_limit: 100000,
    is_active: true
  },
  {
    id: 'cust-3',
    name: 'Himalayan Boutique Hotel',
    phone: '01-4701234',
    email: 'procure@himalayanboutique.np',
    pan_number: '302918475',
    address: 'Thamel, Kathmandu',
    opening_balance: 0,
    current_balance: 128000,
    credit_limit: 500000,
    is_active: true
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Him Electronics Pvt. Ltd.',
    company_name: 'Him Electronics (Samsung Nepal Authorized)',
    pan_number: '300182749',
    email: 'info@himelectronics.com',
    phone: '01-4261820',
    address: 'Tinkune, Kathmandu',
    opening_balance: 0,
    current_balance: 185000,
    is_active: true
  },
  {
    id: 'sup-2',
    name: 'CG Electronics Nepal',
    company_name: 'Chaudhary Group Appliances (LG/TCL/Midea)',
    pan_number: '300293847',
    email: 'trade@cgelectronics.com.np',
    phone: '01-5542100',
    address: 'Sanepa, Lalitpur',
    opening_balance: 0,
    current_balance: 320000,
    is_active: true
  },
  {
    id: 'sup-3',
    name: 'Nepa Hima Technologies',
    company_name: 'Nepa Hima (Sony Nepal Authorized)',
    pan_number: '300481927',
    email: 'sales@nepahima.com',
    phone: '01-4433100',
    address: 'Bhatbhateni, Kathmandu',
    opening_balance: 0,
    current_balance: 95000,
    is_active: true
  }
];

export const INITIAL_ACCOUNTS: CashAccount[] = [
  { id: 'acc-1', name: 'Cash in Counter Drawer', account_type: 'cash', account_number: 'CASH-MAIN-01', balance: 85000, is_active: true },
  { id: 'acc-2', name: 'Nabil Bank Current A/C', account_type: 'bank', account_number: '01900128472910', balance: 450000, is_active: true },
  { id: 'acc-3', name: 'Fonepay Merchant QR', account_type: 'digital_wallet', account_number: 'FONEPAY-9801234567', balance: 124500, is_active: true },
  { id: 'acc-4', name: 'Global IME POS Card A/C', account_type: 'bank', account_number: '1092837465019', balance: 310000, is_active: true }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1',
    invoice_number: 'INV-2081-00101',
    customer_id: 'cust-1',
    sale_date: new Date().toISOString().split('T')[0],
    subtotal: 82500,
    discount_amount: 2500,
    vat_amount: 10400,
    total_amount: 90400,
    paid_amount: 45400,
    payment_method: 'fonepay',
    payment_status: 'partial',
    is_returned: false,
    notes: 'Partial payment via Fonepay QR; balance due within 15 days',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'si-1',
        sale_id: 'sale-1',
        product_id: 'prod-1',
        quantity: 1,
        unit_price: 82500,
        purchase_cost: 68000,
        discount: 2500,
        total_price: 80000,
        serial_numbers: ['SAMTV55-CU7700-001'],
        warranty_expiry_date: '2028-11-07'
      }
    ]
  },
  {
    id: 'sale-2',
    invoice_number: 'INV-2081-00102',
    customer_id: 'cust-2',
    sale_date: new Date().toISOString().split('T')[0],
    subtotal: 5490,
    discount_amount: 290,
    vat_amount: 676,
    total_amount: 5876,
    paid_amount: 5876,
    payment_method: 'cash',
    payment_status: 'paid',
    is_returned: false,
    notes: 'Walk-in retail cash purchase',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'si-2',
        sale_id: 'sale-2',
        product_id: 'prod-5',
        quantity: 1,
        unit_price: 5490,
        purchase_cost: 4200,
        discount: 290,
        total_price: 5200,
        serial_numbers: [],
        warranty_expiry_date: '2027-11-07'
      }
    ]
  }
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'pur-1',
    invoice_number: 'BILL-HIM-2081-492',
    supplier_id: 'sup-1',
    purchase_date: new Date().toISOString().split('T')[0],
    subtotal: 340000,
    discount: 5000,
    vat_amount: 43550,
    total_amount: 378550,
    paid_amount: 193550,
    payment_status: 'partial',
    notes: 'Consignment of Samsung 55" TVs & Refrigerators',
    created_at: new Date().toISOString(),
    items: [
      {
        id: 'pi-1',
        purchase_id: 'pur-1',
        product_id: 'prod-1',
        quantity: 5,
        unit_cost: 68000,
        total_cost: 340000,
        serial_numbers: ['SAMTV55-CU7700-001', 'SAMTV55-CU7700-002', 'SAMTV55-CU7700-003', 'SAMTV55-CU7700-004', 'SAMTV55-CU7700-005']
      }
    ]
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'rent',
    account_id: 'acc-2',
    amount: 65000,
    expense_date: new Date().toISOString().split('T')[0],
    payee: 'New Road Commercial Building Complex',
    description: 'Monthly showroom floor rental'
  },
  {
    id: 'exp-2',
    category: 'electricity',
    account_id: 'acc-3',
    amount: 14200,
    expense_date: new Date().toISOString().split('T')[0],
    payee: 'Nepal Electricity Authority (NEA)',
    description: 'Showroom lighting, display wall & AC electricity bill'
  }
];

export const INITIAL_SERVICE_REQUESTS: ServiceRequest[] = [
  {
    id: 'srv-1',
    ticket_number: 'SRV-2081-0089',
    customer_id: 'cust-1',
    product_id: 'prod-3',
    serial_number: 'SAMREF253-RT28-001',
    issue_description: 'Cooling not adequate in lower fresh food compartment',
    received_date: new Date().toISOString().split('T')[0],
    status: 'in_repair',
    repair_cost: 1200,
    customer_charge: 0,
    technician_notes: 'Defrost sensor checked; ordered replacement thermostat under warranty'
  }
];

export const DEFAULT_USER_PROFILES: UserProfile[] = [
  { id: 'usr-1', role: 'owner', full_name: 'Santosh Bajracharya', email: 'owner@electrostore.np', phone: '9851011111', is_active: true },
  { id: 'usr-2', role: 'manager', full_name: 'Anup Pokharel', email: 'manager@electrostore.np', phone: '9851022222', is_active: true },
  { id: 'usr-3', role: 'cashier', full_name: 'Sunita Maharjan', email: 'cashier@electrostore.np', phone: '9851033333', is_active: true },
  { id: 'usr-4', role: 'storekeeper', full_name: 'Dhiraj Thapa', email: 'store@electrostore.np', phone: '9851044444', is_active: true },
  { id: 'usr-5', role: 'accountant', full_name: 'Pradeep Sharma', email: 'accounts@electrostore.np', phone: '9851055555', is_active: true },
];
