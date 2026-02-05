/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
    },
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/types/**/*'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    verbose: true,
};
