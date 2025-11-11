import { useCallback, useEffect, useRef, useState } from 'react';

function useSWR(key, fetcher, options = {}) {
  const isMounted = useRef(true);
  const [data, setData] = useState();
  const [error, setError] = useState();
  const [isValidating, setIsValidating] = useState(false);

  const shouldFetch = key != null && key !== false;

  const revalidate = useCallback(async () => {
    if (!shouldFetch) {
      return;
    }

    setIsValidating(true);
    try {
      const result = await fetcher(key);
      if (!isMounted.current) return;
      setData(result);
      setError(undefined);
    } catch (err) {
      if (!isMounted.current) return;
      setError(err);
    } finally {
      if (isMounted.current) {
        setIsValidating(false);
      }
    }
  }, [fetcher, key, shouldFetch]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!shouldFetch) {
      setData(undefined);
      setError(undefined);
      setIsValidating(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setIsValidating(true);
      try {
        const result = await fetcher(key);
        if (!isMounted.current || cancelled) return;
        setData(result);
        setError(undefined);
      } catch (err) {
        if (!isMounted.current || cancelled) return;
        setError(err);
      } finally {
        if (isMounted.current && !cancelled) {
          setIsValidating(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetcher, key, shouldFetch]);

  const mutate = useCallback(
    async (updater, opts = {}) => {
      if (typeof updater === 'function') {
        setData((prev) => updater(prev));
        if (opts.revalidate !== false) {
          await revalidate();
        }
        return;
      }

      if (updater !== undefined) {
        setData(updater);
        if (opts.revalidate !== false) {
          await revalidate();
        }
        return;
      }

      await revalidate();
    },
    [revalidate]
  );

  return { data, error, isValidating, mutate };
}

export default useSWR;
