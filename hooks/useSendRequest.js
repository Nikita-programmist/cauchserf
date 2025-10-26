import { useCallback, useState } from 'react';

import { useAuth } from '../components/AuthProvider';

export function useSendRequest() {
  const { supabase, user, hasSupabaseEnv } = useAuth();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const sendRequest = useCallback(
    async ({ hostId, listingTitle, startDate, endDate, message }) => {
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

      if (!hostId) {
        const messageText = 'Не удалось определить хозяина объявления';
        setError(messageText);
        setStatus('error');
        return { error: new Error(messageText) };
      }

      setStatus('loading');
      setError('');

      const { error: insertError } = await supabase.from('requests').insert({
        host_id: hostId,
        guest_id: user.id,
        listing_title: listingTitle || null,
        start_date: startDate,
        end_date: endDate,
        message: message?.trim() || null
      });

      if (insertError) {
        setError(insertError.message);
        setStatus('error');
        return { error: insertError };
      }

      setStatus('success');
      return { error: null };
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
