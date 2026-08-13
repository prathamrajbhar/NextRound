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
import { ApplicationDetailSkeleton } from '@/components/ui';

export default function CandidateOfferPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);

  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOffer() {
      try {
        setLoading(true);
        const res = await apiClient.get<Offer>(`/candidate/applications/${applicationId}/offer`);
        if (res) setOffer(res);
      } catch (err) {
        console.error('Failed to fetch offer details:', err);
      } finally {
        setLoading(false);
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
      await apiClient.post(`/applications/${applicationId}/offer/sign`, {
        signature_svg: signatureSvg,
      });
    } catch (err) {
      console.error('Failed to post digital signature to API:', err);
    }
    setOffer((prev) => (prev ? { ...prev, status: 'accepted' } : null));
    setActionDone('accepted');
    setShowAcceptModal(false);
  };

  const handleDecline = async (reason: string) => {
    try {
      await apiClient.post(`/applications/${applicationId}/offer/decline`, { reason });
    } catch (err) {
      console.error('Failed to post decline status to API:', err);
    }
    setOffer((prev) => (prev ? { ...prev, status: 'declined' } : null));
    setActionDone('declined');
    setShowDeclineModal(false);
  };

  if (loading) {
    return <ApplicationDetailSkeleton />;
  }

  if (!offer) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">No Offer Details Available</h2>
        <p className="text-xs text-slate-500">No official offer letter has been issued for this application yet.</p>
      </div>
    );
  }

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
