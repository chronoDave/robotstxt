<div align="center">
  <h1>@chronocide/robots-txt</h1>
  <p>Tiny robots.txt parser and matcher</p>
</div>

<div align="center">
  <a href="/LICENSE">
    <img alt="License AGPLv3" src="https://img.shields.io/badge/license-AGPLv3-blue.svg" />
  </a>
  <img alt="Bundle size" src="https://img.shields.io/bundlejs/size/%40chronocide%2Frobots-txt">
  <a href="https://www.npmjs.com/package/@chronocide/robots-txt">
    <img alt="NPM" src="https://img.shields.io/npm/v/@chronocide/robots-txt?label=npm">
  </a>
</div>

---

`robots-txt` is a tiny TypeScript [`robots.txt`](https://datatracker.ietf.org/doc/html/rfc9309) parser and matcher. It's based on Google's [robotstxt](https://github.com/google/robotstxt) project.

## Installation

```sh
npm i @chronocide/robots-txt
```

## Usage

```ts
import robots from '@chronocide/robots-txt';

const allowed = robots(`
  user-agent: FooBot
  disallow: /
`);

allowed('FooBot')('/'); // False
```
