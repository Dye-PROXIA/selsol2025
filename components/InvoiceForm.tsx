
import React, { useState, useEffect } from 'react';
import { Product, LineItem } from '../types.ts';
import { PlusIcon, TrashIcon, CartIcon } from './icons.tsx';

interface InvoiceFormProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  cart: LineItem[];
  customer: { name: string; orderNumber: string; email: string; attendeeName: string; };
  onCustomerChange: (key: string, value: string) => void;
  onItemChange: (id: string, key: keyof Omit<LineItem, 'id'>, value: string | number) => void;
  onAddItem: (productId: string) => void;
  onRemoveItem: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

const InputField: React.FC<{ label: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; className?: string }> = ({ label, value, onChange, type = 'text', placeholder, className }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
    />
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; icon?: React.ReactNode; }> = ({ title, children, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-4 mb-4 flex items-center">
          {icon && <span className="mr-3 text-indigo-600">{icon}</span>}
          {title}
        </h2>
        <div className="space-y-4">{children}</div>
    </div>
);

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  products,
  loading,
  error,
  cart,
  customer,
  onCustomerChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  useEffect(() => {
    // 商品リストが読み込まれたら、プルダウンの初期値を設定
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  return (
    <div className="space-y-6">
      <Section title="1. 商品を選択" icon={<i className="fas fa-list-ul"></i>}>
        {loading && <p className="text-gray-500">商品リストを読み込み中...</p>}
        {error && <div className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm">{error}</div>}
        {!loading && !error && products.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <label htmlFor="product-select" className="block text-sm font-medium text-gray-700">商品</label>
              <select
                id="product-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({formatCurrency(product.price)})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (selectedProductId) onAddItem(selectedProductId);
              }}
              className="flex-shrink-0 h-10 flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              disabled={!selectedProductId}
            >
              <PlusIcon />
              追加
            </button>
          </div>
        )}
        {!loading && !error && products.length === 0 && !error && (
            <p className="text-gray-500">商品が見つかりませんでした。スプレッドシートの内容を確認してください。</p>
        )}
      </Section>

      {cart.length > 0 && (
        <Section title="カート" icon={<CartIcon />}>
          {cart.map((item, index) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg space-y-2 relative">
                  <p className="font-semibold text-gray-700">{item.description}</p>
                  <div className="grid grid-cols-5 gap-3 items-center">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-500">数量</label>
                        <input type="number" value={item.quantity} min="1" onChange={(e) => onItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)} className="mt-1 block w-full px-2 py-1 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                      </div>
                       <div className="col-span-3 text-right">
                         <p className="text-sm text-gray-800">{new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(item.unitPrice * item.quantity)}</p>
                       </div>
                  </div>
                  <button onClick={() => onRemoveItem(item.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors">
                      <TrashIcon />
                  </button>
              </div>
          ))}
        </Section>
      )}

      <Section title="2. お客様情報を入力" icon={<i className="fas fa-user-edit"></i>}>
          <InputField label="請求先名称" value={customer.name} onChange={(e) => onCustomerChange('name', e.target.value)} placeholder="山田 太郎" />
          <InputField label="注文番号" value={customer.orderNumber} onChange={(e) => onCustomerChange('orderNumber', e.target.value)} placeholder="AB-12345" />
          <InputField label="注文者eメールアドレス" value={customer.email} onChange={(e) => onCustomerChange('email', e.target.value)} type="email" placeholder="example@email.com" />
          <div>
            <label className="block text-sm font-medium text-gray-700">受講者氏名（複数者の場合はすべて入力ください）</label>
            <textarea
              value={customer.attendeeName}
              onChange={(e) => onCustomerChange('attendeeName', e.target.value)}
              placeholder="鈴木 一郎、佐藤 花子"
              rows={3}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
      </Section>
    </div>
  );
};

export default InvoiceForm;
