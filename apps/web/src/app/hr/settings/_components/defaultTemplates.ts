export const DEFAULT_EMAIL_TEMPLATES = {
  interview: {
    subject: 'Invitation to AI Voice Screening Round for {{role_title}}',
    body: 'Hi {{candidate_name}},\n\nOur AI Screening Agent evaluated your resume and matched your background for the {{role_title}} position at {{company_name}}.\n\nPlease select a convenient 15-minute slot to complete your conversational voice interview: {{interview_link}}\n\nBest regards,\n{{company_name}} Recruiting Team',
  },
  assessment: {
    subject: 'Online Technical Assessment Link for {{role_title}}',
    body: 'Hello {{candidate_name}},\n\nYou have been invited to complete the Online Technical Assessment for the {{role_title}} opening. This includes 5 multiple-choice questions and 1 coding challenge.\n\nStart Assessment: {{assessment_link}}\n\nGood luck!\n{{company_name}} Engineering Board',
  },
  offer: {
    subject: 'Official Employment Offer Letter — {{role_title}}',
    body: 'Dear {{candidate_name}},\n\nCongratulations! We are thrilled to offer you the position of {{role_title}} at {{company_name}}.\n\nAttached is your formal employment agreement. Please sign and accept by {{offer_deadline}}.\n\nWelcome aboard!\n{{company_name}} HR Team',
  },
  rejection: {
    subject: 'Update regarding your application for {{role_title}}',
    body: 'Dear {{candidate_name}},\n\nThank you for taking the time to interview for the {{role_title}} role at {{company_name}}. While your profile is impressive, we have decided to advance other candidates whose skills more closely match our immediate needs.\n\nWe will keep your resume in our talent pool for future openings.\n\nWarm regards,\n{{company_name}} Recruiting',
  },
};
