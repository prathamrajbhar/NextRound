'use client';

import { useState } from 'react';
import { DEFAULT_AVATAR } from '../_utils/profileUtils';

export function useProfileFields(initialEmail?: string) {
  const [name, setName] = useState(() => (initialEmail ? initialEmail.split('@')[0] : ''));
  const [email, setEmail] = useState(() => initialEmail || '');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  return {
    name,
    setName,
    email,
    setEmail,
    phone,
    setPhone,
    location,
    setLocation,
    headline,
    setHeadline,
    avatar,
    setAvatar,
    customAvatar,
    setCustomAvatar,
    linkedinUrl,
    setLinkedinUrl,
    githubUrl,
    setGithubUrl,
    portfolioUrl,
    setPortfolioUrl,
    targetRoles,
    setTargetRoles,
    experienceYears,
    setExperienceYears,
    expectedSalary,
    setExpectedSalary,
    bio,
    setBio,
    skills,
    setSkills,
  };
}
