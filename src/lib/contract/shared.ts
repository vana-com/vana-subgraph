import {Dlp, Token, User} from "../../../generated/schema";
import {getOrCreateTotals, getTotalsDlpId} from "../entity/totals";
import {Address, BigDecimal, BigInt, Bytes} from "@graphprotocol/graph-ts";
import {REFERENCE_TOKEN} from "../../uniswap/common/chain";

export function getOrCreateUser(userId: string): User {
  let user = User.load(userId);
  if (user == null) {
    user = new User(userId);
    user.save();
  }
  return user;
}

export function getOrCreateDlp(dlpId: string): Dlp {
  let dlp = Dlp.load(dlpId);
  if (dlp == null) {
    dlp = new Dlp(dlpId);

    const dlpTotalsId = getTotalsDlpId(dlpId);
    getOrCreateTotals(dlpTotalsId);

    // Link totals to Dlp
    dlp.totals = dlpTotalsId;
    dlp.save();
  }
  return dlp;
}


export function getTokenDerivedETH(
  tokenAddress: Bytes,
): BigDecimal {
  const token = Token.load(tokenAddress);

  if (!token) {
    throw new Error(`Token not found: ${tokenAddress.toHex()}`);
  }

  return token.derivedETH;
}

export function getTokenAmountInVana(
  tokenAddress: Bytes,
  amount: BigInt,
): BigDecimal {
  if (tokenAddress == Address.zero()) {
    tokenAddress = Address.fromString(REFERENCE_TOKEN);
  }

  const token = Token.load(tokenAddress);

  if (!token) {
    throw new Error(`Token not found: ${tokenAddress.toHex()}`);
  }

  const decimals = Number.parseInt(token.decimals.toString()) as u8;

  let precision = BigInt.fromI32(10).pow(decimals);
  const decimalAmount = amount.toBigDecimal().div(precision.toBigDecimal());

  return decimalAmount.times(token.derivedETH);
}