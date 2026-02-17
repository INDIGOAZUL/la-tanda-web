// path parameter validation - prevents path traversal attacks

const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/

/**
 * Validates that an ID param is safe for URL interpolation.
 * Rejects values containing `/`, `..`, or non-alphanumeric characters.
 * @throws Error if the ID is invalid.
 */
export function validateId(id: string, paramName = 'id'): string {
    if (!id || !SAFE_ID_PATTERN.test(id)) {
        throw new Error(
            `Invalid ${paramName}: must contain only alphanumeric characters, hyphens, and underscores.`
        )
    }
    return id
}
