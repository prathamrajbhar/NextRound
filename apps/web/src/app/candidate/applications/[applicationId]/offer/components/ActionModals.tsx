'use client';

import React, { useState, useRef } from 'react';
import { CheckCircle2, XCircle, PenTool, RefreshCw } from 'lucide-react';

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
  const [signatureText, setSignatureText] = useState(candidateName);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [declineReason, setDeclineReason] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const svgRef = useRef<SVGSVGElement | null>(null);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setCurrentPath(`M ${x} ${y}`);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath((prev) => `${prev} L ${x} ${y}`);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath) {
      setPaths((prev) => [...prev, currentPath]);
      setCurrentPath('');
      setIsDrawing(false);
    }
  };

  const handleClearSignature = () => {
    setPaths([]);
    setCurrentPath('');
  };

  const generateSignatureSvgString = () => {
    if (paths.length > 0) {
      const pathsXml = paths.map((p) => `<path d="${p}" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" />`).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120">${pathsXml}</svg>`;
    }
    
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120"><text x="20" y="70" font-family="serif" font-size="32" font-style="italic" fill="#059669">${signatureText || candidateName}</text></svg>`;
  };

  const handleConfirmSignature = () => {
    const svgStr = generateSignatureSvgString();
    onConfirmAccept(svgStr);
  };

  if (!showAccept && !showDecline) return null;

  return (
    <>
      {}
      {showAccept && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Sign & Accept Offer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                By signing below, you accept the employment terms with{' '}
                <strong className="text-slate-900 dark:text-white">{orgName}</strong> starting on{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{joiningDate}</strong>.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Type Full Legal Name:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signatureText}
                    onChange={(e) => setSignatureText(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-serif italic text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                    placeholder="e.g. Ananya Iyer"
                  />
                  <PenTool className="h-4 w-4 text-slate-400 absolute right-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Draw E-Signature:
                  </label>
                  {paths.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-[10px] text-slate-400 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Clear Canvas
                    </button>
                  )}
                </div>
                <div className="border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden relative cursor-crosshair">
                  <svg
                    ref={svgRef}
                    className="w-full h-28 touch-none select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {paths.map((p, idx) => (
                      <path
                        key={idx}
                        d={p}
                        stroke="#059669"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {currentPath && (
                      <path
                        d={currentPath}
                        stroke="#059669"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                  {paths.length === 0 && !currentPath && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-slate-400 pointer-events-none opacity-50">
                      Sign here using mouse or touchpad
                    </div>
                  )}
                </div>
              </div>

              <label className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>I confirm that I have reviewed the offer document and agree to all terms.</span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={!agreeTerms || (!signatureText.trim() && paths.length === 0)}
                onClick={handleConfirmSignature}
                className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Confirm Signature & Accept
              </button>
              <button
                type="button"
                onClick={onCloseAccept}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {}
      {showDecline && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20">
                <XCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Decline Employment Offer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Please provide feedback for the recruitment team at {orgName}.
              </p>
            </div>

            <textarea
              placeholder="e.g. Accepted another offer / Comp terms were not met..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              className="w-full p-3 text-xs font-medium rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none shadow-inner"
            />

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => onConfirmDecline(declineReason)}
                className="flex-1 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 text-xs shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
              >
                Confirm Decline
              </button>
              <button
                type="button"
                onClick={onCloseDecline}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-4 py-3 text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
