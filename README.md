# Command bar (CMD+K) plugin for Neos CMS

[![Tests](https://github.com/Sebobo/Shel.Neos.CommandBar/actions/workflows/tests.yml/badge.svg)](https://github.com/Sebobo/Shel.Neos.CommandBar/actions/workflows/tests.yml)

This package provides a command bar plugin for Neos CMS.

## Installation

As the plugin is still in development, you need to add the package to your `composer.json` manually:

```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/Sebobo/Shel.Neos.CommandBar"
    }
  ]
}
```

Then you can install the package via composer:

```console
composer require shel/neos-commandbar:@dev
```

## Development

First install all dependencies:

```console
yarn
```

For developing the command bar component itself, you can run the following command to start a dev server:

```console
yarn dev
```

To develop the Neos plugin, you can run the following command to watch for changes and rebuild the plugin:

```console
yarn start
```

To build the plugin for production, run the following command:

```console
yarn build
```

## License

This package is licensed under the MIT license. See [license](LICENSE.txt) for details.
