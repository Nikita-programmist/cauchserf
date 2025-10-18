import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Textarea } from './ui/textarea';
import { HOME } from '../content/home';

const demoHosts = [
  'Алексей из Сочи',
  'Мария из Санкт-Петербурга',
  'Тимур из Казани'
];

export function Hero() {
  const [selectedHost, setSelectedHost] = useState(demoHosts[0]);

  return (
    <section className="relative isolate mt-16 flex flex-col gap-12 lg:flex-row lg:items-center">
      <div className="flex-1 space-y-6 text-center lg:text-left">
        <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-fg/80 shadow-sm">
          Добро пожаловать в Домик
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">{HOME.heroTitle}</h1>
        <p className="text-base text-fg/80 sm:text-lg">{HOME.heroSubtitle}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
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
      <div className="flex-1">
        <Card className="glass-strong mx-auto max-w-md border border-white/20 p-0">
          <CardHeader className="border-b border-white/10 p-6">
            <CardTitle>Смарт-поиск Домика</CardTitle>
            <CardDescription>
              Выберите направление и познакомьтесь с хозяевами, которые готовы поделиться своим домом.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="destination" className="mb-1 block text-sm font-medium text-fg/90">
                  Куда поедем?
                </label>
                <Input id="destination" placeholder="Например, Владивосток" />
              </div>
              <div>
                <label htmlFor="host" className="mb-1 block text-sm font-medium text-fg/90">
                  Хозяин
                </label>
                <Select id="host" value={selectedHost} onChange={(event) => setSelectedHost(event.target.value)}>
                  {demoHosts.map((host) => (
                    <option key={host}>{host}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-fg/90">
                  Сообщение
                </label>
                <Textarea id="message" placeholder="Расскажите пару слов о себе" />
              </div>
              <Button type="button" variant="solid" className="w-full">
                Отправить заявку
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
