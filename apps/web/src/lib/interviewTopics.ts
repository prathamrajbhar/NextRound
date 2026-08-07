export interface Topic {
  topic: string;
  question: string;
  followUp: string;
  keywords: string[];
}

export const getTopicsForRoleAndCompany = (role: string, company: string): Topic[] => {
  const r = role.toLowerCase();
  const c = company.toLowerCase();

  if (r.includes('frontend') || r.includes('developer') || r.includes('engineer') && !r.includes('backend')) {
    if (c.includes('swiggy')) {
      return [
        {
          topic: 'Swiggy Menu Virtualization',
          question: 'How would you optimize list rendering for a food delivery menu containing thousands of nested items?',
          followUp: 'That makes sense. But how would you handle dynamic item heights depending on varying image aspect ratios and description texts without causing Cumulative Layout Shift (CLS)?',
          keywords: ['virtual', 'window', 'aspect', 'cls', 'preload', 'memo']
        },
        {
          topic: 'Micro-Frontend Federation',
          question: 'How would you build a micro-frontend shell for Swiggy that loads checkouts and tracking portals independently?',
          followUp: 'Excellent. What strategy would you use to share user authentication tokens and common cart states securely between these federated modules?',
          keywords: ['federation', 'webpack', 'iframe', 'event', 'context', 'storage']
        }
      ];
    }
    return [
      {
        topic: 'Web Performance Optimization',
        question: 'Explain how you optimize load times for large image galleries on slow cellular connections.',
        followUp: 'Good. How do you handle lazy loading placeholder generation, and how would you implement fallback handling if an asset fails to download?',
        keywords: ['lazy', 'placeholder', 'blurhash', 'webp', 'srcset', 'fallback']
      },
      {
        topic: 'API Integration boundaries',
        question: 'Describe your experience configuring strict type boundaries in complex API response layers.',
        followUp: 'Right. How do you handle runtime payload validation (e.g. Zod or runtypes) if the server suddenly sends unexpected nullable fields?',
        keywords: ['type', 'zod', 'validation', 'nullable', 'schema', 'typescript']
      }
    ];
  }

  if (r.includes('product') || r.includes('pm')) {
    return [
      {
        topic: 'UPI Intent Localizations',
        question: 'How would you design a localized UPI payment checkout experience that optimizes for speed and success rates?',
        followUp: 'Interesting. If a specific UPI app has a high failure rate, how would you direct user flow without making the UI feel cluttered or pushy?',
        keywords: ['intent', 'upi', 'success', 'routing', 'latency', 'fallback']
      },
      {
        topic: 'Transaction Retries',
        question: 'How do you design a retry logic policy for failed credit card checkout authorizations?',
        followUp: 'Okay. How do you balance merchant billing safety (preventing double-spend) with candidate UX during automatic retries?',
        keywords: ['retry', 'idempotency', 'lock', 'ledger', 'backoff', 'notification']
      }
    ];
  }

  // Default fallback
  return [
    {
      topic: 'Architectural Scale',
      question: 'How do you approach scaling a distributed service that handles highly concurrent read/write ratios?',
      followUp: 'Understood. How would you handle database lock contention if thousands of users try to update the exact same ledger row concurrently?',
      keywords: ['concurrency', 'lock', 'scale', 'cache', 'redis', 'replica']
    },
    {
      topic: 'Engineering Collaboration',
      question: 'Tell me about a time you handled a feature dispute with a product manager.',
      followUp: 'Nice. How did you verify the final trade-off, and what metrics did you use to evaluate if your technical compromise was successful?',
      keywords: ['compromise', 'metrics', 'communication', 'vitals', 'data', 'collaboration']
    }
  ];
};
