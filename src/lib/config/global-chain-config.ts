import { log } from "@graphprotocol/graph-ts";
import { ChainConfig } from "./chain-config";
import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { InitParams } from "../params/init-params";

export let CONFIG: ChainConfig = new ChainConfig(
  "moksha",
  new InitParams(
    GraphBigInt.fromI32(0),
    GraphBigInt.fromI32(0),
    GraphBigInt.fromI32(0)
  ),
);

let _isInit = false;

export function initGlobalChainConfig(config: ChainConfig): void {
  if (_isInit) {
    log.error("CONFIG already initialized: {}", [CONFIG.toString()]);
    return;
  }
  CONFIG = config;
  _isInit = true;
}
