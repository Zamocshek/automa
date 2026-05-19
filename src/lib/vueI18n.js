import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n/dist/vue-i18n.esm-bundler';
import { supportLocales } from '@/utils/shared';
import dayjs from './dayjs';

const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en',
});

export function normalizeLocale(locale) {
  const fallbackLocale = 'ru';
  const normalized = `${locale || ''}`.trim();
  const lowerLocale = normalized.toLowerCase();

  const exactLocale = supportLocales.find(({ id }) => id === normalized);
  if (exactLocale) return exactLocale.id;

  const matchedLocale = supportLocales.find(({ id }) => {
    const lowerId = id.toLowerCase();

    return (
      lowerId === lowerLocale ||
      lowerLocale.startsWith(`${lowerId}-`) ||
      lowerId.startsWith(`${lowerLocale}-`) ||
      lowerId.split('-')[0] === lowerLocale.split('-')[0]
    );
  });

  return matchedLocale?.id || fallbackLocale;
}

export function setI18nLanguage(locale) {
  const normalizedLocale = normalizeLocale(locale);

  i18n.global.locale.value = normalizedLocale;

  document.querySelector('html').setAttribute('lang', normalizedLocale);
}

export async function loadLocaleMessages(locale, location) {
  const normalizedLocale = normalizeLocale(locale);
  const isLocaleSupported = supportLocales.some(
    ({ id }) => id === normalizedLocale
  );

  if (!isLocaleSupported) {
    console.error(`${locale} locale is not supported`);

    return null;
  }

  const importLocale = async (path, merge = false) => {
    try {
      const messages = await import(
        /* webpackChunkName: "locales/locale-[request]" */ `../locales/${normalizedLocale}/${path}`
      );

      if (merge) {
        i18n.global.mergeLocaleMessage(normalizedLocale, messages.default);
      } else {
        i18n.global.setLocaleMessage(normalizedLocale, messages.default);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (
    normalizedLocale !== 'en' &&
    !i18n.global.availableLocales.includes('en')
  ) {
    await loadLocaleMessages('en', location);
  }

  dayjs.locale(normalizedLocale);

  await importLocale('common.json');
  await importLocale('popup.json', true);
  await importLocale(`${location}.json`, true);
  await importLocale('blocks.json', true);

  return nextTick();
}

export default i18n;
