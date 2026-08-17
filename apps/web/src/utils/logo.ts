export const getCompanyDomain = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  const companyDomains: Record<string, string> = {
    google: 'google.com',
    stripe: 'stripe.com',
    vercel: 'vercel.com',
    netflix: 'netflix.com',
    swiggy: 'swiggy.com',
    razorpay: 'razorpay.com',
    cred: 'cred.club',
    zoho: 'zoho.com',
    zerodha: 'zerodha.com',
    ola: 'olacabs.com',
    meesho: 'meesho.com',
    flipkart: 'flipkart.com',
    microsoft: 'microsoft.com',
    apple: 'apple.com',
    amazon: 'amazon.com',
    meta: 'meta.com',
    facebook: 'facebook.com',
  };

  if (companyDomains[normalized]) {
    return companyDomains[normalized];
  }

  const cleanName = normalized.replace(/[^a-z0-9]/g, '');
  return cleanName ? `${cleanName}.com` : 'google.com';
};
