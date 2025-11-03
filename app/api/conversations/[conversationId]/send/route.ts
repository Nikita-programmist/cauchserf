import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// Если есть утилита current user — подключи/используй, иначе закомментируй проверку

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  const supabase = createClient();
  const { conversationId } = params;
  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId param is required" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const rawContent =
    typeof body?.content === "string" ? body.content.trim() : "";

  if (!rawContent) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const attempts: Array<{
    conversationKey: "conversation_id" | "room_id";
    userKey: "sender_id" | "user_id" | "author_id";
  }> = [
    { conversationKey: "conversation_id", userKey: "sender_id" },
    { conversationKey: "conversation_id", userKey: "user_id" },
    { conversationKey: "conversation_id", userKey: "author_id" },
    { conversationKey: "room_id", userKey: "sender_id" },
    { conversationKey: "room_id", userKey: "user_id" },
    { conversationKey: "room_id", userKey: "author_id" },
  ];

  let lastError: { message: string } | null = null;

  for (const attempt of attempts) {
    const payload: Record<string, string> = {
      content: rawContent,
      [attempt.conversationKey]: conversationId,
      [attempt.userKey]: user.id,
    };

    const { data, error } = await supabase
      .from("chat_messages")
      .insert(payload)
      .select()
      .single();

    if (!error) {
      return NextResponse.json({ message: data }, { status: 200 });
    }

    lastError = error;

    if (!error.message?.toLowerCase().includes("column")) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: lastError?.message ?? "Failed to send message" },
    { status: 500 }
  );
}
