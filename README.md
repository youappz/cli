[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]

# youappz-cli

Command line interface for interacting with the [YouAppz](https://www.youappz.com) static hosting platform.

### Installation

```sh
npm install @youappz/cli -g
```

This will make the `appz` command globally available. Run `appz help` for usage instructions:

```sh
YouAppz - Professional static web publishing. (1.0.3)

Usage:
    $ appz [command] [options]

Commands:
    account        Display a summary of the current YouAppz account.
    apikey         Get the api key for the current YouAppz account.
    create         Create a new YouAppz website in the current directory
    delete         Delete the current website
    deploy         Deploy the website in the current directory.
    download       Download Source files of a Website
    domain         Register a custom domain for the current website
    info           Display a summary of the current website
    login          Login to your YouAppz account
    list           list of all websites
    versions       Manage website versions

    Type appz help COMMAND for more details
```

Complete docs available at: [https://www.youappz.com/docs/cli](https://www.youappz.com/docs/cli/)

[npm-image]: https://img.shields.io/npm/v/youappz-cli.svg?style=flat
[npm-url]: https://npmjs.org/package/youappz-cli
[travis-image]: https://img.shields.io/travis/youappz/youappz-cli.svg?style=flat
[travis-url]: https://travis-ci.org/youappz/youappz-cli
[downloads-image]: https://img.shields.io/npm/dm/youappz-cli.svg?style=flat
[downloads-url]: https://npmjs.org/package/youappz-cli
