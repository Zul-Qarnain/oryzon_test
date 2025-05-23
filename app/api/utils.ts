import { NextRequest } from 'next/server';

/**
 * Parses the 'include' query parameter string into an options object.
 * For example, "relation1,relation2" becomes { relation1: true, relation2: true }.
 *
 * @param query The comma-separated string of relations to include.
 * @param validIncludes An array of valid keys for the specific resource's include options.
 * @returns An object with keys for valid relations set to true, or an empty object if no valid includes are requested.
 */
export function parseIncludeQuery<T, K extends keyof T>(
  query: string | null,
  validIncludes: K[]
): Partial<T> {
  if (!query) {
    return {};
  }

  const includes: Partial<T> = {};
  const parts = query.split(',');

  for (const part of parts) {
    const trimmedPart = part.trim();
    if (validIncludes.includes(trimmedPart as K)) {
      includes[trimmedPart as K] = true as T[K];
    }
  }

  return includes;
}

/**
 * Parses 'limit' and 'offset' query parameters for pagination.
 *
 * @param searchParams The URLSearchParams from the NextRequest.
 * @param defaultLimit The default limit if not specified or invalid.
 * @param defaultOffset The default offset if not specified or invalid.
 * @param maxLimit The maximum allowed limit.
 * @returns An object containing the parsed limit and offset.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit: number = 10,
  defaultOffset: number = 0,
  maxLimit: number = 100
): { limit: number; offset: number } {
  let limit = parseInt(searchParams.get('limit') || '', 10);
  let offset = parseInt(searchParams.get('offset') || '', 10);

  if (isNaN(limit) || limit <= 0) {
    limit = defaultLimit;
  }
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  if (isNaN(offset) || offset < 0) {
    offset = defaultOffset;
  }

  return { limit, offset };
}

/**
 * Extracts a string filter parameter from searchParams.
 * @param searchParams The URLSearchParams object.
 * @param paramName The name of the parameter to extract.
 * @returns The string value of the parameter, or undefined if not present.
 */
export function getStringFilterParam(searchParams: URLSearchParams, paramName: string): string | undefined {
    const value = searchParams.get(`filter[${paramName}]`);
    return value ? value : undefined;
}
