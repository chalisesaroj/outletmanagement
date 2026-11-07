import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ProductSerial } from '@/types';
import { Check, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface SerialPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  requiredCount: number;
  availableSerials: ProductSerial[];
  selectedSerials: string[];
  onConfirm: (serials: string[]) => void;
}

export const SerialPickerModal: React.FC<SerialPickerModalProps> = ({
  isOpen,
  onClose,
  productName,
  requiredCount,
  availableSerials,
  selectedSerials,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedSerials);

  const toggleSerial = (sn: string) => {
    if (selected.includes(sn)) {
      setSelected(selected.filter((s) => s !== sn));
    } else {
      if (selected.length < requiredCount) {
        setSelected([...selected, sn]);
      }
    }
  };

  const handleSave = () => {
    onConfirm(selected);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Serial Numbers"
      description={`Select ${requiredCount} unit serial number(s) for ${productName}`}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={selected.length !== requiredCount}
            onClick={handleSave}
          >
            Confirm {selected.length}/{requiredCount} Serials
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-sky-50 dark:bg-sky-950/40 p-2.5 rounded-lg border border-sky-200 dark:border-sky-800 text-xs">
          <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Selected for Manufacturer Warranty Registration</span>
          </div>
          <Badge variant={selected.length === requiredCount ? 'success' : 'warning'}>
            {selected.length} of {requiredCount} selected
          </Badge>
        </div>

        {availableSerials.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-500">
            No active serial numbers available in inventory for this appliance.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {availableSerials.map((s) => {
              const isChecked = selected.includes(s.serial_number);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSerial(s.serial_number)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    isChecked
                      ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isChecked
                          ? 'bg-sky-600 border-sky-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="font-mono text-xs font-semibold">{s.serial_number}</span>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {s.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
