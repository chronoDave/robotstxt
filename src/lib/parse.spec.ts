import test from 'node:test';
import assert from 'node:assert/strict';

import parse from './parse.ts';

const txt = (...lines: string[]) => lines.join('\n');

test('[parse] splits newlines', () => {
  const rules = parse([
    'user-agent: Abc\n',
    'allow: /\r\n',
    'disallow: /\n',
    'allow: /a'
  ].join(''));

  assert.equal(rules.length, 3);
});

test('[parse] commands are case-insensitive', () => {
  const rules = parse([
    'User-Agent: Abc\n',
    'ALLOW: /\r\n',
    'disAllow: /\n',
    'allow: /a'
  ].join(''));

  assert.equal(rules.length, 3);
});

test('[parse] ignores invalid commands', () => {
  const rules = parse(txt(
    'user-agent: Abc',
    'disallow: /',
    'allow: /abc',
    'foo: Bar',
    'baz: /'
  ));

  assert.equal(rules.length, 2);
});

test('[parse] parses groups', () => {
  const rules = parse(txt(
    'user-agent: A',
    'allow: /',
    'user-agent: B',
    'disallow: /',
    'foo: bar',
    'allow: /abc'
  ));

  assert.equal(rules.length, 3);
  assert.notEqual(rules[0].ua, rules[2].ua);
});

test('[parse] removes duplicate statements', () => {
  const rules = parse(txt(
    'user-agent: A',
    'user-agent: A',
    'allow: /',
    'user-agent: A',
    'allow: /',
    'user-agent: A',
    'disallow: /'
  ));

  assert.equal(rules.length, 2);
});

test('[parse] ignores invalid user agents', () => {
  const rules = parse(txt(
    'user-agent: *',
    'user-agent: A',
    'user-agent: A-B',
    'user-agent: A_B',
    'user-agent: ',
    'user-agent: ツ',
    'user-agent: a*',
    'user-agent:  a ',
    'user-agent: a/2.1',
    'user-agent: A B',
    'disallow: /'
  ));

  assert.equal(rules.length, 4);
  assert.equal(rules[0].ua, '*');
});

test('[parse] encodes patterns', () => {
  const rules = parse(txt(
    'user-agent: A',
    'allow: /ツ',
    'allow: /%E3%83%84'
  ));

  assert.equal(rules.length, 1);
  assert.equal(rules[0].pattern, '\\/%E3%83%84');
});
