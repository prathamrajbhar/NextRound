'use client';

import React, { use, useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Offer } from '@/types';
import { OfferHeader } from './components/OfferHeader';
import { ExecutiveRewardsGrid } from './components/ExecutiveRewardsGrid';
import { EmbeddedDocumentViewer } from './components/EmbeddedDocumentViewer';
import { OfferActionSidebar } from './components/OfferActionSidebar';
import { OfferDocumentModal } from './components/OfferDocumentModal';
import { ActionModals } from './components/ActionModals';
import { CheckCircle2, XCircle } from 'lucide-react';

const DEFAULT_OFFER: Offer = {
  id: 'off-101',
  applicationId: 'app-501',
  candidateName: 'Candidate User',
  candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  jobId: 'job-101',
  jobTitle: 'Senior Fullstack Engineer',
  orgName: 'Swiggy Technologies',
  status: 'sent',
  baseSalary: '₹38,000,000',
  bonus: '₹4,000,000 Performance Bonus',
  equity: '₹12,000,000 ESOPs over 4 years',
  joiningDate: 'August 15, 2026',
  expiryDate: 'July 15, 2026',
  benefits: [
    'Comprehensive Health & Dental Plan for Dependents',
    '₹150,000 Annual Learning & Conference Budget',
    'Flexible Work Location & Home Office Setup Stipend',
    'Unlimited Paid Time Off (PTO) Policy',
  ],
  negotiationHistory: [],
  letterUrl: '/documents/offer-letter.pdf',
};

export default function CandidateOfferPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);

  const [offer, setOffer] = useState<Offer>(DEFAULT_OFFER);

  useEffect(() => {
    async function fetchOffer() {
      try {
        const res = await apiClient.get<Offer>(`/candidate/applications/${applicationId}/offer`);
        if (res) setOffer(res);
      } catch (err) {
        console.error('Failed to load offer:', err);
      }
    }
    fetchOffer();
  }, [applicationId]);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [actionDone, setActionDone] = useState<'accepted' | 'declined' | null>(null);

  const handleAccept = async (signatureSvg: string) => {
    try {
      await fetch(`/api/v1/applications/${applicationId}/offer/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_svg: signatureSvg }),
      });
    } catch (err) {
      console.error('Failed to post digital signature to API:', err);
    }
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
