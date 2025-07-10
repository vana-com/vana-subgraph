import { log, store, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  PermissionAdded,
  ServerTrusted,
  ServerUntrusted,
  DataPermissionImplementation,
} from "../../../../generated/DataPermissionImplementation/DataPermissionImplementation";
import { Permission, TrustedServer } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";

export function handlePermissionAdded(event: PermissionAdded): void {
  log.info("Handling PermissionAdded with transaction hash: {}", [
    event.transaction.hash.toHexString(),
  ]);

  const user = getOrCreateUser(event.params.user.toHex());
  const permissionId = event.params.permissionId;

  const permission = new Permission(permissionId.toString());
  permission.user = user.id;
  permission.grant = event.params.grant;
  permission.addedAtBlock = event.block.number;
  permission.addedAtTimestamp = event.block.timestamp;
  permission.transactionHash = event.transaction.hash;

  // Since nonce and signature are not in the event, we must call the contract.
  const contract = DataPermissionImplementation.bind(event.address);
  const permissionData = contract.try_permissions(permissionId);

  if (!permissionData.reverted) {
    // FIX: Access properties directly instead of using getters.
    permission.nonce = permissionData.value.nonce;
    permission.signature = permissionData.value.signature;
  } else {
    log.warning(
      "Could not get permission data for id {}. Nonce and signature will be zero.",
      [permissionId.toString()],
    );
    permission.nonce = BigInt.zero();
    // FIX: Use an empty Bytes array for an empty signature.
    permission.signature = new Bytes(0);
  }

  permission.save();
}

export function handleServerTrusted(event: ServerTrusted): void {
  log.info("Handling ServerTrusted for user {} and server {}", [
    event.params.user.toHex(),
    event.params.serverId.toHex(),
  ]);

  const user = getOrCreateUser(event.params.user.toHex());
  const serverId = event.params.serverId;
  const compositeId = user.id + "-" + serverId.toHex();

  let trustedServer = TrustedServer.load(compositeId);
  if (trustedServer == null) {
    trustedServer = new TrustedServer(compositeId);
    trustedServer.user = user.id;
    trustedServer.serverAddress = serverId;
  }

  trustedServer.serverUrl = event.params.serverUrl;
  trustedServer.trustedAt = event.block.timestamp;
  trustedServer.save();
}

export function handleServerUntrusted(event: ServerUntrusted): void {
  log.info("Handling ServerUntrusted for user {} and server {}", [
    event.params.user.toHex(),
    event.params.serverId.toHex(),
  ]);

  const userId = event.params.user.toHex();
  const serverId = event.params.serverId.toHex();
  const compositeId = userId + "-" + serverId;

  const trustedServer = TrustedServer.load(compositeId);
  if (trustedServer != null) {
    store.remove("TrustedServer", compositeId);
  } else {
    log.warning("Attempted to untrust a server that was not found: {}", [
      compositeId,
    ]);
  }
}
