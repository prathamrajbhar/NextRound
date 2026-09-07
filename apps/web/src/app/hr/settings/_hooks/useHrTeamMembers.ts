'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useAuthContext } from '@/contexts/AuthContext';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export function useHrTeamMembers(orgId: string | null, onSaved: () => void) {
  const { user } = useAuthContext();

  const [team, setTeam] = useState<TeamMember[]>(() => {
    if (user?.email) {
      return [{ id: user?.id || 'me', name: user.email.split('@')[0], email: user.email, role: 'Owner', status: 'Active' }];
    }
    return [];
  });

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Recruiter' | 'Reviewer'>('Recruiter');

  useEffect(() => {
    async function loadMembers() {
      if (!orgId) return;
      try {
        const res = await apiClient
          .get<{ members: { id: string; email: string; role: string }[] }>(`/organizations/${orgId}/members`)
          .catch(() => null);
        if (res?.members?.length) {
          setTeam(
            res.members.map((m) => ({
              id: m.id,
              name: m.email.split('@')[0],
              email: m.email,
              role: m.id === user?.id ? 'Owner' : 'Admin',
              status: 'Active',
            }))
          );
        }
      } catch {}
    }
    loadMembers();
  }, [orgId, user]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !orgId) return;
    try {
      await apiClient.post(`/organizations/${orgId}/members/invite`, {
        email: inviteEmail.trim(),
        role: 'hr',
      });
      setTeam([
        ...team,
        {
          id: `pending-${Date.now()}`,
          name: inviteEmail.split('@')[0],
          email: inviteEmail.trim(),
          role: inviteRole,
          status: 'Invited',
        },
      ]);
      setInviteEmail('');
    } catch {}
    onSaved();
  };

  const handleRemoveMember = async (id: string) => {
    if (orgId && !id.startsWith('pending-')) {
      try {
        await apiClient.delete(`/organizations/${orgId}/members/${id}`);
      } catch {}
    }
    setTeam(team.filter((m) => m.id !== id));
    onSaved();
  };

  return {
    team,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    handleInviteSubmit,
    handleRemoveMember,
  };
}
