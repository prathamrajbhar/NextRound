'use client';

import React, { use, useState } from 'react';
import { mockOffers } from '@/lib/mockData';
import { OfferHeader } from './components/OfferHeader';
import { ExecutiveRewardsGrid } from './components/ExecutiveRewardsGrid';
import { EmbeddedDocumentViewer } from './components/EmbeddedDocumentViewer';
import { OfferActionSidebar } from './components/OfferActionSidebar';
import { OfferDocumentModal } from './components/OfferDocumentModal';
import { ActionModals } from './components/ActionModals';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function CandidateOfferPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);

  const initialOffer =
    mockOffers.find((o) => o.applicationId === applicationId) || mockOffers[0];
  const [offer, setOffer] = useState(initialOffer);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [actionDone, setActionDone] = useState<'accepted' | 'declined' | null>(null);

  const handleAccept = () => {
    setOffer((prev) => ({ ...prev, status: 'accepted' }));
    setActionDone('accepted');
    setShowAcceptModal(false);
  };

  const handleDecline = (reason: string) => {
    setOffer((prev) => ({ ...prev, status: 'declined' }));
    setActionDone('declined');
    setShowDeclineModal(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Executive Header Banner */}
      <OfferHeader
        applicationId={applicationId}
        jobTitle={offer.jobTitle}
        orgName={offer.orgName}
        status={offer.status}
        totalCtc={offer.baseSalary}
      />

      {/* Decision Status Toast Notification */}
      {actionDone && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
            actionDone === 'accepted'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          {actionDone === 'accepted' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {actionDone === 'accepted' ? 'Offer Successfully Signed!' : 'Offer Declined'}
            </h4>
            <p className="text-xs font-medium opacity-90 leading-relaxed">
              {actionDone === 'accepted'
                ? 'Congratulations! You have legally signed and accepted the employment agreement. The onboarding team will reach out with next steps.'
                : 'You have declined this offer. The recruitment team has been notified.'}
            </p>
          </div>
        </div>
      )}

      {/* Unified Executive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Compensation Breakdown + Contract Document Surface */}
        <div className="lg:col-span-2 space-y-6">
          <ExecutiveRewardsGrid
            baseSalary={offer.baseSalary}
            bonus={offer.bonus}
            equity={offer.equity}
            benefits={offer.benefits}
          />

          <EmbeddedDocumentViewer
            orgName={offer.orgName}
            jobTitle={offer.jobTitle}
            candidateName={offer.candidateName}
            baseSalary={offer.baseSalary}
            joiningDate={offer.joiningDate}
            onOpenModal={() => setShowPdfModal(true)}
          />
        </div>

        {/* Right Column: Sticky Action Sidebar */}
        <div className="lg:col-span-1">
          <OfferActionSidebar
            status={offer.status}
            expiryDate={offer.expiryDate}
            orgName={offer.orgName}
            onAccept={() => setShowAcceptModal(true)}
            onDecline={() => setShowDeclineModal(true)}
          />
        </div>
      </div>

      {/* Full-Screen PDF Document Modal */}
      <OfferDocumentModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        orgName={offer.orgName}
        jobTitle={offer.jobTitle}
        candidateName={offer.candidateName}
        baseSalary={offer.baseSalary}
        joiningDate={offer.joiningDate}
      />

      {/* Action Confirmation Modals */}
      <ActionModals
        showAccept={showAcceptModal}
        showDecline={showDeclineModal}
        onCloseAccept={() => setShowAcceptModal(false)}
        onCloseDecline={() => setShowDeclineModal(false)}
        onConfirmAccept={handleAccept}
        onConfirmDecline={handleDecline}
        orgName={offer.orgName}
        candidateName={offer.candidateName}
        joiningDate={offer.joiningDate}
      />
    </div>
  );
}
