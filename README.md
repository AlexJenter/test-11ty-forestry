# 11ty Pug Starter

## Getting Started

- `yarn` to grab dependencies
- `yarn dev` to fire up dev server
- `yarn build` to build static site

## Templating

### 11ty

This project uses [11ty](https://www.11ty.dev/docs/) for templating and static generation. All templating takes place inside the `src` directory.

Refer to the [11ty docs](https://www.11ty.dev/docs/) for more information on how to customize 11ty to your liking, it is an incredibly powerful tool!

### Pug

We use Pug as a template language. 11ty's default support has been slightly enhanced: we allow to use filters (available as functions) and helpers that are equally available on a global context.

We don't use 11ty's layout pipeline but rather use Pug's built in functionality here, because it supports stuff we want.

Components are automatically gathered (imported) into `source/_components/all.pug` and this again can be imported into the base layout to make all components available to all pages (that use the layout).

### Gulp

We use Gulp to process most stuff, especially CSS and JS. It's also where 11ty is started.


### Assets

All static assets, like images and fonts, should be placed in `source/_public`, as it is copied as-is into the `build` directory.


### Rollup

For bundling, this project uses [Rollup](https://rollupjs.org/guide/en/). This is a fantastic bundler that makes complex bundling simple and highly configurable. See `rollup.config.js` to see what is going on under the hood.

### Svelte

For complex functionality that doesn't require SEO, such as pulling data from an API client side or sending post requests, this project utilitizes [Svelte](https://svelte.dev). Svelte is an exceptional JS framework that makes reactivity simple and predictable.


## Knock Yourself Out!

Thank you for taking the time to check out this repo and read through the docs. I hope this tool is useful and pleasant to work with. Have a great day!
