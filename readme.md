# board-poc

Try it on http://board-poc.herokuapp.com/ (the board is clean on new connections intentionally)

## Development environment setup

### Steps to follow:

1. Clone or download the project from the [Github repository](https://github.com/MakingSense/hypermedia-api-poc).
2. Install [Node.js](https://nodejs.org). For example `node-v4.2.4-x86.msi`.
3. Install Global Node Packages
    * Gulp `npm install -g gulp`
    * [TypeScript](http://www.typescriptlang.org/) `npm install -g typescript`.
    * [TypeScript Definition manager](https://github.com/DefinitelyTyped/tsd) `npm install -g tsd`.
    * Bower `npm install -g bower`.
    * [Browserify](http://browserify.org/) `npm install -g browserify`.
    * [TypeStrong tsify](https://github.com/TypeStrong/tsify) `npm install -g tsify`.
4. Run `npm install`. With that will be installed all node dependencies, front-end dependencies using [bower](http://bower.io/) and will be compiled all typescript files.
5. Finally should be run `npm start`.

## Add new dependencies

New dependencies could be added using _Bower_, in that case, the reference should be added to HTML files.

Also, _npm_ dependencies could be added and consumed using `import ... = require(...)`.

With both, _npm_ and _bower_, we need TypeScrip definitions. If _DefinitelyTyped_ definitions are available
it is enough to call `tsd install ... --save` and add the reference to the right files.

If _DefinitelyTyped_ definitions are not available, it is possible to create our own definitions, see the folder `custom-typings`.