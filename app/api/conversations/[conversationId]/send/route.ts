import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// Если есть утилита current user — подключи/используй, иначе закомментируй проверку

export async function POST(req: Request, { params }: { params: { conversationId: string } }) {
  const supabase = createClient();
  const { conversationId } = params;
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId param is required" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const content = body?.content;
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  // Определяем имя связочной колонки динамически
  async function insertBy(col: "conversation_id" | "room_id") {
    return supabase
      .from("chat_messages")
      .insert([{ [col]: conversationId, content }])
      .select()
      .single();
  }

  let { data, error } = await insertBy("conversation_id");
  if (error && /column .*conversation_id/i.test(error.message)) {
    ({ data, error } = await insertBy("room_id"));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 200 });
}
