import parse from './lib/parse.ts';

export default (txt: string) => {
  const rules = parse(txt);

  return (ua: string) =>
    (url: string): boolean => {
      const filtered = rules
        .filter(rule =>
          ua !== '' &&
          rule.ua.toLocaleLowerCase().includes(ua.toLocaleLowerCase())
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
        if (new RegExp(rule.pattern).test(url)) {
          if (rule.type === 'allow') return true;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (rule.type === 'disallow') return false;
        }
      }

      if (filtered.length > 0) return true;
      return rules
        .filter(rule => rule.ua === '*' && rule.type === 'disallow')
        .every(rule => !new RegExp(rule.pattern).test(url));
    };
};
