import { useCallback, useState } from 'react';

import { apiClient } from '../lib/apiClient';
import { getToken } from '../lib/apiClient';

export function useSendRequest() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const sendRequest = useCallback(async ({ listingId, hostId, startDate, endDate, message }) => {
    if (!getToken()) {
      const messageText = 'Требуется войти в аккаунт';
      setError(messageText);
      setStatus('error');
      return { error: new Error(messageText) };
    }

    if (!listingId || !hostId) {
      const messageText = 'Не удалось определить объявление или хозяина';
      setError(messageText);
      setStatus('error');
      return { error: new Error(messageText) };
    }

    setStatus('loading');
    setError('');

    try {
      const payload = await apiClient.post('/stays', {
        placeId: listingId,
        hostId,
        checkIn: startDate,
        checkOut: endDate,
        message: message?.trim() || undefined
      });

      setStatus('success');
      return { error: null, requestId: payload?.id ?? null };
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Не удалось отправить заявку';
      setError(messageText);
      setStatus('error');
      return { error: err };
    }
  }, []);

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError('');
  }, []);

  return {
    sendRequest,
    status,
    error,
    resetStatus,
    isLoading: status === 'loading'
  };
}

export default useSendRequest;
