import type {TableProps} from './types';

const SEARCH_FILTER_REGEX = /[^\w\s]/g;

type ApplySearchFn = (_props: {
  searchKeys: string[];
  data: TableProps['data'];
  query: string;
}) => TableProps['data'];

export const applySearch: ApplySearchFn = ({data, query, searchKeys}) => {
  if (!data) return [];

  if (query && searchKeys.length > 0) {
    const queryRegex = new RegExp(query.replace(SEARCH_FILTER_REGEX, ''), 'i');

    return data.filter((d: any) => {
      if (d) {
        return !!searchKeys.find((searchKey) => {
          if (searchKey) {
            const value = d[searchKey] ?? '';
            return queryRegex.test(value.replace(SEARCH_FILTER_REGEX, ''));
          } else {
            return false;
          }
        });
      }
      return false;
    });
  }
  return data.filter(Boolean);
};
