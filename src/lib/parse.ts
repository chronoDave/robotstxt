export type Rule = {
  ua: string;
  type: 'allow' | 'disallow';
  pattern: string;
};

/** Parse robots.txt file */
export default (x: string): Rule[] => {
  const rules: Rule[] = [];

  /**
   * Allow multiple UA declaration:
   * 
   * user-agent: a
   * user-agent: b
   * disallow: /
   */
  const uas = new Set<string>();
  let open = false;

  x.split(/\r?\n/).forEach(line => {
    const match = /([^:]+)\s*:\s*(.*)/.exec(line);
    if (!match) return;

    const action = match[1].toLowerCase();

    if (action === 'user-agent' && /^[a-zA-Z-_]+$/.test(match[2])) {
      /**
       * user-agent: a
       * disallow: /
       * user-agent: b <= New block
       */
      if (open) uas.clear();
      open = false;

      uas.add(match[2]);
    }

    if (action === 'allow' || action === 'disallow') {
      open = true;

      uas.forEach(ua => {
        const rule: Rule = { ua, type: action, pattern: encodeURI(match[2]).replaceAll('%25', '%') };

        if (rules.some(x =>
          x.ua === rule.ua &&
          x.type === rule.type &&
          x.pattern === rule.pattern
        )) return;

        rules.push(rule);
      });
    }
  });

  return rules;
};