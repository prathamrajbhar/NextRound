import { useState, useEffect } from 'react';

export interface CitySuggestion {
  id: string;
  name: string;
  state?: string;
  country?: string;
  formatted: string;
}

interface OpenMeteoItem {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
}

interface OpenMeteoResponse {
  results?: OpenMeteoItem[];
}

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
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`,
          { signal: abortController.signal }
        );

        if (!response.ok) {
          throw new Error(`City search failed (${response.status})`);
        }

        const data: OpenMeteoResponse = await response.json();
        const items = data.results || [];

        const suggestions: CitySuggestion[] = items.map((item) => {
          const parts = [item.name, item.admin1, item.country].filter(Boolean);
          return {
            id: String(item.id),
            name: item.name,
            state: item.admin1,
            country: item.country,
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
