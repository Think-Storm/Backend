export const passwordSaltRounds = 11;
export const DAY_TO_MILISECONDS_RATIO = 24 * 60 * 60 * 1000;
export const RATE_LIMITING_LIMIT = 10; //10 times
export const RATE_LIMITING_TTL = 2000; //2s
export const LOCALHOST_IP = '127.0.0.1';
export const BLOCK_REQUEST_TIME = 3600; //1 hour
export enum PaginationDefault {
  PAGE_DEFAULT = 1,
  LIMIT_DEFAULT = 10,
}
export enum SortDefault {
  SORT_DEFAULT = 'lastUpdatedAt=desc,createdAt=desc',
}
