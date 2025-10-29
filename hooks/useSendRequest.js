import { useCallback, useState } from 'react';

import { useAuth } from '../components/AuthProvider';

export function useSendRequest() {
  const { supabase, user, hasSupabaseEnv } = useAuth();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const sendRequest = useCallback(
    async ({ listingId, hostId, startDate, endDate, message }) => {
      if (!hasSupabaseEnv || !supabase) {
        const messageText = 'Подключение к Supabase недоступно';
        setError(messageText);
        setStatus('error');
        return { error: new Error(messageText) };
      }

      if (!user?.id) {
        const messageText = 'Требуется войти в аккаунт';
        setError(messageText);
        setStatus('error');
        return { error: new Error(messageText) };
      }

      if (!listingId) {
        const messageText = 'Не удалось определить объявление';
        setError(messageText);
        setStatus('error');
        return { error: new Error(messageText) };
      }

      if (!hostId) {
        const messageText = 'Не удалось определить хозяина объявления';
        setError(messageText);
        setStatus('error');
        return { error: new Error(messageText) };
      }

      setStatus('loading');
      setError('');

      const trimmedMessage = message?.trim() ?? '';

      const { error: insertError } = await supabase.from('stay_requests').insert({
        listing_id: listingId,
        host_id: hostId,
        traveler_id: user.id,
        start_date: startDate,
        end_date: endDate,
        message: trimmedMessage || null
      });

      if (insertError) {
        setError(insertError.message);
        setStatus('error');
        return { error: insertError };
      }

      let roomId = null;

      try {
        const response = await fetch(`/api/chat/room?otherUserId=${hostId}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const payload = await response.json();
          roomId = payload?.roomId ?? null;
        } else {
          const payload = await response.json().catch(() => null);
          console.error('Не удалось получить комнату чата', payload?.error);
        }
      } catch (ensureError) {
        console.error('Ошибка при создании чата', ensureError);
      }

      if (trimmedMessage && roomId) {
        const sendResponse = await fetch('/api/chat/messages', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, text: trimmedMessage })
        });

        if (!sendResponse.ok) {
          const payload = await sendResponse.json().catch(() => null);
          const messageText = payload?.error || 'Не удалось отправить сообщение хозяину.';
          setError(messageText);
          setStatus('error');
          return { error: new Error(messageText) };
        }
      }

      setStatus('success');
      return { error: null, roomId };
    },
    [hasSupabaseEnv, supabase, user]
  );

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
