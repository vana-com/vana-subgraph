import { Address, BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { REFERENCE_TOKEN } from "../../uniswap/common/chain";
import { Dlp, User, Token, Grantee, Server, Epoch, Refiner } from "../../../generated/schema";
import { getOrCreateTotals, getTotalsDlpId } from "../entity/totals";

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

export function getOrCreateGrantee(granteeId: string): Grantee {
  let grantee = Grantee.load(granteeId);
  if (grantee == null) {
    // Create a placeholder grantee that will be populated by GranteeRegistered event
    grantee = new Grantee(granteeId);

    // Initialize with placeholder values
    // These will be overwritten when the actual GranteeRegistered event is processed
    grantee.owner = "";
    grantee.address = Bytes.empty();
    grantee.publicKey = "";
    grantee.registeredAtBlock = BigInt.zero();
    grantee.registeredAtTimestamp = BigInt.zero();
    grantee.transactionHash = Bytes.empty();

    grantee.save();
  }
  return grantee;
}

export function getOrCreateServer(serverId: string): Server {
  let server = Server.load(serverId);
  if (server == null) {
    // Create a placeholder server that will be populated by ServerRegistered event
    server = new Server(serverId);

    // Initialize with placeholder values
    // These will be overwritten when the actual ServerRegistered event is processed
    server.owner = "";
    server.serverAddress = Bytes.empty();
    server.publicKey = Bytes.empty();
    server.url = "";
    server.registeredAtBlock = BigInt.zero();
    server.registeredAtTimestamp = BigInt.zero();
    server.transactionHash = Bytes.empty();

    server.save();
  }
  return server;
}

export function getOrCreateEpoch(epochId: string): Epoch {
  let epoch = Epoch.load(epochId);
  if (epoch == null) {
    // Create a placeholder epoch that will be populated by EpochCreated event
    epoch = new Epoch(epochId);

    // Initialize with placeholder values
    // These will be overwritten when the actual EpochCreated event is processed
    epoch.startBlock = BigInt.zero();
    epoch.endBlock = BigInt.zero();
    epoch.reward = BigInt.zero();
    epoch.createdAt = BigInt.zero();
    epoch.createdTxHash = Bytes.empty();
    epoch.createdAtBlock = BigInt.zero();
    epoch.logIndex = BigInt.zero();
    epoch.isFinalized = false;
    epoch.dlpIds = [];

    epoch.save();
  }
  return epoch;
}

export function getOrCreateRefiner(refinerId: string): Refiner {
  let refiner = Refiner.load(refinerId);
  if (refiner == null) {
    // Create a placeholder refiner that will be populated by RefinerRegistered event
    refiner = new Refiner(refinerId);

    // Initialize with placeholder values
    // These will be overwritten when the actual RefinerRegistered event is processed
    refiner.dlp = "";
    refiner.owner = Bytes.empty();
    refiner.name = "";
    refiner.schemaDefinitionUrl = "";
    refiner.refinementInstructionUrl = "";

    refiner.save();
  }
  return refiner;
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

  // @ts-ignore
  const decimals = Number.parseInt(token.decimals.toString()) as u8;

  const precision = BigInt.fromI32(10).pow(decimals);
  const decimalAmount = amount.toBigDecimal().div(precision.toBigDecimal());

  return decimalAmount.times(token.derivedETH);
}
