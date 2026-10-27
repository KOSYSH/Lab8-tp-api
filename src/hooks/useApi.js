import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export function useApi(url, options = { client: 'fetch' }) {
  const client = options.client || 'fetch';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  const inFlight = useRef(false);

  const fetchData = useCallback(() => {
    if (inFlight.current) return;

    inFlight.current = true;
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    const request = client === 'axios'
      ? axios.get(url).then(response => response.data)
      : fetch(url).then(response => {
        if (!response.ok) throw new Error('Erreur réseau');
        return response.json();
      });

    return request
      .then(result => {
        if (id === requestId.current) setData(result);
      })
      .catch(err => {
        if (id === requestId.current) setError(err.message);
      })
      .finally(() => {
        if (id === requestId.current) {
          inFlight.current = false;
          setLoading(false);
        }
      });
  }, [url, client]);

  useEffect(() => {
    fetchData();

    return () => {
      // Une ancienne réponse ne doit pas remplacer les données de la nouvelle URL.
      requestId.current += 1;
      inFlight.current = false;
    };
  }, [fetchData]);

  return { data, loading, error, reload: fetchData };
}
