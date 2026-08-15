'use client';

import React, { useState } from 'react';
import { Sliders, Check } from '@/lib/lucide-google-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface EditThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  minScore: number;
  setMinScore: (val: number) => void;
  autoOffer: boolean;
  setAutoOffer: (val: boolean) => void;
}

export default function EditThresholdModal({
  isOpen,
  onClose,
  minScore,
  setMinScore,
  autoOffer,
  setAutoOffer,
}: EditThresholdModalProps) {
  const [localMinScore, setLocalMinScore] = useState(minScore);
  const [localAutoOffer, setLocalAutoOffer] = useState(autoOffer);

  const handleApply = () => {
    setMinScore(localMinScore);
    setAutoOffer(localAutoOffer);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configure Gating Thresholds"
      icon={<Sliders className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth onClick={handleApply} leftIcon={<Check className="h-4 w-4" />}>
            Apply Settings
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div>
          <div className="flex justify-between mb-1.5 text-[11px]">
            <span className="text-slate-700 dark:text-slate-200">Minimum Shortlist Score</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400">{localMinScore}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            value={localMinScore}
            onChange={(e) => setLocalMinScore(Number(e.target.value))}
            className="w-full accent-purple-600 dark:accent-purple-400 cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-1 leading-normal font-bold">
            Candidates who grade below this score during the voice screening are automatically rejected.
          </span>
        </div>

        <div className="flex justify-between items-center py-2 border-t border-slate-200/60 dark:border-slate-800">
          <div>
            <span className="block text-slate-700 dark:text-slate-200">Auto-Offer Trigger</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5 leading-normal font-bold">
              Automatically dispatch contracts if scoring details exceed the thresholds.
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={localAutoOffer}
              onChange={(e) => setLocalAutoOffer(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-500"></div>
          </label>
        </div>
      </div>
    </Modal>
  );
}
