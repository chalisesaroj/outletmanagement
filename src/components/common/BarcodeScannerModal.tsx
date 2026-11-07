import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Barcode, Search, CheckCircle } from 'lucide-react';
import { playScanBeep } from '@/lib/utils';
import { Product } from '@/types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductFound: (product: Product, serialNumber?: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductFound,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    setError('');
    const query = code.trim().toLowerCase();

    // Check by barcode or SKU
    const foundProduct = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query) ||
        p.sku.toLowerCase() === query ||
        p.model_number?.toLowerCase() === query
    );

    if (foundProduct) {
      playScanBeep();
      onProductFound(foundProduct);
      setCode('');
      onClose();
    } else {
      setError(`No appliance found matching barcode/SKU: "${code}"`);
    }
  };

  const handleQuickPick = (p: Product) => {
    playScanBeep();
    onProductFound(p);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barcode & SKU Scanner"
      description="Scan barcode with handheld scanner or type appliance SKU/Model"
      size="md"
    >
      <div className="space-y-4">
        <form onSubmit={handleScanSubmit} className="space-y-3">
          <Input
            autoFocus
            label="Barcode / SKU / Model Number"
            placeholder="e.g. 8806091827361 or SAM-TV-55CU7700"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError('');
            }}
            leftIcon={<Barcode className="w-5 h-5 text-sky-600" />}
            error={error}
          />
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <Search className="w-4 h-4 mr-1" /> Look Up
            </Button>
          </div>
        </form>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
            Quick Scan Test Presets:
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {products.slice(0, 5).map((p) => (
              <div
                key={p.id}
                onClick={() => handleQuickPick(p)}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer border border-slate-200 dark:border-slate-700 text-xs transition-colors"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Barcode: {p.barcode || 'N/A'} | SKU: {p.sku}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="text-xs py-1">
                  Scan
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
