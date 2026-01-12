import test from 'node:test';
import assert from 'node:assert/strict';

import robots from './index.ts';

const txt = (...lines: string[]) => lines.join('\n');

/**
 * This file tests against Google's `robotstxt/robot_test.cc`,
 * which tests against the current Robots Exclusion Protocol (REP) RFC
 * 
 * @see https://github.com/google/robotstxt/blob/master/robots_test.cc
 * @see https://www.rfc-editor.org/rfc/rfc9309.html
*/

/**
 * Rules are colon separated name-value pairs. The following names are provisioned:
 * 
 *  - user-agent: <value>
 *  - allow: <value>
 *  - disallow: <value>
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.1
 */
test('[robots] ID_LineSyntax_Line', () => {
  const allowed = robots(txt(
    'user-agent: FooBot',
    'disallow: /',

    'foo: BarBot',
    'bar: /'
  ));

  assert.ok(!allowed('FooBot')('/x/y'));
  assert.ok(allowed('BarBot')('/x/y'));
});

/**
 * A group is one or more user-agent line followed by rules,
 * and terminated by a another user-agent line. Rules for
 * same user-agents are combined opaquely into one group.
 * Rules outside groups are ignored.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.1
 */
test('[robots] ID_LineSyntax_Groups', () => {
  const allowed = robots(txt(
    'Allow: /foo/bar/',
    '',
    'User-agent: FooBot',
    'Disallow: /',
    'Allow: /x/',
    'User-agent: BarBot',
    'Disallow: /',
    'Allow: /y/',
    '',
    '',
    'Allow: /w/',
    'User-agent: BazBot',
    '',
    'User-agent: FooBot',
    'Allow: /z/',
    'Disallow: /'
  ));

  assert.ok(allowed('FooBot')('/x/b'));
  assert.ok(allowed('FooBot')('/z/d'));
  assert.ok(!allowed('FooBot')('/y/c'));
  assert.ok(allowed('BarBot')('/y/c'));
  assert.ok(allowed('BarBot')('/w/a'));
  assert.ok(!allowed('BarBot')('/z/d'));
  assert.ok(allowed('BazBot')('/z/d'));

  assert.ok(!allowed('FooBot')('/foo/bar/'));
  assert.ok(!allowed('BarBot')('/foo/bar/'));
  assert.ok(!allowed('BazBot')('/foo/bar/'));
});

/**
 * Group must not be closed by rules not explicitly defined in the REP RFC.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.1
 */
test('[robots] ID_LineSyntax_Groups_OtherRules', () => {
  const allowed = robots(txt(
    'User-agent: BarBot',
    'Sitemap: https://foo.bar/sitemap',
    'User-agent: *',
    'Disallow: /',

    'User-agent: FooBot',
    'Invalid-Unknown-Line: unknown',
    'User-agent: *',
    'Disallow: /'
  ));

  assert.ok(!allowed('FooBot')('/'));
  assert.ok(!allowed('BarBot')('/'));

  assert.ok(!allowed('FooBot')('/'));
  assert.ok(!allowed('BarBot')('/'));
});

/**
 * REP lines are case insensitive
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.1
 */
test('[robots] ID_REPLineNamesCaseInsensitive', () => {
  const allowed = robots(txt(
    'USER-AGENT: FooBot',
    'ALLOW: /x/',
    'DISALLOW: /',

    'user-agent: BarBot',
    'allow: /x/',
    'disallow: /',

    'uSeR-aGeNt: QuzBot',
    'AlLoW: /x/',
    'dIsAlLoW: /'
  ));

  assert.ok(allowed('FooBot')('/x/y'));
  assert.ok(allowed('BarBot')('/x/y'));
  assert.ok(allowed('QuzBot')('/x/y'));

  assert.ok(!allowed('FooBot')('/a/b'));
  assert.ok(!allowed('BarBot')('/a/b'));
  assert.ok(!allowed('QuzBot')('/a/b'));
});

/**
 * A user-agent line is expected to contain only [a-zA-Z_-] characters
 * and must not be empty.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1
 */
test('[robots] ID_VerifyValidUserAgentsToObey', () => {
  const allowed = robots(txt(
    'User-agent: Foobot',
    'User-agent: Foobot-Bar',
    'User-agent: Foo_Bar',
    'User-agent: ',
    'User-agent: ツ',
    'User-agent: Foobot*',
    'User-agent:  Foobot ',
    'User-agent: Foobot/2.1',
    'User-agent: Foobot Bar',
    'Disallow: /'
  ));

  assert.ok(!allowed('Foobot')('/'));
  assert.ok(!allowed('Foobot-Bar')('/'));
  assert.ok(!allowed('Foo_Bar')('/'));

  assert.ok(allowed('')('/'));
  assert.ok(allowed('ツ')('/'));
  assert.ok(allowed('Foobot*')('/'));
  assert.ok(allowed(' Foobot ')('/'));
  assert.ok(allowed('Foobot/2.1')('/'));
  assert.ok(allowed('Foobot Bar')('/'));
});

/**
 * User-agent line values are case insensitive.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1
 */
test('[robots] ID_UserAgentValueCaseInsensitive', () => {
  const allowed = robots(txt(
    'User-Agent: FOOBAR',
    'Allow: /x/',
    'Disallow: /',

    'User-Agent: foobar',
    'Allow: /x/',
    'Disallow: /',

    'User-Agent: FoObAr',
    'Allow: /x/',
    'Disallow: /'
  ));

  assert.ok(allowed('Foo')('/x/y'));
  assert.ok(allowed('Foo')('/x/y'));
  assert.ok(allowed('Foo')('/x/y'));

  assert.ok(!allowed('Foo')('/a/b'));
  assert.ok(!allowed('Foo')('/a/b'));
  assert.ok(!allowed('Foo')('/a/b'));

  assert.ok(allowed('foo')('/x/y'));
  assert.ok(allowed('foo')('/x/y'));
  assert.ok(allowed('foo')('/x/y'));

  assert.ok(!allowed('foo')('/a/b'));
  assert.ok(!allowed('foo')('/a/b'));
  assert.ok(!allowed('foo')('/a/b'));
});

/**
 * If no group matches the user-agent, crawlers must obey
 * the first group with a user-agent line with a '*' value,
 * if present. If no group satisfies either condition,
 * or no groups are present at all, no rules apply.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1
 */
test('[robots] ID_GlobalGroups_Secondary', async t => {
  await t.test('empty', () => {
    const allowed = robots(txt());

    assert.ok(allowed('FooBot')('/x/y'));
  });

  await t.test('global', () => {
    const allowed = robots(txt(
      'user-agent: *',
      'allow: /',
      'user-agent: FooBot',
      'disallow: /'
    ));

    assert.ok(!allowed('FooBot')('/x/y'));
    assert.ok(allowed('BarBot')('/x/y'));
  });

  await t.test('specific', () => {
    const allowed = robots(txt(
      'user-agent: FooBot',
      'allow: /',
      'user-agent: BarBot',
      'disallow: /',
      'user-agent: BazBot',
      'disallow: /'
    ));

    assert.ok(allowed('QuxBot')('/x/y'));
  });
});

/**
 * Matching rules against URIs is case sensitive.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2
 */
test('[robots] ID_AllowDisallow_Value_CaseSensitive', () => {
  const allowed = robots(txt(
    'user-agent: FooBot',
    'disallow: /x/',

    'user-agent: BarBot',
    'disallow: /X/'
  ));

  assert.ok(!allowed('FooBot')('/x/y'));
  assert.ok(allowed('BarBot')('/x/y'));
});

/**
 * The most specific match found MUST be used. The most
 * specific match is the match that has the most octets.
 * In case of multiple rules with the same length,
 * the least strict rule must be used.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2
 */
test('[robots] ID_LongestMatch', async t => {
  /** The most specific match is the match that has the most octets.*/
  await t.test('longest', () => {
    const allowed = robots(txt(
      'user-agent: FooBot',
      'allow: /page',
      'disallow: /*.html',
      'user-agent: BarBot',
      'allow: /x/page.',
      'disallow: /*.html'
    ));

    assert.ok(!allowed('FooBot')('/page.html')); // No match, as `disallow: /*.html` is longer (7 > 5)
    assert.ok(allowed('FooBot')('/page'));
    assert.ok(allowed('BarBot')('/x/page.html')); // Matches, as `allow: /x/page.` is longer (8 > 7)
    assert.ok(!allowed('BarBot')('/x/y.html'));
  });

  /** The most specific match found MUST be used. */
  await t.test('most specific', () => {
    const allowed = robots(txt(
      'User-agent: *',
      'Disallow: /x/',
      'User-agent: FooBot',
      'Disallow: /y/'
    ));

    assert.ok(allowed('FooBot')('/x/page')); // Matches, as `Disallow: /y/` is more specific
    assert.ok(!allowed('FooBot')('/y/page'));
  });

  /** In case of equivalent disallow and allow patterns for the same user-agent, allow is used. */
  await t.test('equivalent', () => {
    const allowed = robots(txt(
      'user-agent: FooBot',
      'allow: /a',
      'disallow: /a',

      'user-agent: BarBot',
      'disallow: /x/page.html',
      'allow: /x/page.html',

      'user-agent: BazBot',
      'disallow: /a'
    ));

    assert.ok(allowed('FooBot')('/a')); // Match, as `allow` and `disallow` are equal
    assert.ok(allowed('BarBot')('/x/page.html'));
    assert.ok(!allowed('BazBot')('/a')); // No match, as `allow` and `disallow` are not in the same UA group
  });
});

/**
 * Octets in the URI and robots.txt paths outside the range of the US-ASCII coded character set,
 * and those in the reserved range defined by RFC3986, MUST be percent-encoded
 * as defined by RFC3986 prior to comparison.
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2
 */
test('[robots] ID_Encoding', () => {
  const allowed = robots(txt(
    'user-agent: FooBot',
    'disallow: /',
    'allow: /foo/bar?qux=taz&baz=http://foo.bar?tar&par',
    'allow: /foo/bar/ツ',
    'allow: /foo/bar/%E3%83%84',
    'allow: /foo/bar/%62%61%7A'
  ))('FooBot');

  assert.ok(allowed('/foo/bar?qux=taz&baz=http://foo.bar?tar&par'));
  assert.ok(allowed('/foo/bar/%E3%83%84'));
  assert.ok(!allowed('/foo/bar/ツ')); // Not encoded
  assert.ok(!allowed('/foo/bar/baz')); // Unreserved
  assert.ok(allowed('/foo/bar/%62%61%7A'));
});

/**
 * The REP RFC defines the following characters that have special meaning in robots.txt:
 * 
 *  - `#`, inline comment
 *  - `$`, end of pattern
 *  - `*`, any number of characters
 * 
 * @see https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.3
 */
test('[robots] ID_SpecialCharacters', () => {
  const allowed = robots(txt(
    'User-agent: FooBot',
    'Disallow: /foo/bar/quz',
    'Allow: /foo/*/qux',

    'User-agent: BarBot',
    'Disallow: /foo/bar$',
    'Allow: /foo/bar/qux',

    'User-agent: QuzBot',
    '# Disallow: /',
    'Disallow: /foo/quz#qux',
    'Allow: /'
  ));

  assert.ok(!allowed('FooBot')('/foo/bar/quz'));
  assert.ok(allowed('FooBot')('/foo/quz'));
  assert.ok(allowed('FooBot')('/foo//quz'));
  assert.ok(allowed('FooBot')('/foo/bax/quz'));

  assert.ok(!allowed('BarBot')('/foo/bar'));
  assert.ok(allowed('BarBot')('/foo/bar/qux'));
  assert.ok(allowed('BarBot')('/foo/bar/'));
  assert.ok(allowed('BarBot')('/foo/bar/baz'));

  assert.ok(allowed('QuzBot')('/foo/bar'));
  assert.ok(allowed('QuzBot')('/foo/quz'));
});
