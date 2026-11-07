import React from 'react';
import { Sale, StoreSettings } from '@/types';
import { formatNPR } from '@/lib/currency';
import { getNepaliDate } from '@/lib/nepaliDate';
import { Printer, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface A4TaxInvoiceProps {
  sale: Sale;
  settings: StoreSettings;
  onClose?: () => void;
}

export const A4TaxInvoice: React.FC<A4TaxInvoiceProps> = ({ sale, settings, onClose }) => {
  const nepaliDate = getNepaliDate(sale.sale_date);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 font-sans p-6 max-w-4xl mx-auto border border-slate-200 shadow-lg rounded-xl print:shadow-none print:border-none print:m-0 print:p-0">
      {/* Action buttons (hidden on print) */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" /> Print / Save as PDF (A4)
          </Button>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Printable Invoice Container */}
      <div className="print:p-6 print:text-black">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {settings.store_name}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">{settings.store_address}</p>
              <p className="text-xs text-slate-600">
                Phone: {settings.store_phone} | Email: {settings.store_email}
              </p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                PAN / VAT Reg No: <span className="font-mono text-sm tracking-wider">{settings.pan_vat_number}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-bold text-xs uppercase px-3 py-1 rounded">
                TAX INVOICE / कर बिजक
              </span>
              <p className="text-sm font-bold font-mono mt-2">
                Invoice No: {sale.invoice_number}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Date (AD): <span className="font-medium">{sale.sale_date}</span>
              </p>
              <p className="text-xs text-slate-600">
                Date (BS): <span className="font-medium">{nepaliDate.formattedEn}</span>
              </p>
              <p className="text-xs text-slate-600">
                Time: <span>{new Date(sale.created_at || Date.now()).toLocaleTimeString()}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Bill-to details */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
          <div>
            <span className="font-bold text-slate-700 uppercase tracking-wide">Customer Details:</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {sale.customer ? sale.customer.name : 'Walk-in Retail Customer (Cash)'}
            </p>
            {sale.customer?.address && <p className="text-slate-600">{sale.customer.address}</p>}
            {sale.customer?.phone && <p className="text-slate-600">Phone: {sale.customer.phone}</p>}
            {sale.customer?.pan_number && (
              <p className="font-semibold text-slate-800 mt-0.5">
                Buyer PAN: <span className="font-mono">{sale.customer.pan_number}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-700 uppercase tracking-wide">Payment Terms:</span>
            <p className="font-semibold text-slate-800 uppercase mt-0.5">
              Method: <span className="text-sky-700 font-bold">{sale.payment_method}</span>
            </p>
            <p className="font-semibold text-slate-800">
              Payment Status: <span className="uppercase text-emerald-700">{sale.payment_status}</span>
            </p>
            {sale.notes && <p className="text-slate-500 italic mt-1">Note: {sale.notes}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs text-left border-collapse mb-4">
          <thead>
            <tr className="bg-slate-800 text-white font-semibold">
              <th className="py-2 px-3 text-center w-10">S.N.</th>
              <th className="py-2 px-3">Product Description & Serial Numbers</th>
              <th className="py-2 px-3 text-center w-16">Unit</th>
              <th className="py-2 px-3 text-center w-16">Qty</th>
              <th className="py-2 px-3 text-right w-24">Rate (NPR)</th>
              <th className="py-2 px-3 text-right w-20">Discount</th>
              <th className="py-2 px-3 text-right w-28">Amount (NPR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 border-b border-slate-300">
            {sale.items?.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="py-2.5 px-3 text-center font-mono">{idx + 1}</td>
                <td className="py-2.5 px-3">
                  <p className="font-bold text-slate-900">{item.product?.name || 'Home Appliance'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    SKU: {item.product?.sku || 'N/A'} {item.product?.model_number ? `| Model: ${item.product.model_number}` : ''}
                  </p>
                  {item.serial_numbers && item.serial_numbers.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="font-semibold text-[11px] text-sky-800">S/N:</span>
                      {item.serial_numbers.map(s => (
                        <span key={s} className="bg-sky-50 text-sky-900 border border-sky-200 px-1.5 py-0.2 rounded font-mono text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.warranty_expiry_date && (
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      ✓ Covered under {item.product?.warranty_months || 12}-Month Warranty until {item.warranty_expiry_date}
                    </p>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-600">Pcs</td>
                <td className="py-2.5 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatNPR(item.unit_price, false)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatNPR(item.discount, false)}</td>
                <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{formatNPR(item.total_price, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Calculation Summary */}
        <div className="flex justify-between items-start text-xs mb-8">
          <div className="w-1/2 pr-6">
            <div className="border border-slate-200 rounded p-2.5 bg-slate-50 text-[11px] space-y-1">
              <p className="font-bold text-slate-800 uppercase">Terms & Warranty Conditions:</p>
              <p className="text-slate-600">1. Original tax invoice and serial number required for warranty claims.</p>
              <p className="text-slate-600">2. Physical damage, liquid spills, or lightning voltage surges not covered.</p>
              <p className="text-slate-600">3. {settings.invoice_footer_note}</p>
            </div>
          </div>
          <div className="w-1/2 max-w-xs space-y-1.5 text-right">
            <div className="flex justify-between py-1 text-slate-600 border-b border-slate-200">
              <span>Gross Subtotal:</span>
              <span className="font-mono font-medium">{formatNPR(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between py-1 text-rose-600 border-b border-slate-200">
                <span>Discount / छुट:</span>
                <span className="font-mono font-medium">-{formatNPR(sale.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-slate-700 border-b border-slate-200">
              <span>Taxable Amount / करयोग्य रकम:</span>
              <span className="font-mono font-medium">{formatNPR(sale.subtotal - sale.discount_amount)}</span>
            </div>
            <div className="flex justify-between py-1 text-slate-700 border-b border-slate-200">
              <span>VAT (13%) / मूल्य अभिवृद्धि कर:</span>
              <span className="font-mono font-medium">{formatNPR(sale.vat_amount)}</span>
            </div>
            <div className="flex justify-between py-2 text-base font-black text-slate-900 border-b-2 border-slate-900">
              <span>Grand Total / जम्मा रकम:</span>
              <span className="font-mono text-sky-700">{formatNPR(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs text-slate-700">
              <span>Paid Amount / भुक्तानी रकम:</span>
              <span className="font-mono font-bold text-emerald-700">{formatNPR(sale.paid_amount)}</span>
            </div>
            {sale.total_amount - sale.paid_amount > 0 && (
              <div className="flex justify-between py-1 text-xs text-rose-700 font-bold bg-rose-50 px-2 rounded">
                <span>Balance Due / बाँकी रकम:</span>
                <span className="font-mono">{formatNPR(sale.total_amount - sale.paid_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="grid grid-cols-2 pt-8 text-xs text-center border-t border-slate-200">
          <div>
            <div className="h-10"></div>
            <p className="border-t border-dashed border-slate-400 inline-block px-8 pt-1 text-slate-600 font-medium">
              Customer's Signature
            </p>
          </div>
          <div>
            <div className="h-10"></div>
            <p className="border-t border-dashed border-slate-400 inline-block px-8 pt-1 text-slate-900 font-bold">
              For {settings.store_name} (Authorized Signatory)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
