import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0x7067eb594d6dc6a5ad33c3fcfca7183f369bc2e8'

export const REFERENCE_TOKEN = '0xbccc4b4c6530f82fe309c5e845e50b5e9c89f2ad' // WVANA
export const STABLE_TOKEN_POOL = '0x124ad2057083b7db2346f3bdc4e6f105dbcb1545' // USDC Pool

export const TVL_MULTIPLIER_THRESHOLD = '2'
export const MATURE_MARKET = '1000000'
export const MINIMUM_NATIVE_LOCKED = BigDecimal.fromString('20')

export const ROLL_DELETE_HOUR = 768
export const ROLL_DELETE_MINUTE = 1680

export const ROLL_DELETE_HOUR_LIMITER = BigInt.fromI32(500)
export const ROLL_DELETE_MINUTE_LIMITER = BigInt.fromI32(1000)

// token where amounts should contribute to tracked volume and liquidity
export const WHITELIST_TOKENS: string[] = [
  REFERENCE_TOKEN, // WVANA
  '0xb39a50b5806039c82932bb96cefbcbc61231045c', // USDC
  '0x01079c78199e05d44bbff9e50dbdf765489f16e1', // USDT
  '0xb18a68588e4551b880011af27df5347b99b444c2', // VOL
  '0xf5a960f8f0d04aaedc44f2619977a2b7de9cef09', // DNA
  '0xf379a80f0585e57fd5aebb29d8cafac60f8f54c3', // WDUDE
]

export const STABLE_COINS: string[] = [
  '0xb39a50b5806039c82932bb96cefbcbc61231045c', // USDC
  '0x01079c78199e05d44bbff9e50dbdf765489f16e1', // USDT
]

export const SKIP_POOLS: string[] = []

export const POOL_MAPINGS: Array<Address[]> = []

export class TokenDefinition {
  address: Address
  symbol: string
  name: string
  decimals: BigInt
}

export const STATIC_TOKEN_DEFINITIONS: TokenDefinition[] = []
