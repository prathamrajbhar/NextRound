'use client';

import { useState, useEffect, useMemo } from 'react';
import { useJobs } from '@/hooks/queries';
import { deriveJobOptions, normalizeJobs } from '@/lib/jobOptions';
import type { SearchableSelectOption } from '@/components/ui';

interface UseMockJobOptionsParams {
  initialCompany: string | null;
  initialRole: string | null;
  onCalibrate: () => void;
}

export function useMockJobOptions({
  initialCompany,
  initialRole,
  onCalibrate,
}: UseMockJobOptionsParams) {
  const [company, setCompany] = useState(initialCompany || '');
  const [role, setRole] = useState(initialRole || '');
  const [orgId, setOrgId] = useState<string | null>(null);

  const { data: jobsData, isLoading: postedLoading, isError: postedError } = useJobs();
  const postedErrorMessage = postedError ? 'Could not load posted roles.' : undefined;

  const { companies: companyOptions, rolesByOrgId } = useMemo(
    () => deriveJobOptions(normalizeJobs(jobsData)),
    [jobsData]
  );

  useEffect(() => {
    if (postedLoading) return;
    if (companyOptions.length === 0) {
      setOrgId(null);
      setCompany('');
      setRole('');
      return;
    }
    const matchedCompany =
      companyOptions.find((c) => c.label.toLowerCase() === (initialCompany || '').toLowerCase()) ||
      companyOptions[0];
    const orgRoles = rolesByOrgId[matchedCompany.value] || [];
    const matchedRole =
      orgRoles.find((r) => r.toLowerCase() === (initialRole || '').toLowerCase()) ||
      orgRoles[0] ||
      '';
    setOrgId(matchedCompany.value);
    setCompany(matchedCompany.label);
    setRole(matchedRole);
  }, [postedLoading, companyOptions, rolesByOrgId, initialCompany, initialRole]);

  const handleCompanySelect = (opt: SearchableSelectOption) => {
    setCompany(opt.label);
    setOrgId(opt.value);
    setRole((rolesByOrgId[opt.value] || [])[0] || '');
    onCalibrate();
  };

  const handleRoleSelect = (opt: SearchableSelectOption) => setRole(opt.label);

  const roleOptions: SearchableSelectOption[] = orgId
    ? (rolesByOrgId[orgId] || []).map((r) => ({ value: r, label: r }))
    : [];
  const selectedCompany = companyOptions.find((c) => c.value === orgId) || null;
  const selectedRole = roleOptions.find((r) => r.value === role) || null;

  return {
    company,
    role,
    orgId,
    postedLoading,
    postedErrorMessage,
    companyOptions,
    selectedCompany,
    roleOptions,
    selectedRole,
    handleCompanySelect,
    handleRoleSelect,
  };
}
