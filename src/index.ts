import type { Rule } from './lib/parse.ts';

import parse from './lib/parse.ts';

export default (txt: string) => {
  const rules = parse(txt);
  const filter = (predicate: (rule: Rule) => boolean) => rules
    .filter(predicate)
    .sort((a, b) => {
      if (a.pattern.length === b.pattern.length) {
        if (a.type === 'allow') return -1;
        if (b.type === 'allow') return 1;
        return 0;
      }

      return b.pattern.length - a.pattern.length;
    });

  return (ua: string) =>
    (url: string): boolean => {
      const specific = filter(rule =>
        ua !== '' &&
        rule.ua.toLocaleLowerCase().includes(ua.toLocaleLowerCase())
      );

      for (const rule of specific) {
        if (new RegExp(rule.pattern).test(url)) {
          if (rule.type === 'allow') return true;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (rule.type === 'disallow') return false;
        }
      }

      if (specific.length > 0) return true;

      for (const rule of filter(rule => rule.ua === '*')) {
        if (new RegExp(rule.pattern).test(url)) {
          if (rule.type === 'allow') return true;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (rule.type === 'disallow') return false;
        }
      }

      return true;
    };
};
