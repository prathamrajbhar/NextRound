import { useState, useEffect } from 'react';

export interface CitySuggestion {
  id: string;
  name: string;
  state?: string;
  country?: string;
  countryCode?: string;
  formatted: string;
}

interface OpenMeteoItem {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  country_code?: string;
}

interface OpenMeteoResponse {
  results?: OpenMeteoItem[];
}

// Major / top tech & hiring countries
const TOP_COUNTRY_CODES = new Set([
  'US', // United States
  'IN', // India
  'JP', // Japan
  'GB', // United Kingdom
  'CA', // Canada
  'DE', // Germany
  'SG', // Singapore
  'AU', // Australia
  'FR', // France
  'NL', // Netherlands
  'AE', // United Arab Emirates
  'IE', // Ireland
  'CH', // Switzerland
  'SE', // Sweden
  'IL', // Israel
]);

export function useCitySearch(query: string, delayMs = 300) {
  const [results, setResults] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        // Fetch up to 20 results so filtering to top countries leaves high-quality matches
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=20&language=en&format=json`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error(`City search failed (${response.status})`);
        }

        const data: OpenMeteoResponse = await response.json();
        const items = data.results || [];

        const suggestions: CitySuggestion[] = items
          .filter((item) => {
            const code = item.country_code ? item.country_code.toUpperCase() : '';
            return TOP_COUNTRY_CODES.has(code);
          })
          .slice(0, 8)
          .map((item) => {
            const parts = [item.name, item.admin1, item.country].filter(Boolean);
            return {
              id: String(item.id),
              name: item.name,
              state: item.admin1,
              country: item.country,
              countryCode: item.country_code?.toUpperCase(),
              formatted: parts.join(', '),
            };
          });

        setResults(suggestions);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Error fetching cities');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, delayMs);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query, delayMs]);

  return { results, isLoading, error };
}
