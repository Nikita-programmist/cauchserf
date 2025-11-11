"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center text-slate-700">
        <div className="flex max-w-md flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Что-то пошло не так</h1>
          <p className="text-sm text-slate-600">
            Попробуйте обновить страницу. Если ошибка повторяется, свяжитесь с поддержкой и укажите код: {error.digest ?? "—"}.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Повторить
        </button>
      </body>
    </html>
  );
}
