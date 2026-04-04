export type CategorySeed = {
  name: string;
  description: string;
  is_active?: boolean;
};

export type ProductSeed = {
  name: string;
  description: string;
  price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active?: boolean;
};

export type SeededUser = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'manager' | 'salesman';
  status: 'active' | 'inactive';
};

export const categorySeeds: CategorySeed[] = [
  { name: 'Electronics', description: 'Phones, laptops, accessories, and smart devices' },
  { name: 'Office Supplies', description: 'Everyday office essentials and stationery' },
  { name: 'Tools', description: 'Hand tools and power tools for repairs' },
  { name: 'Home & Garden', description: 'Home maintenance and garden items' },
  { name: 'Apparel', description: 'Clothing and wearable essentials' },
  { name: 'Groceries', description: 'Packaged food and pantry staples' },
  { name: 'Stationery', description: 'Writing, planning, and paper goods' },
  { name: 'Kitchenware', description: 'Cookware, utensils, and storage items' },
  { name: 'Sports', description: 'Fitness and sports accessories' },
  { name: 'Automotive', description: 'Car care and vehicle accessories' },
  { name: 'Furniture', description: 'Workstation and home furniture' },
  { name: 'Health & Beauty', description: 'Personal care and wellness products' },
  { name: 'Pet Supplies', description: 'Pet food, care, and grooming items' },
  { name: 'Toys', description: 'Play and learning products for kids' },
  { name: 'Books', description: 'Books, planners, and learning materials' },
];

export const productCatalog: Record<string, ProductSeed[]> = {
  Electronics: [
    { name: 'Laptop Pro 15"', description: 'High-performance laptop', price: 1299.99, current_stock: 12, min_stock_threshold: 5 },
    { name: 'Wireless Mouse', description: 'Ergonomic silent-click mouse', price: 29.99, current_stock: 3, min_stock_threshold: 15 },
    { name: 'USB-C Charger 65W', description: 'Fast charger for phones and laptops', price: 39.99, current_stock: 25, min_stock_threshold: 20 },
    { name: 'Smartwatch Active', description: 'Fitness smartwatch', price: 199.99, current_stock: 9, min_stock_threshold: 8 },
  ],
  'Office Supplies': [
    { name: 'A4 Copy Paper Ream', description: '500-sheet multipurpose paper', price: 5.99, current_stock: 55, min_stock_threshold: 20 },
    { name: 'Ballpoint Pen Pack', description: 'Pack of black and blue pens', price: 8.99, current_stock: 120, min_stock_threshold: 50 },
    { name: 'Desk Organizer Tray', description: 'Stackable desk tray', price: 14.99, current_stock: 18, min_stock_threshold: 10 },
    { name: 'Whiteboard Marker Set', description: 'Color markers for whiteboards', price: 12.49, current_stock: 9, min_stock_threshold: 15 },
  ],
  Tools: [
    { name: 'Cordless Drill 18V', description: 'Cordless drill with charger', price: 89.99, current_stock: 6, min_stock_threshold: 5 },
    { name: 'Screwdriver Set', description: 'Precision screwdriver set', price: 24.99, current_stock: 16, min_stock_threshold: 10 },
    { name: 'Measuring Tape 5m', description: 'Durable tape measure', price: 11.99, current_stock: 28, min_stock_threshold: 12 },
  ],
  'Home & Garden': [
    { name: 'LED Desk Lamp', description: 'Adjustable lamp', price: 34.99, current_stock: 4, min_stock_threshold: 8 },
    { name: 'Ceramic Plant Pot', description: 'Decorative pot', price: 19.99, current_stock: 7, min_stock_threshold: 5, is_active: false },
    { name: 'Garden Hose 20m', description: 'Flexible watering hose', price: 22.99, current_stock: 11, min_stock_threshold: 10 },
  ],
  Apparel: [
    { name: 'Polo Shirt Classic', description: 'Cotton polo shirt', price: 24.99, current_stock: 20, min_stock_threshold: 10 },
    { name: 'Denim Jeans Slim', description: 'Slim fit denim jeans', price: 39.99, current_stock: 15, min_stock_threshold: 8 },
    { name: 'Hoodie Zip Front', description: 'Warm zip-front hoodie', price: 49.99, current_stock: 7, min_stock_threshold: 6 },
    { name: 'Cotton Socks Pack', description: 'Multipack of socks', price: 9.99, current_stock: 40, min_stock_threshold: 20 },
  ],
  Groceries: [
    { name: 'Basmati Rice 5kg', description: 'Premium long-grain rice', price: 18.99, current_stock: 35, min_stock_threshold: 15 },
    { name: 'Olive Oil 1L', description: 'Cold-pressed olive oil', price: 14.99, current_stock: 14, min_stock_threshold: 10 },
    { name: 'Green Tea Box', description: 'Organic tea bags', price: 7.49, current_stock: 8, min_stock_threshold: 12 },
    { name: 'Sugar 2kg', description: 'Refined white sugar', price: 4.49, current_stock: 50, min_stock_threshold: 20 },
  ],
  Stationery: [
    { name: 'Notebook A5', description: 'Hardcover A5 notebook', price: 6.99, current_stock: 60, min_stock_threshold: 25 },
    { name: 'Sticky Notes Pack', description: 'Color sticky notes', price: 4.99, current_stock: 22, min_stock_threshold: 15 },
    { name: 'Gel Pen Refill', description: 'Refill pack for gel pens', price: 3.49, current_stock: 18, min_stock_threshold: 10 },
  ],
  Kitchenware: [
    { name: 'Stainless Steel Kettle', description: 'Kitchen kettle', price: 27.99, current_stock: 9, min_stock_threshold: 5 },
    { name: 'Non-stick Frying Pan', description: '24cm pan', price: 31.99, current_stock: 13, min_stock_threshold: 8 },
    { name: 'Glass Storage Jar Set', description: 'Airtight jar set', price: 16.99, current_stock: 21, min_stock_threshold: 12 },
  ],
  Sports: [
    { name: 'Yoga Mat', description: 'Non-slip exercise mat', price: 21.99, current_stock: 26, min_stock_threshold: 15 },
    { name: 'Football Size 5', description: 'Training football', price: 19.99, current_stock: 10, min_stock_threshold: 8 },
    { name: 'Running Bottle', description: 'Sports water bottle', price: 12.99, current_stock: 18, min_stock_threshold: 10 },
  ],
  Automotive: [
    { name: 'Car Vacuum Cleaner', description: 'Compact vehicle vacuum', price: 44.99, current_stock: 5, min_stock_threshold: 5, is_active: false },
    { name: 'Tire Inflator Pump', description: 'Portable tire pump', price: 38.99, current_stock: 7, min_stock_threshold: 5 },
    { name: 'Car Phone Mount', description: 'Magnetic phone holder', price: 15.99, current_stock: 14, min_stock_threshold: 10 },
  ],
  Furniture: [
    { name: 'Office Chair Ergonomic', description: 'Supportive office chair', price: 249.99, current_stock: 6, min_stock_threshold: 5 },
    { name: 'Study Desk Compact', description: 'Space-saving study desk', price: 179.99, current_stock: 3, min_stock_threshold: 4 },
    { name: 'Bookshelf 4 Tier', description: 'Four-tier bookshelf', price: 129.99, current_stock: 4, min_stock_threshold: 4 },
  ],
  'Health & Beauty': [
    { name: 'Vitamin C Serum', description: 'Daily skin care serum', price: 22.99, current_stock: 17, min_stock_threshold: 10 },
    { name: 'Hand Wash 500ml', description: 'Antibacterial hand wash', price: 5.49, current_stock: 30, min_stock_threshold: 15 },
    { name: 'Sunscreen SPF50', description: 'Broad-spectrum sunscreen', price: 18.99, current_stock: 12, min_stock_threshold: 8 },
  ],
  'Pet Supplies': [
    { name: 'Dog Food 10kg', description: 'Dry food for adult dogs', price: 42.99, current_stock: 19, min_stock_threshold: 10 },
    { name: 'Cat Litter 5kg', description: 'Clumping cat litter', price: 16.99, current_stock: 11, min_stock_threshold: 10 },
    { name: 'Pet Shampoo', description: 'Gentle shampoo for pets', price: 9.49, current_stock: 8, min_stock_threshold: 6 },
  ],
  Toys: [
    { name: 'Building Blocks Set', description: 'Educational blocks for kids', price: 24.99, current_stock: 24, min_stock_threshold: 12 },
    { name: 'Remote Control Car', description: 'Rechargeable racing car', price: 34.99, current_stock: 5, min_stock_threshold: 4, is_active: false },
    { name: 'Puzzle Board 100pcs', description: 'Family jigsaw puzzle', price: 14.99, current_stock: 16, min_stock_threshold: 8 },
  ],
  Books: [
    { name: 'Productivity Planner', description: 'Undated planner', price: 15.99, current_stock: 28, min_stock_threshold: 12 },
    { name: 'Kids Storybook', description: 'Illustrated storybook', price: 8.99, current_stock: 20, min_stock_threshold: 10, is_active: false },
    { name: 'Desk Calendar 2026', description: 'A5 desk calendar', price: 11.99, current_stock: 42, min_stock_threshold: 20 },
  ],
};

export const users: SeededUser[] = [
  { email: 'demo@inventory.local', password: 'demo123', name: 'Demo Manager', phone: '01700000000', role: 'manager', status: 'active' },
  { email: 'sales1@inventory.local', password: 'sales123', name: 'Rafi Hasan', phone: '01711000001', role: 'salesman', status: 'active' },
  { email: 'sales2@inventory.local', password: 'sales123', name: 'Nusrat Jahan', phone: '01711000002', role: 'salesman', status: 'active' },
  { email: 'sales3@inventory.local', password: 'sales123', name: 'Sabbir Ahmed', phone: '01711000003', role: 'salesman', status: 'active' },
];

export const firstNames = ['Amin', 'Sadia', 'Tanvir', 'Mahi', 'Rakib', 'Nadia', 'Sujan', 'Tania', 'Imran', 'Ruma'];
export const lastNames = ['Khan', 'Ahmed', 'Rahman', 'Islam', 'Hossain', 'Chowdhury', 'Sultana', 'Mia', 'Kazi', 'Bari'];
export const orderStatusCycle = ['delivered', 'confirmed', 'shipped', 'pending', 'delivered', 'shipped', 'confirmed', 'delivered', 'pending', 'cancelled'] as const;
export const customerAddresses = ['Banani, Dhaka', 'Dhanmondi, Dhaka', 'Uttara, Dhaka', 'Mirpur, Dhaka', 'Mohammadpur, Dhaka', 'Chattogram', 'Sylhet', 'Khulna', 'Rajshahi', 'Narayanganj'];
export const instructions = ['Deliver after 3 PM', 'Call before delivery', 'Leave at front desk', 'Handle with care', 'Ring the bell twice', 'Keep invoice inside the box', 'Preferred morning delivery', 'Call the office reception'];

export const toDate = (daysAgo: number, hour: number, minute: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
};

export const toId = (row: unknown): string => {
  if (typeof row === 'string') {
    return row;
  }

  if (row && typeof row === 'object' && 'id' in row) {
    return String((row as { id: string }).id);
  }

  return String(row);
};

export const seededRandom = (seed: number): (() => number) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
};

export const formatCustomerPhone = (index: number): string => `0171${String(1000000 + index).slice(-7)}`;

export const priorityFor = (stock: number, threshold: number): 'low' | 'medium' | 'high' => {
  if (stock <= 0) return 'high';
  if (threshold <= 0) return 'low';
  if (stock <= Math.floor(threshold / 2)) return 'medium';
  return 'low';
};

export type SeededProductState = {
  id: string;
  category: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  current_stock: number;
  min_stock_threshold: number;
  is_active: boolean;
};

export const pickOrderLines = (
  products: SeededProductState[],
  count: number,
  random: () => number
): Array<{ product: SeededProductState; quantity: number }> => {
  const available = products.filter((product) => product.is_active && product.current_stock > 0);
  const picked: Array<{ product: SeededProductState; quantity: number }> = [];
  const used = new Set<string>();
  let safety = 0;

  while (picked.length < count && available.length > 0 && safety < 250) {
    const product = available[Math.floor(random() * available.length)];
    safety += 1;

    if (!product || used.has(product.id) || product.current_stock <= 0) {
      continue;
    }

    used.add(product.id);
    const maxQuantity = Math.min(3, product.current_stock);
    const quantity = Math.max(1, Math.floor(random() * maxQuantity) + 1);
    picked.push({ product, quantity });
  }

  if (picked.length === 0 && available.length > 0) {
    picked.push({ product: available[0], quantity: 1 });
  }

  return picked;
};
