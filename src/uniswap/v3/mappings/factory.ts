import { BigInt, log } from '@graphprotocol/graph-ts'

import { PoolCreated } from '../../../../generated/Factory/Factory'
import {Epoch, Factory} from '../../../../generated/schema'
import { Bundle, Pool, Token } from '../../../../generated/schema'
import { Pool as PoolTemplate } from '../../../../generated/templates'
import { populateEmptyPools } from '../../common/backfill'
import { FACTORY_ADDRESS, POOL_MAPINGS, SKIP_POOLS, WHITELIST_TOKENS } from '../../common/chain'
import { fetchTokenDecimals, fetchTokenName, fetchTokenSymbol, fetchTokenTotalSupply } from '../../common/token'
import { ADDRESS_ZERO, ONE_BI, ZERO_BD, ZERO_BI } from '../../common/constants'



export function handlePoolCreated(event: PoolCreated): void {
  console.log('handlePoolCreated 44');
  const factoryAddress = FACTORY_ADDRESS
  const whitelistTokens = WHITELIST_TOKENS
  const poolsToSkip = SKIP_POOLS
  const poolMappings = POOL_MAPINGS

  // temp fix
  if (poolsToSkip.includes(event.params.pool.toHexString())) {
    return
  }


  console.log('handlePoolCreated 2');
  // load factory
  let factory = Factory.load(factoryAddress);


  console.log('handlePoolCreated 3');

  if (factory === null) {
    console.log('handlePoolCreated 4');

    factory = new Factory(factoryAddress)
    factory.poolCount = ZERO_BI
    factory.totalVolumeETH = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalFeesUSD = ZERO_BD
    factory.totalFeesETH = ZERO_BD
    factory.totalValueLockedETH = ZERO_BD
    factory.totalValueLockedUSD = ZERO_BD
    factory.totalValueLockedUSDUntracked = ZERO_BD
    factory.totalValueLockedETHUntracked = ZERO_BD
    factory.txCount = ZERO_BI
    factory.owner = ADDRESS_ZERO

    // create new bundle for tracking eth price
    const bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()

    populateEmptyPools(event, poolMappings, whitelistTokens)
  }

  console.log('handlePoolCreated 5');


  factory.poolCount = factory.poolCount.plus(ONE_BI)

  console.log('handlePoolCreated 6');

  factory.save()

  console.log('handlePoolCreated 7');
}
