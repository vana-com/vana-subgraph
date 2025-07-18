import {
  log,
  store,
  BigInt as GraphBigInt,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  PermissionAdded,
  PermissionRevoked,
  DataPortabilityPermissionsImplementation,
} from "../../../../generated/DataPortabilityPermissionsImplementation/DataPortabilityPermissionsImplementation";
import { Permission, Grantee } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";

export function handlePermissionAdded(event: PermissionAdded): void {
  log.info("Handling PermissionAdded with permissionId: {} for user: {} and granteeId: {}", [
    event.params.permissionId.toString(),
    event.params.user.toHexString(),
    event.params.granteeId.toString(),
  ]);

  const grantor = getOrCreateUser(event.params.user.toHex());
  const permissionId = event.params.permissionId.toString();
  const granteeId = event.params.granteeId.toString();

  // Ensure grantee exists
  let grantee = Grantee.load(granteeId);
  if (grantee == null) {
    log.error("Grantee with id {} not found for permission {}", [granteeId, permissionId]);
    return;
  }

  // Create permission
  const permission = new Permission(permissionId);
  permission.grantor = grantor.id;
  permission.grantee = grantee.id;
  permission.grant = event.params.grant;
  permission.addedAtBlock = event.block.number;
  permission.addedAtTimestamp = event.block.timestamp;
  permission.transactionHash = event.transaction.hash;
  permission.isActive = true;
  permission.fileIds = event.params.fileIds;

  // Get nonce and signature from contract
  const contract = DataPortabilityPermissionsImplementation.bind(event.address);
  const permissionData = contract.try_permission(event.params.permissionId);

  if (!permissionData.reverted) {
    permission.nonce = permissionData.value.nonce;
    permission.signature = permissionData.value.signature;
  } else {
    log.warning(
      "Could not get permission data for id {}. Nonce and signature will be zero.",
      [permissionId],
    );
    permission.nonce = GraphBigInt.zero();
    permission.signature = new Bytes(0);
  }

  permission.save();

  // Update grantee's permission list
  const permissionIds = grantee.permissionIds;
  permissionIds.push(event.params.permissionId);
  grantee.permissionIds = permissionIds;
  grantee.save();
}

export function handlePermissionRevoked(event: PermissionRevoked): void {
  log.info("Handling PermissionRevoked for permissionId: {}", [
    event.params.permissionId.toString(),
  ]);

  const permissionId = event.params.permissionId.toString();
  const permission = Permission.load(permissionId);

  if (permission) {
    permission.isActive = false;
    permission.save();

    // Update grantee's permission list
    const grantee = Grantee.load(permission.grantee);
    if (grantee) {
      const permissionIds = grantee.permissionIds;
      const index = permissionIds.indexOf(event.params.permissionId);
      if (index > -1) {
        permissionIds.splice(index, 1);
        grantee.permissionIds = permissionIds;
        grantee.save();
      }
    }
  } else {
    log.warning(
      "Received revoke event for a permission not found in subgraph: {}",
      [permissionId],
    );
  }
}