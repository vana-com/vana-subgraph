import { log, BigInt as GraphBigInt } from "@graphprotocol/graph-ts";
import { GranteeRegistered } from "../../../../generated/DataPortabilityGranteesImplementation/DataPortabilityGranteesImplementation";
import { Grantee } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";

export function handleGranteeRegistered(event: GranteeRegistered): void {
  log.info(
    "Handling GranteeRegistered with granteeId: {}, owner: {}, and granteeAddress: {}",
    [
      event.params.granteeId.toString(),
      event.params.owner.toHexString(),
      event.params.granteeAddress.toHexString(),
    ],
  );

  const granteeId = event.params.granteeId.toString();
  let grantee = Grantee.load(granteeId);

  if (grantee == null) {
    grantee = new Grantee(granteeId);
  }

  // Get or create the owner user
  const owner = getOrCreateUser(event.params.owner.toHex());

  grantee.owner = owner.id;
  grantee.address = event.params.granteeAddress;
  grantee.publicKey = event.params.publicKey;
  grantee.registeredAtBlock = event.block.number;
  grantee.registeredAtTimestamp = event.block.timestamp;
  grantee.transactionHash = event.transaction.hash;

  grantee.save();
}
