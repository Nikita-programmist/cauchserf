import { Button } from './ui/button';
import { HOME } from '../content/home';

export function Hero() {
  return (
    <section className="relative isolate mt-16 flex justify-center">
      <div className="flex w-full max-w-2xl flex-col gap-6 text-left">
        <span className="inline-flex items-center self-start rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-fg/80 shadow-sm">
          Добро пожаловать в Домик
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">{HOME.heroTitle}</h1>
        <p className="text-base text-fg/80 sm:text-lg">{HOME.heroSubtitle}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="solid" className="shadow-glass">
            {HOME.ctaPrimary}
          </Button>
          <Button variant="ghost">{HOME.ctaSecondary}</Button>
        </div>
        <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[{ label: 'Хозяева', value: '4 500+' }, { label: 'Городов', value: '120' }, { label: 'Путешественники', value: '32 000+' }, { label: 'Отзывов', value: '18 500' }].map((item) => (
            <div key={item.label} className="glass rounded-2xl px-4 py-3 text-left">
              <dt className="text-xs uppercase text-muted">{item.label}</dt>
              <dd className="text-lg font-semibold text-fg">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
