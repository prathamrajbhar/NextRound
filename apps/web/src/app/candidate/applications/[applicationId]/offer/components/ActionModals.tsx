'use client';

import React from 'react';
import { AcceptOfferModal } from './AcceptOfferModal';
import { DeclineOfferModal } from './DeclineOfferModal';

interface ActionModalsProps {
  showAccept: boolean;
  showDecline: boolean;
  onCloseAccept: () => void;
  onCloseDecline: () => void;
  onConfirmAccept: (signatureSvg: string) => void;
  onConfirmDecline: (reason: string) => void;
  orgName: string;
  candidateName: string;
  joiningDate: string;
}

export function ActionModals({
  showAccept,
  showDecline,
  onCloseAccept,
  onCloseDecline,
  onConfirmAccept,
  onConfirmDecline,
  orgName,
  candidateName,
  joiningDate,
}: ActionModalsProps) {
  return (
    <>
      <AcceptOfferModal
        isOpen={showAccept}
        onClose={onCloseAccept}
        onConfirm={onConfirmAccept}
        orgName={orgName}
        candidateName={candidateName}
        joiningDate={joiningDate}
      />

      <DeclineOfferModal
        isOpen={showDecline}
        onClose={onCloseDecline}
        onConfirm={onConfirmDecline}
        orgName={orgName}
      />
    </>
  );
}
