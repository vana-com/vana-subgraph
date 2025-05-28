# Vana Subgraph New

## Deploying the subgraph:

**First time only**

```ssh
yarn install
```

If deploying to Goldsky (default)
```ssh
goldsky login
```

If deploying to thegraph.com using the Deploy key which can be found in the graph studio page.
```ssh
graph auth 'Deploy Key'
```

Available networks:

[vana-new](https://vanascan.io) (Goldsky and TheGraph)

[moksha-new](https://moksha.vanascan.io) (Goldsky)

[vana-moksha-new](https://moksha.vanascan.io) (TheGraph)



**Deploy**

To deploy, execute the following:

```ssh
yarn prepare:<network> # ie. `yarn prepare:moksha`
yarn codegen
yarn build
yarn deploy:<network> <version> # ie. `yarn deploy:moksha 2.0.0`
yarn tag:<network> <version> <tag> # ie. `yarn tag:moksha 2.0.0 stag`
```

*Note*:

`yarn prepare:<network>` must be run when making changes to the `subgraph.<network>.yaml` files, or to config files since this action generates the "subgraph.yaml" manifest file.

For changes to the schema or mapping file it is sufficient to just run the codegen and build actions.

*Example*

```ssh
yarn prepare:moksha
yarn codegen
yarn build
yarn deploy:moksha 2.0.0
yarn tag:moksha 2.0.0 stag
```

To deploy over a current deployment with a matching version number you must first delete the version that exists.

```ssh
# only if version is tagged
yarn untag:<network> <version> <tag>
yarn delete:<network> <version>
```

*Example*

```ssh
yarn untag:moksha 2.0.0 stag
yarn delete:moksha 2.0.0
```

**Development vs Staging vs Production**

When testing new changes, we simply tag the new subgraph version with our `stag` tag.

If multiple people are working on new subgraphs, we can create development tags for individual git branches (ie `smart-contract-updates`) to allow for parallel work. They should be merged to a central `stag` tag for final testing before promotion to `prod`.

When changes have been testing successfully, we can promote it to production by doing the following:

```ssh
# untag new version
yarn untag:<network> <new version> stag

# untag old version
yarn untag:<network> <old version> prod

# tag new version as prod
yarn tag:<network> <new version> prod
```

*Example*

```ssh
# untag new version
yarn untag:moksha 2.0.0 stag

# untag old version
yarn untag:moksha 1.0.0 prod

# tag new version as prod
yarn tag:moksha 2.0.0 prod
```

**Good practices**

A good practice to deploy is to have a duplicate/backup subgraph so that if something goes wrong, the traffic can be redirected to the duplicate subgraph instead of having to wait for the subgraph to re-deploy/rollback to a previous version.

## Using Grafting to Speed Up Deployment

Grafting significantly reduces indexing time by reusing data from existing subgraphs. Ideal for major version upgrades, hotfixes, or adding new contract handlers.

### Configuration

Add to the subgraph manifest:

```yaml
features:
  - grafting
graft:
  base: Qm...  # Deployment ID of existing subgraph
  block: 123456  # Block number to start indexing from
```

Find the deployment ID via:
```graphql
{
  _meta {
    deployment
  }
}
```

### Best Practices

- **Initial Deployment**: Avoid grafting for first-time deployments
- **Block Selection**: Set the grafting block to where new contract handlers begin
- **Schema Compatibility**: Ensure schema changes are compatible (adding fields, entity types)
- **Avoid Using For**: Major mapping logic overhauls or incompatible schema changes

### Example (v7)
Version 7 uses grafting to build on v6:
- Base: 
- Block: 

For more details, see [The Graph's documentation on grafting](https://thegraph.com/docs/en/cookbook/grafting/).

## Versioning

Subgraph version numbers should adhere to semver's `x.z.y` to distinguish between types of changes:

* *Major version (x)*: Increment this when there are breaking changes to the smart contracts or subgraph schema, such as changing event signatures or structure. Deploy the new version as a separate subgraph if backward compatibility is broken.
* *Minor version (y)*: Increment this for non-breaking updates, such as adding new fields or event handlers. These updates can be done without affecting the existing data structure.
* *Patch version (z)*: Use this for small bug fixes or performance improvements that do not change the subgraph's behavior or data structure.

Environments are denoted by subgraph tags (`prod`, `stag`, ...).

**Note:** Remember to tag git code versions to match the subgraph versions for new releases!

## Deployments

### Moksha

#### Tags

*Production*
* Endpoint: [https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/prod/gn](https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/prod/gn) \
* Subgraph page: [https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/prod/gn](https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/prod/gn)

*Staging*
* Endpoint: [https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/stag/gn](https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/stag/gn) \
* Subgraph page: [https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/stag/gn](https://api.goldsky.com/api/public/project_cm168cz887zva010j39il7a6p/subgraphs/moksha/stag/gn)

## Example queries against schema

- User
- Transaction
- Dlp
- Epoch

### 1. Query for User Entity

Fetch the first 10 users, their transactions, and positions.

```graphql
{
  users(first: 10) {
    id
    transactions {
      id
      hash
    }
  }
}
```

### 2. Query for Transaction Entity

Fetch the first 10 transactions with details such as the hash, block, timestamp, and from/to addresses.
```graphql
{
  transactions(first: 10) {
    id
    hash
    blockNumber
    timestamp
    from
    to
  }
}
```


### 3. Query for Dlp Entity

Fetch the first 10 Dlp entities, their owner, creator, and other relevant details.

```graphql
{
  dlps(first: 10) {
    id
    address
    owner
    creator
    tokenAddress
    lpTokenId
  }
}
```

### 4. Query for Epoch Entity

Fetch the first 10 epochs, including their size, reward, and related Dlp.

```graphql
{
  epoch(id: "SPECIFIC_ID_VALUE") {
    id
    epochSize
    epochReward
    startDate
    endDate
  }
}
```

## Further notes
Deploying and deletion of subgraphs are handled by the delete.js and deploy.js scripts.

### Test deployemnt
For carrying out a separate test deployment you can edit the deploy script and change the network name to any name then deploy, which will deploy as a new subgraph with that name.
``` script
goldsky subgraph deploy testsubgraph/${version} --path .
```

After carrying out testing you can then delete your test deployment.
``` script
goldsky subgraph delete testsubgraph/3.0.0
```

### Issue investigations and tips
#### Deployed subgraph logs, data or actions not matching what is expected
Service providers such as thegraph.com and Goldsky use a standard subgraph framework which makes it very easy to migrate a subgraph between providers.
One feature of this framework is caching of subgraphs that works by creating a hash of the deployment which is used on subsequent deployments to test for differences and where a deployment is the same, the new deployment successfully completes and is acknowledged through the interface but the cached version itself does not change.

This includes logs and the data since a resync doesn't actually occur.

Therefore if making a deployment and the logs and data don't match what is expected it could be that the subgraph build step didn't complete and what was deployed was an old build with an old hash. One way to test for this is to make an obvious change such as adding a log action in a subgraph mapping function and redeploying and if the sync action doesn't start then investigate the build step locally, including running the prepare step.

## Development

### Determining smart contract migration block numbers

*From contract deployment transaction hash:*

1. Determine the contract upgrade / deployment transaction hash
2. Run following curl command (by network)
  - moksha: `curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["<insert tx hash>"],"id":1}'  https://rpc.moksha.vana.org`
  - vana: `curl -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getTransactionByHash","params":["<insert tx hash>"],"id":1}'  https://rpc.vana.org`

### Testing and Code Quality

**Linting & Formatting**
```bash
# Run linter
yarn lint

# Format code (safe changes only)
yarn format

# Format code (including potentially unsafe changes - use with caution)
yarn format:unsafe
```

**Testing**
```bash
# Run tests in development mode (with debug output)
yarn test

# Run tests for specific network
yarn test:moksha
yarn test:vana

# Run tests in CI mode
yarn test:ci
```

Note: The test commands will automatically prepare the subgraph manifest and generate types before running tests.

### CI/CD Pipeline

Our GitHub Actions workflow runs the following checks on each PR:
1. Builds the subgraph
2. Runs linting checks
3. Runs matchstick tests

All checks must pass before a PR can be merged.

## Local deployments
It can be useful to make deployments locally  for testing.
The graph protocol team provide a dockerised environment for this which is documented below.

```
git clone https://github.com/graphprotocol/graph-node.git
```

Edit docker/docker-compose.yml and set an archive node.

```
environment:
  ethereum: 'mainnet:https://archive.moksha.vana.org'
```

Deploy the containers.

```
docker-compose up
```

Take the environment back down.
```
docker-compose down -v
```

Deploy your subgraph.
```
graph deploy --node http://localhost:8020 --ipfs http://localhost:5001 moksha
```

Run GraphQL queries.

GraphQL queries can be run within the GraphQL studio.
```
http://localhost:8000/subgraphs/name/moksha
```

General queries can be run in the GraphQL playgound. The following is useful for monitoring syncing progress.

```
http://localhost:8030/graphql/playground
```

```graphQl
{
  indexingStatuses(subgraphs: ["moksha"]) {
    subgraph
    synced
    health
    fatalError {
      message
      handler
    }
    chains {
      network
      chainHeadBlock {
        number
      }
      earliestBlock {
        number
      }
      latestBlock {
        number
      }
    }
  }
}
```
