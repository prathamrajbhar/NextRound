export interface MockOrganizationSettings {
  orgId: string;
  orgName: string;
  orgLogo: string;
  domain: string;
  supportEmail: string;
  timezone: string;
  defaultThreshold: number;
  autoOfferEnabled: boolean;
  defaultVoice: 'Serena' | 'Alloy' | 'Echo' | 'Fable' | 'Nova' | 'Onyx' | 'Shimmer';
  anonymizeResumes: boolean;
  proctoringStrictness: 'low' | 'medium' | 'high';
  emailTemplates: {
    voiceInviteSubject: string;
    voiceInviteBody: string;
    offerSubject: string;
    offerBody: string;
    rejectionSubject: string;
    rejectionBody: string;
  };
  availabilityHours: {
    start: string;
    end: string;
    workDays: string[];
  };
}

export const MOCK_ORGANIZATION_SETTINGS: MockOrganizationSettings = {
  orgId: 'org-nextround-demo',
  orgName: 'Acme Tech Corp',
  orgLogo: 'https://logo.clearbit.com/swiggy.com',
  domain: 'acmetech.io',
  supportEmail: 'careers@acmetech.io',
  timezone: 'Asia/Kolkata (IST)',
  defaultThreshold: 85,
  autoOfferEnabled: true,
  defaultVoice: 'Serena',
  anonymizeResumes: true,
  proctoringStrictness: 'medium',
  emailTemplates: {
    voiceInviteSubject: 'Invitation to AI Voice Assessment for {{jobTitle}} at Acme Tech',
    voiceInviteBody: 'Hi {{candidateName}},\n\nCongratulations! Your application has cleared resume screening. Click below to begin your 15-minute voice assessment.\n\nLink: {{assessmentUrl}}\n\nBest regards,\nTalent Acquisition Team',
    offerSubject: 'Job Offer: {{jobTitle}} at Acme Tech Corp',
    offerBody: 'Hi {{candidateName}},\n\nWe are excited to offer you the position of {{jobTitle}} at Acme Tech Corp! Your interview score was {{score}}%. Please review the offer letter link attached.\n\nBest,\nHiring Committee',
    rejectionSubject: 'Update regarding your application for {{jobTitle}}',
    rejectionBody: 'Hi {{candidateName}},\n\nThank you for taking the time to interview with us. While your qualifications are impressive, we have chosen to move forward with another candidate whose background closely aligns with our current team needs.\n\nWe wish you the very best.'
  },
  availabilityHours: {
    start: '09:00',
    end: '19:00',
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  }
};
