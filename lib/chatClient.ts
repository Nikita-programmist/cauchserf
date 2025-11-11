export async function sendChatMessage(conversationId: string, text: string) {
  const response = await fetch(`/api/conversations/${conversationId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error ?? 'Failed to send message');
  }

  return response.json();
}

export async function markConversationReadClient(conversationId: string) {
  console.warn('markConversationReadClient is deprecated. Conversation id:', conversationId);
  return { ok: true };
}
