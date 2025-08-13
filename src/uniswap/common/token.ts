/* eslint-disable prefer-const */
import { Address, BigInt } from "@graphprotocol/graph-ts";

import { ERC20 } from "../../../generated/Factory/ERC20";
import { ERC20NameBytes } from "../../../generated/Factory/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../../generated/Factory/ERC20SymbolBytes";
import { TokenDefinition } from "./chain";
import { getStaticDefinition } from "./staticTokenDefinition";
import { isNullEthValue } from "./utils";

export function fetchTokenSymbol(tokenAddress: Address): string {
  const staticDefinition = getStaticDefinition(tokenAddress);
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).symbol;
  }
  const contract = ERC20.bind(tokenAddress);
  const contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  const symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  const staticDefinition = getStaticDefinition(tokenAddress);
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).name;
  }
  const contract = ERC20.bind(tokenAddress);
  const contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  const nameResult = contract.try_name();
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  const contract = ERC20.bind(tokenAddress);
  let totalSupplyValue = BigInt.zero();
  const totalSupplyResult = contract.try_totalSupply();
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value;
  }
  return totalSupplyValue;
}

export function fetchTokenDecimals(tokenAddress: Address): BigInt | null {
  const staticDefinition = getStaticDefinition(tokenAddress);
  if (staticDefinition != null) {
    return (staticDefinition as TokenDefinition).decimals;
  }
  const contract = ERC20.bind(tokenAddress);
  // try types uint8 for decimals

  const decimalResult = contract.try_decimals();
  if (!decimalResult.reverted) {
    if (decimalResult.value.lt(BigInt.fromI32(255))) {
      return decimalResult.value;
    }
  }

  return null;
}
