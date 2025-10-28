import { cn } from '../lib/utils';
import { Button } from './ui/button';

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isSending = false,
  placeholder = 'Напишите сообщение',
  error = '',
  className
}) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-4 backdrop-blur-sm',
        className
      )}
    >
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-3 text-sm text-fg placeholder:text-fg/40 focus:border-white/60 focus:outline-none"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button type="submit" disabled={disabled || !value.trim()} className="self-end">
        {isSending ? 'Отправляем…' : 'Отправить'}
      </Button>
    </form>
  );
}

export default ChatInput;
