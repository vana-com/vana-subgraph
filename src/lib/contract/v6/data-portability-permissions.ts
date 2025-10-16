import {
  log,
  store,
  BigInt as GraphBigInt,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  PermissionAdded,
  PermissionRevoked,
  PermissionCreated,
  FileAddedToPermission,
  FileRemovedFromPermission,
  DataPortabilityPermissionsImplementation,
} from "../../../../generated/DataPortabilityPermissionsImplementation/DataPortabilityPermissionsImplementation";
import {
  Permission,
  Grantee,
  PermissionFile,
  File,
} from "../../../../generated/schema";
import { getOrCreateUser, getOrCreateGrantee } from "../shared";

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

  // Ensure grantee exists (create placeholder if needed)
  const grantee = getOrCreateGrantee(granteeId);

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
  const permissionData = contract.try_permissions(event.params.permissionId);

  if (!permissionData.reverted) {
    permission.nonce = permissionData.value.nonce;
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
      permissionFile.startBlock = permission.startBlock;
      permissionFile.endBlock = permission.endBlock;
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

export function handlePermissionCreated(event: PermissionCreated): void {
  log.info(
    "Handling PermissionCreated with permissionId: {} for grantor: {} and granteeId: {}",
    [
      event.params.permissionId.toString(),
      event.params.grantor.toHexString(),
      event.params.granteeId.toString(),
    ],
  );

  const grantor = getOrCreateUser(event.params.grantor.toHex());
  const permissionId = event.params.permissionId.toString();
  const granteeId = event.params.granteeId.toString();

  // Ensure grantee exists (create placeholder if needed)
  const grantee = getOrCreateGrantee(granteeId);

  // Create permission
  const permission = new Permission(permissionId);
  permission.grantor = grantor.id;
  permission.grantee = grantee.id;
  permission.grant = event.params.grant;
  permission.addedAtBlock = event.block.number;
  permission.addedAtTimestamp = event.block.timestamp;
  permission.transactionHash = event.transaction.hash;
  permission.startBlock = event.params.blockNumber;
  permission.endBlock = null;

  // Get nonce and signature from contract
  const contract = DataPortabilityPermissionsImplementation.bind(event.address);
  const permissionData = contract.try_permissions(event.params.permissionId);

  if (!permissionData.reverted) {
    permission.nonce = permissionData.value.nonce;
  } else {
    log.warning(
      "Could not get permission data for id {}. Nonce will be zero.",
      [permissionId],
    );
    permission.nonce = GraphBigInt.zero();
  }

  permission.signature = new Bytes(0);
  permission.save();
}

export function handleFileAddedToPermission(
  event: FileAddedToPermission,
): void {
  log.info(
    "Handling FileAddedToPermission with permissionId: {} and fileId: {}",
    [event.params.permissionId.toString(), event.params.fileId.toString()],
  );

  const permissionId = event.params.permissionId.toString();
  const fileId = event.params.fileId.toString();
  const permissionFileId = `${permissionId}-${fileId}`;

  // Load the permission
  const permission = Permission.load(permissionId);
  if (!permission) {
    log.warning("Permission {} not found for FileAddedToPermission event", [
      permissionId,
    ]);
    return;
  }

  // Create or update PermissionFile
  let permissionFile = PermissionFile.load(permissionFileId);
  if (permissionFile == null) {
    permissionFile = new PermissionFile(permissionFileId);
    permissionFile.permission = permission.id;

    // Load or create the file
    let file = File.load(fileId);
    if (file == null) {
      // Create a placeholder file if it doesn't exist
      file = new File(fileId);
      file.owner = permission.grantor;
      file.url = "";
      file.schemaId = GraphBigInt.zero();
      file.addedAtBlock = event.block.number;
      file.addedAtTimestamp = event.block.timestamp;
      file.transactionHash = event.transaction.hash;
      file.save();
    }

    permissionFile.file = file.id;
  }

  // Set start and end blocks from the event
  permissionFile.startBlock = event.params.startBlock;
  permissionFile.endBlock = event.params.endBlock;
  permissionFile.save();
}

export function handleFileRemovedFromPermission(
  event: FileRemovedFromPermission,
): void {
  log.info(
    "Handling FileRemovedFromPermission with permissionId: {} and fileId: {}",
    [event.params.permissionId.toString(), event.params.fileId.toString()],
  );

  const permissionId = event.params.permissionId.toString();
  const fileId = event.params.fileId.toString();
  const permissionFileId = `${permissionId}-${fileId}`;

  // Load the PermissionFile
  const permissionFile = PermissionFile.load(permissionFileId);
  if (permissionFile) {
    // Set endBlock to indicate when the file was removed
    permissionFile.endBlock = event.params.blockNumber;
    permissionFile.save();
  } else {
    log.warning(
      "PermissionFile {} not found for FileRemovedFromPermission event",
      [permissionFileId],
    );
  }
}
