import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => '';

export function useRequestQuery() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  return new URLSearchParams(search);
}
