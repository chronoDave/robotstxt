import parse from './lib/parse.ts';

export default (txt: string) => {
  const rules = parse(txt);

  return (ua: string) =>
    (url: string): boolean => {
      const filtered = rules
        .filter(rule =>
          rule.ua === '*' ||
          // eslint-disable-next-line @stylistic/ts/no-extra-parens
          (
            ua !== '' &&
            rule.ua.toLocaleLowerCase().includes(ua.toLocaleLowerCase())
          )
        )
        .sort((a, b) => {
          if (a.pattern.length === b.pattern.length) {
            if (a.type === 'allow') return -1;
            if (b.type === 'allow') return 1;
            return 0;
          }

          return b.pattern.length - a.pattern.length;
        });

      for (const rule of filtered) {
        const pattern = rule.pattern
          .replaceAll('/', '\\/')
          .replaceAll('?', '\\?')
          .replaceAll('.', '\\.');

        if (new RegExp(pattern).test(url)) {
          if (rule.type === 'allow') return true;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (rule.type === 'disallow') return false;
        }
      }

      return true;
    };
};
