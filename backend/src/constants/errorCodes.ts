const ERROR_CODES = {
    INTERNAL_ERROR:      { statusCode: 500 },
    VALIDATION_ERROR:    { statusCode: 400 },
    NOT_FOUND:           { statusCode: 404 },
    UNAUTHORIZED:        { statusCode: 401 },
    FORBIDDEN:           { statusCode: 403 },
    TOO_MANY_REQUESTS:   { statusCode: 429 },
} as const

export type ErrorCodeKey = keyof typeof ERROR_CODES

export const ErrorCode = Object.fromEntries(
    Object.keys(ERROR_CODES).map(k => [k, k])
) as { [K in ErrorCodeKey]: K }

export function getStatusCode(code: ErrorCodeKey): number {
    return ERROR_CODES[code].statusCode
}
