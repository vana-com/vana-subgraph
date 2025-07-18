import {
  log,
  store,
  BigInt as GraphBigInt,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  PermissionAdded,
  PermissionRevoked,
  ServerTrusted,
  ServerUntrusted,
  DataPermissionImplementation,
} from "../../../../generated/DataPermissionImplementation/DataPermissionImplementation";
import { Permission, Server } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";

export function handlePermissionAdded(event: PermissionAdded): void {
  log.info("Handling PermissionAdded with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const grantor = getOrCreateUser(event.params.user.toHex());
  const permissionId = event.params.permissionId;

  const permission = new Permission(permissionId.toString());
  permission.grantor = grantor.id; // Renamed from 'user' to 'grantor'
  permission.grant = event.params.grant;
  permission.addedAtBlock = event.block.number;
  permission.addedAtTimestamp = event.block.timestamp;
  permission.transactionHash = event.transaction.hash;

  // Set new fields
  permission.isActive = true; // New permissions are active by default
  permission.fileIds = event.params.fileIds; // Store the new fileIds array

  // Since nonce and signature are not in the event, we must call the contract.
  const contract = DataPermissionImplementation.bind(event.address);
  const permissionData = contract.try_permissions(permissionId);

  if (!permissionData.reverted) {
    // The returned struct has a 'grantor' field, not 'user'
    permission.nonce = permissionData.value.nonce;
    permission.signature = permissionData.value.signature;
  } else {
    log.warning(
      "Could not get permission data for id {}. Nonce and signature will be zero.",
      [permissionId.toString()],
    );
    permission.nonce = GraphBigInt.zero();
    permission.signature = new Bytes(0);
  }

  permission.save();
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
  } else {
    log.warning(
      "Received revoke event for a permission not found in subgraph: {}",
      [permissionId],
    );
  }
}

export function handleServerTrusted(event: ServerTrusted): void {
  log.info("Handling ServerTrusted for user {} and server {}", [
    event.params.user.toHex(),
    event.params.serverId.toHex(),
  ]);

  const user = getOrCreateUser(event.params.user.toHex());
  const serverId = event.params.serverId;
  const compositeId = `${user.id}-${serverId.toHex()}`;

  let server = Server.load(compositeId);
  if (server == null) {
    server = new Server(compositeId);
    server.user = user.id;
    server.serverAddress = serverId;
  }

  server.serverUrl = event.params.serverUrl;
  server.trustedAt = event.block.timestamp;
  server.save();
}

export function handleServerUntrusted(event: ServerUntrusted): void {
  log.info("Handling ServerUntrusted for user {} and server {}", [
    event.params.user.toHex(),
    event.params.serverId.toHex(),
  ]);

  const userId = event.params.user.toHex();
  const serverId = event.params.serverId.toHex();
  const compositeId = `${userId}-${serverId}`;

  const server = Server.load(compositeId);
  if (server != null) {
    store.remove("Server", compositeId);
  } else {
    log.warning("Attempted to untrust a server that was not found: {}", [
      compositeId,
    ]);
  }
}
