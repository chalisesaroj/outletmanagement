import React from 'react';
import { Sale, StoreSettings } from '@/types';
import { formatNPR } from '@/lib/currency';
import { getNepaliDate } from '@/lib/nepaliDate';
import { Printer, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ThermalReceiptProps {
  sale: Sale;
  settings: StoreSettings;
  format?: '80mm' | '58mm';
  onClose?: () => void;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({
  sale,
  settings,
  format = '80mm',
  onClose,
}) => {
  const nepaliDate = getNepaliDate(sale.sale_date);
  const is58mm = format === '58mm';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black p-4 mx-auto rounded-lg shadow-md print:shadow-none print:p-0 print:m-0 flex flex-col items-center">
      {/* Controls */}
      <div className="flex items-center justify-between w-full pb-3 mb-3 border-b border-slate-200 print:hidden">
        <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5">
          <Printer className="w-3.5 h-3.5" /> Print Thermal ({format})
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* POS Thermal Slip */}
      <div
        className={`font-mono text-left bg-white text-black ${
          is58mm ? 'w-[58mm] text-[10px]' : 'w-[80mm] text-xs'
        } leading-tight p-2 print:w-full`}
      >
        {/* Header */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h2 className="font-extrabold uppercase text-sm">{settings.store_name}</h2>
          <p className="text-[10px]">{settings.store_address}</p>
          <p className="text-[10px]">Tel: {settings.store_phone}</p>
          <p className="font-bold text-[11px] mt-1">PAN: {settings.pan_vat_number}</p>
          <div className="mt-1 border border-black inline-block px-2 py-0.5 font-bold uppercase text-[10px]">
            Retail Tax Receipt
          </div>
        </div>

        {/* Invoice Info */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
          <div>Bill No: <b>{sale.invoice_number}</b></div>
          <div>Date: {sale.sale_date} ({nepaliDate.formattedEn})</div>
          <div>Customer: {sale.customer ? sale.customer.name : 'Walk-in Cash'}</div>
          {sale.customer?.pan_number && <div>Cust PAN: {sale.customer.pan_number}</div>}
          <div>Pay Mode: <b className="uppercase">{sale.payment_method}</b></div>
        </div>

        {/* Item List */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="flex justify-between font-bold pb-1 border-b border-black">
            <span>Item</span>
            <span>Qty x Rate</span>
            <span>Amt</span>
          </div>
          <div className="divide-y divide-dotted divide-slate-300 pt-1">
            {sale.items?.map((item, i) => (
              <div key={i} className="py-1">
                <div className="font-bold">{item.product?.name || 'Appliance'}</div>
                {item.serial_numbers?.length > 0 && (
                  <div className="text-[9px] text-slate-800">
                    S/N: {item.serial_numbers.join(', ')}
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>{item.quantity} x {formatNPR(item.unit_price, false)}</span>
                  <span className="font-bold">{formatNPR(item.total_price, false)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="py-2 border-b border-dashed border-black space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatNPR(sale.subtotal)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{formatNPR(sale.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Taxable:</span>
            <span>{formatNPR(sale.subtotal - sale.discount_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT (13%):</span>
            <span>{formatNPR(sale.vat_amount)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-black">
            <span>TOTAL:</span>
            <span>{formatNPR(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>PAID:</span>
            <span>{formatNPR(sale.paid_amount)}</span>
          </div>
          {sale.total_amount - sale.paid_amount > 0 && (
            <div className="flex justify-between font-bold">
              <span>BAL DUE:</span>
              <span>{formatNPR(sale.total_amount - sale.paid_amount)}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-3 space-y-1 text-[10px]">
          <p>{settings.invoice_footer_note}</p>
          <p className="font-bold">*** THANK YOU ***</p>
        </div>
      </div>
    </div>
  );
};
