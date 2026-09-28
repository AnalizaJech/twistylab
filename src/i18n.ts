import { useSettingsStore } from './stores';
import spanish from './locales/es.json';
export type Locale = 'es' | 'en';
export function translate(text: string, locale: Locale): string {
  return locale === 'es' ? ((spanish as Record<string, string>)[text] ?? text) : text;
}
export function useI18n() {
  const locale = useSettingsStore((s) => s.settings.locale);
  return {
    locale,
    t: (text: string, values?: Record<string, string | number>) =>
      translate(text, locale).replace(/\{(\w+)\}/g, (match, key: string) =>
        String(values?.[key] ?? match),
      ),
    dateLocale: locale === 'es' ? 'es-CO' : 'en-US',
  };
}
