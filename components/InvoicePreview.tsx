
import React from 'react';
import { Invoice } from '../types.ts';

interface InvoicePreviewProps {
  invoice: Invoice;
  companyInfo: {
    name: string;
    address: string;
    email: string;
    phone: string;
    logoUrl: string;
  };
  subtotal: number;
  taxAmount: number;
  total: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, companyInfo, subtotal, taxAmount, total }) => {
  return (
    <div id="invoice-preview" className="bg-white p-8 md:p-12 rounded-lg shadow-lg border border-gray-200 print:shadow-none print:border-none print:p-0">
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">請求書</h1>
          <p className="text-gray-500">Invoice</p>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>請求書番号:</strong> {invoice.invoiceNumber}</p>
            <p><strong>発行日:</strong> {invoice.issueDate}</p>
            <p><strong>支払期限:</strong> {invoice.dueDate}</p>
          </div>
        </div>
        <div className="text-right">
          {companyInfo.logoUrl ? 
            <img src={companyInfo.logoUrl} alt="Company Logo" className="w-24 h-auto object-contain mb-2 ml-auto" />
            : null
          }
          <p className="font-semibold text-gray-700">{companyInfo.name}</p>
          <p className="text-sm text-gray-500">{companyInfo.address}</p>
          <p className="text-sm text-gray-500">{companyInfo.email}</p>
          <p className="text-sm text-gray-500">{companyInfo.phone}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="font-semibold text-gray-800 mb-1">請求先:</p>
        <h2 className="text-xl font-bold text-gray-800">{invoice.customer.name || '(請求先名称)'} 御中</h2>
        {invoice.customer.orderNumber && <p className="text-gray-600 mt-2"><strong>注文番号:</strong> {invoice.customer.orderNumber}</p>}
      </div>
      
      <div className="mb-8">
        <p className="font-semibold text-gray-800 mb-1">御請求件名:</p>
        <h2 className="text-xl font-bold text-gray-800">eラーニングサービス</h2>
      </div>

      <table className="w-full mb-8 text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="font-semibold text-gray-900 p-3">内容</th>
            <th className="font-semibold text-gray-900 p-3 text-right w-24">数量</th>
            <th className="font-semibold text-gray-900 p-3 text-right w-32">単価</th>
            <th className="font-semibold text-gray-900 p-3 text-right w-40">金額</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.length > 0 ? (
            invoice.items.map(item => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="p-3 text-gray-800">{item.description}</td>
                <td className="p-3 text-right text-gray-800">{item.quantity}</td>
                <td className="p-3 text-right text-gray-800">{formatCurrency(item.unitPrice)}</td>
                <td className="p-3 text-right text-gray-800">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center p-8 text-gray-400">カートに商品がありません</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-full max-w-xs text-gray-700">
          <div className="flex justify-between py-2 border-b">
            <span>小計</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>消費税 ({invoice.taxRate}%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between py-3 font-bold text-xl text-gray-800 bg-gray-50 -mx-3 px-3">
            <span>合計金額</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">備考</h3>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
      </div>

       <style>{`
        @media print {
          /* 
            印刷時のスタイル調整
            App.tsx側で \`print:hidden\` クラスによって不要なコンポーネント（ヘッダーやフォーム）は非表示になります。
            ここでは、請求書プレビュー自体が印刷ページ全体にきれいに収まるようにスタイルを調整します。
          */
          body {
            background-color: white;
          }
          #invoice-preview {
            position: static;
            margin: 0;
            padding: 0;
            border: none;
            box-shadow: none;
            width: 100%;
            font-size: 10pt;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePreview;
