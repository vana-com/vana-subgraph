import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const FACTORY_ADDRESS = '0xc2a0d530e57b1275fbce908031da636f95ea1e38'

export const REFERENCE_TOKEN = '0x00eddd9621fb08436d0331c149d1690909a5906d' // WVANA
export const STABLE_TOKEN_POOL = '0x850e454ddebf9f61ef5a86a032c857e0e47c4fa9' // USDC.e Pool

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
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // USDC.e
  '0x2f6f07cdcf3588944bf4c42ac74ff24bf56e7590', // WETH
  '0xf23e379b2fd945f8c0a4f410cb6ef9398bf022d6', // KDAT
  '0x84f8dc1ada73298281387e62616470f3dd5df2f6', // SIX
  '0x0cc1bc0131dd9782e65ca0319cd3a60eba3a932d', // VFSN
  '0xeb68ef0550a5532447da0fea4f0ed9f804803b8b', // VOL
  '0x1becf440e8bcfc78cdfd45f29f7b1dc04df7777c', // FIN
  '0xf8f97a79a3fa77104fab4814e3ed93899777de0d', // GDP
  '0xd561ce710ff7ce7d93fd7b1f0ff1b1989fe7256e', // MIND
  '0xc7a473434290671cffea503ca4b7b160f929c1ec', // DNA
  '0x579c80e02ef43345ce3a4c833c49da9730bd0f3f', // $PRIME
]

export const STABLE_COINS: string[] = [
  '0xf1815bd50389c46847f0bda824ec8da914045d14', // USDC.e
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