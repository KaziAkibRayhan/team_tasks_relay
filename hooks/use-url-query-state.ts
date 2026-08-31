'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';

import {
  DEFAULT_QUERY,
  parseQuery,
  serializeQuery,
  type QueryState,
} from '@/lib/task-query';

const URL_CHANGE_EVENT = 'relay:url-change';
const SERVER_SNAPSHOT = '__relay_server_snapshot__';

function subscribeToUrl(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(URL_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener(URL_CHANGE_EVENT, callback);
  };
}

function getUrlSnapshot() {
  return window.location.search;
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function useUrlQueryState() {
  const snapshot = useSyncExternalStore(
    subscribeToUrl,
    getUrlSnapshot,
    getServerSnapshot,
  );
  const ready = snapshot !== SERVER_SNAPSHOT;
  const query = useMemo(
    () => (ready ? parseQuery(snapshot) : DEFAULT_QUERY),
    [ready, snapshot],
  );

  const commitQuery = useCallback(
    (next: QueryState, mode: 'push' | 'replace' = 'push') => {
      const nextUrl = `${window.location.pathname}${serializeQuery(next)}${window.location.hash}`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextUrl === currentUrl) return false;

      if (mode === 'replace') {
        window.history.replaceState(null, '', nextUrl);
      } else {
        window.history.pushState(null, '', nextUrl);
      }
      window.dispatchEvent(new Event(URL_CHANGE_EVENT));
      return true;
    },
    [],
  );

  const canonicalSearch = ready ? serializeQuery(query) : '';
  useEffect(() => {
    if (ready && canonicalSearch !== snapshot) {
      commitQuery(query, 'replace');
    }
  }, [canonicalSearch, commitQuery, query, ready, snapshot]);

  return { query, commitQuery, ready };
}
