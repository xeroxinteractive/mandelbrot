# @xerox/fractal-theme

> A web UI theme for Fractal built by Xerox. Based on the [default mandelbrot theme](https://github.com/frctl/mandelbrot).

[![circleci status][circleci-badge]][circleci-link]
[![npm package][npm-badge]][npm-link]
[![license MIT][license-badge]][license]
[![commit style angular][commit-style-badge]][commit-style-link]
[![semantic-release][semantic-release-badge]][semantic-release-link]
[![Dependabot Status][dependabot-badge]][dependabot-link]

## Installation
```bash
yarn add @xerox/fractal-theme --dev
# or
npm install @xerox/fractal-theme --save-dev
```

## Usage
See [Configuring themes](https://fractal.build/guide/customisation/web-themes.html#configuring-themes).
```javascript
// fractal.js
const xeroxTheme = require('@xerox/fractal-theme');

const myCustomisedTheme = xeroxTheme({
    panels: ['html', 'info', 'resources']
});

fractal.web.theme(myCustomisedTheme);
```

---

[LICENSE][license] | [CHANGELOG][changelog] | [ISSUES][issues]

[license]: ./LICENSE
[changelog]: ./CHANGELOG.md
[issues]: https://github.com/xeroxinteractive/fractal-theme/issues

[circleci-badge]: https://flat.badgen.net/circleci/github/xeroxinteractive/fractal-theme/master
[circleci-link]: https://circleci.com/gh/xeroxinteractive/fractal-theme/tree/master

[npm-badge]: https://flat.badgen.net/npm/v/@xerox/fractal-theme?color=cyan
[npm-link]: https://www.npmjs.com/package/@xerox/fractal-theme

[license-badge]: https://flat.badgen.net/npm/license/@xerox/fractal-theme

[commit-style-badge]: https://flat.badgen.net/badge/commit%20style/angular/purple
[commit-style-link]: https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines

[semantic-release-badge]: https://flat.badgen.net/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80/semantic%20release/e10079
[semantic-release-link]: https://github.com/semantic-release/semantic-release

[dependabot-badge]: https://flat.badgen.net/dependabot/xeroxinteractive/fractal-theme?icon=dependabot
[dependabot-link]: https://dependabot.com
