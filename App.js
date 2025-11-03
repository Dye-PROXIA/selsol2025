
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm.js';
import InvoicePreview from './components/InvoicePreview.js';

const getInitialDate = (offsetDays = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

// ==================================================================
// ★★★ 会社情報とロゴの設定 ★★★
// ==================================================================
const COMPANY_INFO = {
  name: '日本プロジェクトソリューションズ株式会社',
  address: '〒103-0006 東京都中央区日本橋富沢町6番4号 3階 PROXIA GROUP',
  email: 'yourcompany@example.com',
  phone: '03-1234-5678',
  logoUrl: 'https://i.imgur.com/SzxEHWJ.png',
  notes: 'お振込み手数料は貴社にてご負担ください。',
  taxRate: 10,
};

const App = () => {
  const [customer, setCustomer] = useState({
    name: '',
    orderNumber: '',
    email: '',
    attendeeName: '',
  });
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // ★★★ GoogleスプレッドシートのURL設定 ★★★
  const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAbd-F25CEOrUJ-LUJB6ajU9dq89EZk_yZGLqFsSU6CPtppm7AkEU1tO4FhZZZxYDcMmjRcU78SIxe/pub?gid=0&single=true&output=csv';

  useEffect(() => {
    const fetchProducts = async () => {
      if (!SPREADSHEET_URL) {
        setError("GoogleスプレッドシートのURLが設定されていません。App.js内のSPREADSHEET_URLを更新してください。");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(SPREADSHEET_URL);
        if (!response.ok) {
          throw new Error('スプレッドシートのデータの取得に失敗しました。公開設定などを確認してください。');
        }
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).slice(1);
        
        const parseCsvRow = (row) => {
            const columns = [];
            let currentField = '';
            let inQuotes = false;

            for (let i = 0; i < row.length; i++) {
                const char = row[i];
                if (char === '"') {
                    if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
                        currentField += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    columns.push(currentField);
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            columns.push(currentField);
            return columns;
        };

        const parsedProducts = rows
          .map((row, index) => {
            if (!row.trim()) return null;

            const columns = parseCsvRow(row);
            
            if (columns.length < 2) return null;

            const name = columns[0].trim();
            const priceStr = columns[1].trim();
            const description = (columns[2] || '').trim() || name;

            if (!name || !priceStr) return null;

            const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
            if (isNaN(price)) return null;

            return {
              id: `prod-sheet-${index + 1}`,
              name: name,
              description: description,
              price: price,
            };
          })
          .filter(p => p !== null);

        setProducts(parsedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [SPREADSHEET_URL]);


  const invoice = useMemo(() => ({
    invoiceNumber: 'INV-001',
    issueDate: getInitialDate(),
    dueDate: getInitialDate(30),
    customer,
    items: cart,
    notes: COMPANY_INFO.notes,
    taxRate: COMPANY_INFO.taxRate,
  }), [customer, cart]);


  const handleCustomerChange = useCallback((key, value) => {
    setCustomer(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleItemChange = useCallback((id, key, value) => {
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, [key]: value } : item
    ));
  }, []);
  
  const addItem = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCart(prev => {
        const existingItem = prev.find(item => item.id === product.id);
        if(existingItem) {
            return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
        }
        return [
            ...prev,
            { id: product.id, description: product.description, quantity: 1, unitPrice: product.price },
        ];
    });
  }, [products]);

  const removeItem = useCallback((id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return subtotal * (invoice.taxRate / 100);
  }, [subtotal, invoice.taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const handleDownloadPdf = async () => {
    const { jsPDF } = window.jspdf;
    if (!window.html2canvas || !jsPDF) {
      console.error("PDF生成ライブラリが読み込まれていません。");
      alert("PDFの生成に失敗しました。ページを再読み込みしてお試しください。");
      return;
    }

    const invoicePreviewElement = document.getElementById('invoice-preview');
    if (!invoicePreviewElement) return;

    setIsDownloading(true);

    try {
      const canvas = await window.html2canvas(invoicePreviewElement, {
        scale: 2,
        useCORS: true, 
        allowTaint: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`請求書-${invoice.invoiceNumber}.pdf`);

    } catch (error) {
      console.error("PDFの生成中にエラーが発生しました:", error);
      alert("PDFの生成中にエラーが発生しました。");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <header className="bg-white shadow-sm print:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">セルフ請求書発行システム</h1>
          <p className="text-sm text-gray-500">商品を選択し、お客様情報を入力するだけで請求書が完成します。</p>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 print:hidden">
            <InvoiceForm
              products={products}
              loading={loading}
              error={error}
              cart={cart}
              customer={customer}
              onCustomerChange={handleCustomerChange}
              onItemChange={handleItemChange}
              onAddItem={addItem}
              onRemoveItem={removeItem}
            />
          </div>
          <div className="lg:col-span-3">
             <div>
               <InvoicePreview 
                 invoice={invoice}
                 companyInfo={COMPANY_INFO}
                 subtotal={subtotal}
                 taxAmount={taxAmount}
                 total={total}
               />
              <div className="mt-6 text-center print:hidden">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      生成中...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-pdf mr-2"></i>
                      請求書PDFをダウンロード
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">請求書のPDFファイルをダウンロードします。</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
