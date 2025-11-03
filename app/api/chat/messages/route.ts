import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);

  // Принимаем и conversationId, и roomId (на случай легаси)
  const id = searchParams.get("conversationId") ?? searchParams.get("roomId");
  if (!id) {
    return NextResponse.json({ error: "conversationId (or roomId) is required" }, { status: 400 });
  }

  // Пытаемся сначала по conversation_id, если колонки нет — пробуем room_id
  async function fetchBy(col: "conversation_id" | "room_id") {
    return supabase
      .from("chat_messages")
      .select("*")
      .eq(col, id)
      .order("created_at", { ascending: true });
  }

  let { data, error } = await fetchBy("conversation_id");
  if (error && /column .*conversation_id/i.test(error.message)) {
    ({ data, error } = await fetchBy("room_id"));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] }, { status: 200 });
}
