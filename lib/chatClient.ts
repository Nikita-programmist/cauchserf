export async function sendChatMessage(conversationId: string, text: string) {
  const response = await fetch(`/api/conversations/${conversationId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content: text })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to send message' }));
    throw new Error(error.error ?? 'Failed to send message');
  }

  return response.json();
}

export async function markConversationReadClient(conversationId: string) {
  const response = await fetch(`/api/conversations/${conversationId}/read`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to mark read' }));
    throw new Error(error.error ?? 'Failed to mark read');
  }

  return response.json();
}
