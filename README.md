# Atomic-router-forest

Forest bindings for [atomic-router](https://github.com/atomic-router/atomic-router)

[//]: # '[Example on StackBlitz](https://stackblitz.com/edit/react-fglswy)'

## Installation

Install the router and forest bingings:

```bash
npm i atomic-router atomic-router-forest
```

Don't forget about peer dependencies, if you haven't installed them yet:

```bash
npm i effector forest history
```

## Usage

First of all you need to create `Link` component to route to from the UI.
In general, you need to create you own internal library `router` or something like:

```ts
// src/shared/lib/router.ts
import {createLink} from 'atomic-router-forest';

export const Link = createLink();
```

For each page you need to create a route instance:

```ts
// src/shared/routes.ts
import {createRoute} from 'atomic-router';

export const home = createRoute();
export const postsList = createRoute();
export const postView = createRoute<{postId: string}>();
```

Now you can create each page:

```ts
// pages/home/index.ts
import {h, text} from 'forest';
import {withRoute} from 'atomic-router-forest';

import * as routes from '~/shared/routes';
import {Link} from '~/shared/lib/router';

export function HomePage() {
  h('div', {
    classList: ['flex', 'flex-col'],
    fn() {
      // This allows to show/hide route if page is matched
      // It is required to call `withRoute` inside `h` call
      withRoute(routes.home);

      text`Hello from the home page`;

      Link(router.postList, {
        text: `Show posts list`,
      });
    },
  });
}
```

And the same for the other pages. You can pass `params` and `query` into the `Link`:

```ts
Link(routes.postView, {
  params: {postId: remap($post, 'id')},
  text: remap($post, 'title'),
});

// or

Link(routes.postList, {
  query: {offset: $currentOffset.map((offset) => offset + 10)},
  text: 'Show next posts',
});
```

Next step you need to define your paths for each route:

```ts
// src/pages/index.ts
// ~ stands for root alias
import * as routes from '~/shared/routes';

import {HomePage} from './home';
import {PostListPage} from './post-list';
import {PostViewPage} from './post-view';

export const ROUTES = [
  {path: '/', route: routes.home},
  {path: '/posts', route: routes.postsList},
  // be sure your postId parameter matches generic parameter in `createRoute`
  {path: '/posts/:postId', route: routes.postView},
];

export function Pages() {
  HomePage();
  PostListPage();
  PostViewPage();
}
```

Last step is create router and link it with the Link and App:

```ts
// src/app.ts
import {sample, createEvent} from 'effector';
import {h, node, using} from 'forest';
import {createBrowserHistory} from 'history';
import {createHistoryRouter} from 'atomic-router';
import {linkRouter, onAppMount} from 'atomic-router-forest';

import {ROUTES, Pages} from '~/pages';
import {Link} from '~/shared/lib/router';

// Create history instance and router instance to control routing in the app
const history = createBrowserHistory();
const router = createHistoryRouter({routes: ROUTES});

// This event need to setup initial configuration. You can move it into src/shared
const appMounted = createEvent();

// Attach history for the router on the app start
sample({
  clock: appMounted,
  fn: () => history,
  target: router.setHistory,
});

// Add router into the Link instance to easily resolve routes paths
linkRouter({
  clock: appMounted,
  router,
  Link,
});

function Application() {
  Pages();
  onAppMount(appMounted);
}

using(document.querySelector('#root')!, Application);
```

That's all!

SSR guide will be there asap.
