var parse = (x) => {
  const rules = [];
  const uas = /* @__PURE__ */ new Set();
  let open = false;
  x.split(/\r?\n/).forEach((line) => {
    const match = /([^:]+)\s*:\s*(.*)/.exec(line);
    if (!match) return;
    const action = match[1].toLowerCase();
    if (action === "user-agent" && /^([a-zA-Z-_]+|\*)$/.test(match[2])) {
      if (open) uas.clear();
      open = false;
      uas.add(match[2]);
    }
    if (action === "allow" || action === "disallow") {
      open = true;
      uas.forEach((ua) => {
        const rule = {
          ua,
          type: action,
          pattern: encodeURI(match[2]).replaceAll("%25", "%").replaceAll(/[\/\?\.]/g, "\\$&").replaceAll("*", ".*")
        };
        if (rules.some(
          (x2) => x2.ua === rule.ua && x2.type === rule.type && x2.pattern === rule.pattern
        )) return;
        rules.push(rule);
      });
    }
  });
  return rules;
};

var index = (txt) => {
  const rules = parse(txt);
  const filter = (predicate) => rules.filter(predicate).sort((a, b) => {
    if (a.pattern.length === b.pattern.length) {
      if (a.type === "allow") return -1;
      if (b.type === "allow") return 1;
      return 0;
    }
    return b.pattern.length - a.pattern.length;
  });
  return (ua) => (url) => {
    const specific = filter(
      (rule) => ua !== "" && rule.ua.toLocaleLowerCase().includes(ua.toLocaleLowerCase())
    );
    for (const rule of specific) {
      if (new RegExp(rule.pattern).test(url)) {
        if (rule.type === "allow") return true;
        if (rule.type === "disallow") return false;
      }
    }
    if (specific.length > 0) return true;
    for (const rule of filter((rule2) => rule2.ua === "*")) {
      if (new RegExp(rule.pattern).test(url)) {
        if (rule.type === "allow") return true;
        if (rule.type === "disallow") return false;
      }
    }
    return true;
  };
};

export { index as default };
