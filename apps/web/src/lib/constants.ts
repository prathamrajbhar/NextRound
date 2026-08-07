export const SUGGESTED_COMPANIES = ['Google', 'Stripe', 'Vercel', 'Netflix', 'Razorpay', 'Swiggy'];
export const SUGGESTED_ROLES = ['Software Engineer', 'Frontend Developer', 'Product Manager'];

export const getCompanyCultureNotes = (companyName: string): { notes: string; tags: string[] } => {
  const name = companyName.toLowerCase().trim();
  if (name.includes('google')) {
    return {
      notes: 'Google focuses heavily on algorithmic complexity, distributed scale, strict data structure logic, and clear problem-solving walk-throughs.',
      tags: ['Big-O Analysis', 'System Scale', 'Data Structures']
    };
  }
  if (name.includes('stripe')) {
    return {
      notes: 'Stripe evaluates pixel-perfect CSS/UI performance, reliable developer API designs, robust checkout pipelines, and ledger integrity.',
      tags: ['API Design', 'UI Performance', 'Ledgers']
    };
  }
  if (name.includes('vercel')) {
    return {
      notes: 'Vercel checks production-grade Next.js, Edge configurations, Core Web Vitals optimization, and clean micro-interactions.',
      tags: ['Next.js App Router', 'Web Vitals', 'Edge Runtime']
    };
  }
  if (name.includes('netflix')) {
    return {
      notes: 'Netflix values resilient client caching, video delivery architectures, high concurrency models, and distributed service logic.',
      tags: ['Caching', 'Concurrency', 'Network Lag']
    };
  }
  if (name.includes('razorpay')) {
    return {
      notes: 'Razorpay centers on localized merchant checkouts, payment intent APIs, low-latency transaction retries, and UPI app launching.',
      tags: ['Payment Flows', 'API Latency', 'Merchant UX']
    };
  }
  if (name.includes('swiggy')) {
    return {
      notes: 'Swiggy checks transaction success margins, location driver telemetry matching, and micro-frontend federation structures.',
      tags: ['Micro-frontends', 'Live Tracking', 'Scalability']
    };
  }
  return {
    notes: `AI practice interview will adjust parameters based on standard ${companyName || 'General'} industry benchmarks.`,
    tags: ['Industry Standard', 'Role Alignment', 'Core Logic']
  };
};

export const getRubricWeights = (roleTitle: string) => {
  const title = roleTitle.toLowerCase();
  if (title.includes('product') || title.includes('pm')) {
    return { technical: 25, communication: 45, culture: 30 };
  }
  if (title.includes('frontend') || title.includes('react') || title.includes('developer') || title.includes('engineer')) {
    return { technical: 50, communication: 25, culture: 25 };
  }
  return { technical: 40, communication: 30, culture: 30 };
};
