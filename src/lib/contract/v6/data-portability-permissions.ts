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
import {
  Permission,
  Grantee,
  PermissionFile,
  File,
} from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";

export function handlePermissionAdded(event: PermissionAdded): void {
  log.info(
    "Handling PermissionAdded with permissionId: {} for user: {} and granteeId: {}",
    [
      event.params.permissionId.toString(),
      event.params.user.toHexString(),
      event.params.granteeId.toString(),
    ],
  );

  const grantor = getOrCreateUser(event.params.user.toHex());
  const permissionId = event.params.permissionId.toString();
  const granteeId = event.params.granteeId.toString();

  // Ensure grantee exists
  const grantee = Grantee.load(granteeId);
  if (grantee == null) {
    log.error("Grantee with id {} not found for permission {}", [
      granteeId,
      permissionId,
    ]);
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

  // Get nonce and signature from contract
  const contract = DataPortabilityPermissionsImplementation.bind(event.address);
  const permissionData = contract.try_permission(event.params.permissionId);

  if (!permissionData.reverted) {
    permission.nonce = permissionData.value.nonce;
    permission.signature = permissionData.value.signature;
    permission.startBlock = permissionData.value.startBlock;
    permission.endBlock = permissionData.value.endBlock;
  } else {
    log.warning(
      "Could not get permission data for id {}. Nonce and signature will be zero.",
      [permissionId],
    );
    permission.nonce = GraphBigInt.zero();
    permission.signature = new Bytes(0);
    permission.startBlock = event.block.number;
    permission.endBlock = null;
  }

  permission.save();

  // Create PermissionFile entities for each fileId
  const fileIds = event.params.fileIds;
  for (let i = 0; i < fileIds.length; i++) {
    const fileId = fileIds[i];
    const permissionFileId = `${permissionId}-${fileId.toString()}`;

    let permissionFile = PermissionFile.load(permissionFileId);
    if (permissionFile == null) {
      permissionFile = new PermissionFile(permissionFileId);
      permissionFile.permission = permission.id;

      // Load or create the file
      let file = File.load(fileId.toString());
      if (file == null) {
        // Create a placeholder file if it doesn't exist
        file = new File(fileId.toString());
        file.owner = grantor.id;
        file.url = "";
        file.addedAtBlock = event.block.number;
        file.addedAtTimestamp = event.block.timestamp;
        file.transactionHash = event.transaction.hash;
        file.save();
      }

      permissionFile.file = file.id;
      permissionFile.save();
    }
  }
}

export function handlePermissionRevoked(event: PermissionRevoked): void {
  log.info("Handling PermissionRevoked for permissionId: {}", [
    event.params.permissionId.toString(),
  ]);

  const permissionId = event.params.permissionId.toString();
  const permission = Permission.load(permissionId);

  if (permission) {
    // Set endBlock to indicate when the permission was revoked
    permission.endBlock = event.block.number;
    permission.save();
  } else {
    log.warning(
      "Received revoke event for a permission not found in subgraph: {}",
      [permissionId],
    );
  }
}
