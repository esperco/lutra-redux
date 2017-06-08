Lutra Redux
===========
This implements the front-end using [React](https://facebook.github.io/react/)
for our view layer and  [Redux](http://redux.js.org/) for state management.
Currently, only the groups front-end is being implented using this.

Setup
-----
You need [NodeJS 6.x](https://nodejs.org/en/download/package-manager/) or
higher and the latest version of
[Yarn](https://yarnpkg.com/lang/en/docs/install/#linux-tab).

To avoid using `sudo` with Yarn, configure Yarn to install globals
in your home directory:

```
yarn config set prefix ~/.yarn
```

Then add `~/.yarn` to your path, e.g. in your `.bashrc`:

```
export PATH=$PATH:~/.yarn/bin
```

Finally, call `make setup`.

Development
-----------
Start a dev server with `make watch`. The site will be served on
http://localhost:5000 by default.

Testing
-------
Call `make test` after doing `make setup`. Tests should be included alongside
the modules being tested using the form `module.test.ts` (or `tsx`).

Types
-----
This repo uses Typescript 2. To bring in new types, simply install the NPM
package with the requisite type (sometimes NPM packages are bundled with
the correct types already, but if not, it's usually something like
`@types/package`).

Organization
------------
These are determined via our Webpack entry points (current just `groups.js`).
* `assets` - Static assets
* `config` - Config files loaded for dev or prod environments. Available in
  TS with `import { varYouNeed } from 'config'`;
* `less` - LESS / CSS files. By convention, files starting with an `_` are
  partials meant to be imported into other LESS files. Because we use Webpack
  in this repo, files must actually be `require`d from an entry point.
* `test-helpers` - Contains anything needed to help `make test` work.
* `ts` - Typescript
  * `components` - Reusable React components
  * `groups.js` - Groups-specific code + main loop
  * `lib` - Generic Typescript libraries and helpers
  * `states` - Redux-specific state management, includes reducers, actions, etc.
* `typings` - Misc one-off typings

Design Considerations
---------------------
This repo uses [Redux](http://redux.js.org/docs/introduction/ for state
management. Please keep in mind the
[three principles found here](http://redux.js.org/docs/introduction/ThreePrinciples.html).

We also want to keep things as loosely coupled as possible to make unit
testing easier. That means most React components should be pure functions
of their props and state (some local state is fine, but that we one day
might want to persist offline should probably go into the Redux store). It also
means writing a lot of the state management code as pure functions so we can
pass mocks for things like API clients, stores, reducers, etc. to the functions
we're testing.

