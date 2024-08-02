import {
  buildPath,
  RouteInstance,
  RouteParams,
  RouteParamsAndQuery,
  createHistoryRouter,
} from 'atomic-router';
import {
  combine,
  createEvent,
  createStore,
  Event,
  is,
  sample,
  Store,
} from 'effector';
import {DOMTag, h, handler, node, spec} from 'forest';

export function onAppMount(clock: Event<void>) {
  h('div', () => node(() => clock()));
}

export function withRoute<T extends RouteParams>(route: RouteInstance<T>) {
  spec({visible: route.$isOpened});
}

export function linkRouter({
  clock,
  router,
  Link,
}: {
  clock: Event<any>;
  router: ReturnType<typeof createHistoryRouter>;
  Link: ReturnType<typeof createLink>;
}) {
  sample({
    clock,
    fn: () => router.routes,
    target: Link.$routes,
  });
}

type Spec = Parameters<typeof spec>[0] & {fn?: () => void};

type LinkParams<T extends Record<string, any>> =
  | Store<T>
  | {
      [Key in keyof T]: Store<T[Key]> | T[Key];
    }
  | T;

export type QueryParams = Record<string, string | number | boolean | null>;

type LinkSpec<Path extends RouteParams, Query extends QueryParams> = {
  tag?: DOMTag;
  params?: LinkParams<Path>;
  query?: LinkParams<Query>;
};

export interface RouteObject {
  route: RouteInstance<RouteParams>;
  path: string;
}

export function createLink() {
  const $routes = createStore<RouteObject[]>([]);

  function Link<P extends Record<string, any>, Q extends QueryParams = {}>(
    route: RouteInstance<P>,
    spec: Spec & LinkSpec<P, Q> = {},
  ) {
    const tag = spec.tag ?? 'a';
    const isLink = tag === 'a';
    const $params = toStore(spec.params ?? ({} as Record<string, any>));
    const $query = toStore(spec.query ?? ({} as Record<string, any>));
    const attr = {...spec.attr};

    if (isLink) {
      const $path = $routes.map(
        (routes) => routes.find((found) => found.route === route)?.path ?? '',
      );
      attr.href = combine(
        $path,
        $params,
        $query,
        (pathCreator, params, query) =>
          buildPath({
            pathCreator,
            params,
            query,
          }),
      );
    }

    const click = createEvent<MouseEvent>();

    sample({
      source: combine({query: $query, params: $params}) as Store<
        RouteParamsAndQuery<any>
      >,
      clock: click,
      target: route.navigate,
    });

    h(spec.tag ?? 'a', {
      ...spec,
      attr,
      fn() {
        spec.fn?.();
        handler(
          {
            prevent: isLink,
          },
          {
            click,
          },
        );
      },
    });
  }

  Link.$routes = $routes;

  return Link;
}

function toStore<T extends Record<string, any>>(
  value:
    | Store<T>
    | {
        [Key in keyof T]: Store<T[Key]> | T[Key];
      },
): Store<T> {
  if (is.store(value)) {
    return value;
  }
  return combine(value) as Store<T>;
}
