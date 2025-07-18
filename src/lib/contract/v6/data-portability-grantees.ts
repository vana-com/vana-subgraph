import {
  log,
  BigInt as GraphBigInt,
} from "@graphprotocol/graph-ts";
import {
  GranteeRegistered,
} from "../../../../generated/DataPortabilityGranteesImplementation/DataPortabilityGranteesImplementation";
import { Grantee } from "../../../../generated/schema";

export function handleGranteeRegistered(event: GranteeRegistered): void {
  log.info("Handling GranteeRegistered with granteeId: {}, owner: {}, and granteeAddress: {}", [
    event.params.granteeId.toString(),
    event.params.owner.toHexString(),
    event.params.granteeAddress.toHexString(),
  ]);

  const granteeId = event.params.granteeId.toString();
  let grantee = Grantee.load(granteeId);
  
  if (grantee == null) {
    grantee = new Grantee(granteeId);
  }

  grantee.address = event.params.granteeAddress;
  grantee.publicKey = event.params.publicKey;
  grantee.permissionIds = [];
  grantee.registeredAtBlock = event.block.number;
  grantee.registeredAtTimestamp = event.block.timestamp;
  grantee.transactionHash = event.transaction.hash;

  grantee.save();
}