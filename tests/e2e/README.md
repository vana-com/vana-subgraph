# E2E Testing
End-to-end tests compare subgraph data between different versions to catch regressions and verify data consistency.

## Running Tests
Tests can be run using:

```
# Run all E2E tests
yarn test:e2e

# Run with specific environment variables
GROUND_TRUTH_VERSION=prod COMPARE_VERSION=6.0.0 yarn test:e2e
```

## Environment Setup

Create a `.env` file in the tests/e2e directory:

```
SUBGRAPH_BASE_URL=https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs
GROUND_TRUTH_VERSION=prod
COMPARE_VERSION=6.0.0
```

Replace the values with your actual subgraph URLs and version identifiers.

## Test Types

### Version Comparison Tests

These tests compare data between two subgraph versions (usually production vs a new version) at specific blocks. They ensure that schema-compatible changes don't introduce regressions in data handling.

Example from `totals.test.ts`:

```typescript
const query = `
    query getTotals($block: Block_height) {
        totals(block: $block, id: "global") {
            activeStakedAmount
            delegatedStakedAmount
            uniqueStakers
            totalFileContributions
            uniqueFileContributors
        }
    }
`;
const results = await client.compareQuery(query, {}, {
    block: epochOneEndBlock,
});
expect(compareTotals.activeStakedAmount).toBe(groundTruthTotals.activeStakedAmount);
...
```

## Future Enhancements

In the future, we will likely extend these to support breaking changes, onchain data comparisons, etc.

## Example Test Cases

See existing tests in `tests/e2e/tests/` for examples, such as:
- `totals.test.ts`: Compares global totals at epoch boundaries
