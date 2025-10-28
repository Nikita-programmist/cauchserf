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

      const { data: existingConversation, error: conversationLookupError } = await supabase
        .from('conversations')
        .select('id')
        .eq('host_id', hostId)
        .eq('traveler_id', user.id)
        .maybeSingle();

      if (conversationLookupError) {
        setError(conversationLookupError.message);
        setStatus('error');
        return { error: conversationLookupError };
      }

      let conversationId = existingConversation?.id ?? null;
      const trimmedMessage = message?.trim() ?? '';

      if (!conversationId) {
        const { data: newConversation, error: conversationCreateError } = await supabase
          .from('conversations')
          .insert({
            host_id: hostId,
            traveler_id: user.id
          })
          .select('id')
          .single();

        if (conversationCreateError) {
          if (conversationCreateError.code === '23505') {
            const { data: conflictConversation, error: conflictError } = await supabase
              .from('conversations')
              .select('id')
              .eq('host_id', hostId)
              .eq('traveler_id', user.id)
              .maybeSingle();

            if (conflictError) {
              setError(conflictError.message);
              setStatus('error');
              return { error: conflictError };
            }

            conversationId = conflictConversation?.id ?? null;
          } else {
            setError(conversationCreateError.message);
            setStatus('error');
            return { error: conversationCreateError };
          }
        } else {
          conversationId = newConversation?.id ?? null;
        }
      }

      if (!conversationId) {
        const messageText = 'Не удалось определить беседу.';
        const unknownConversationError = new Error(messageText);
        setError(messageText);
        setStatus('error');
        return { error: unknownConversationError };
      }

      const { error: insertError } = await supabase.from('stay_requests').insert({
        listing_id: listingId,
        host_id: hostId,
        traveler_id: user.id,
        start_date: startDate,
        end_date: endDate,
        message: trimmedMessage || null,
        conversation_id: conversationId
      });

      if (insertError) {
        setError(insertError.message);
        setStatus('error');
        return { error: insertError };
      }

      if (trimmedMessage) {
        const { error: messageInsertError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: user.id,
          text: trimmedMessage
        });

        if (messageInsertError) {
          setError(messageInsertError.message);
          setStatus('error');
          return { error: messageInsertError, conversationId };
        }
      }

      setStatus('success');
      return { error: null, conversationId };
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
