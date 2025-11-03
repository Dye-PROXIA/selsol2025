export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Invoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customer: {
    name: string;
    orderNumber: string;
    email: string;
    attendeeName: string;
  };
  items: LineItem[];
  notes: string;
  taxRate: number;
}
