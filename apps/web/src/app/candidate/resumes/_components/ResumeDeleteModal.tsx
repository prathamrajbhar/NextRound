'use client';

import React from 'react';
import { Modal } from '@/components/ui';

interface ResumeDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResumeDeleteModal({
  isOpen,
  onClose,
  onConfirm,
}: ResumeDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Resume"
      description="This action cannot be undone. Are you sure you want to permanently delete this resume?"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-sm"
          >
            Delete Permanently
          </button>
        </div>
      }
    >
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
        Deleting this resume will permanently remove it from your resume vault. You will lose all ATS scoring details and the PDF download copy.
      </p>
    </Modal>
  );
}
