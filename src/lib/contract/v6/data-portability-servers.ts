import { log, store } from "@graphprotocol/graph-ts";
import {
  ServerRegistered,
  ServerUpdated,
  ServerTrusted,
  ServerUntrusted,
} from "../../../../generated/DataPortabilityServersImplementation/DataPortabilityServersImplementation";
import { Server, UserServer } from "../../../../generated/schema";
import { getOrCreateUser } from "../shared";

export function handleServerRegistered(event: ServerRegistered): void {
  log.info(
    "Handling ServerRegistered with serverId: {}, owner: {}, serverAddress: {}, and url: {}",
    [
      event.params.serverId.toString(),
      event.params.owner.toHexString(),
      event.params.serverAddress.toHexString(),
      event.params.url,
    ],
  );

  const serverId = event.params.serverId.toString();
  let server = Server.load(serverId);

  if (server == null) {
    server = new Server(serverId);
  }

  // Get or create the owner user
  const owner = getOrCreateUser(event.params.owner.toHex());

  server.owner = owner.id;
  server.serverAddress = event.params.serverAddress;
  server.publicKey = event.params.publicKey;
  server.url = event.params.url;
  server.registeredAtBlock = event.block.number;
  server.registeredAtTimestamp = event.block.timestamp;
  server.transactionHash = event.transaction.hash;

  server.save();
}

export function handleServerUpdated(event: ServerUpdated): void {
  log.info("Handling ServerUpdated for serverId: {} with new url: {}", [
    event.params.serverId.toString(),
    event.params.url,
  ]);

  const serverId = event.params.serverId.toString();
  const server = Server.load(serverId);

  if (server) {
    server.url = event.params.url;
    server.save();
  } else {
    log.warning(
      "Received update event for a server not found in subgraph: {}",
      [serverId],
    );
  }
}

export function handleServerTrusted(event: ServerTrusted): void {
  log.info("Handling ServerTrusted for user {} and serverId {}", [
    event.params.user.toHex(),
    event.params.serverId.toString(),
  ]);

  const user = getOrCreateUser(event.params.user.toHex());
  const serverId = event.params.serverId.toString();
  const compositeId = `${user.id}-${serverId}`;

  // Ensure server exists
  const server = Server.load(serverId);
  if (server == null) {
    log.error("Server with id {} not found for trust relationship", [serverId]);
    return;
  }

  let userServer = UserServer.load(compositeId);
  if (userServer == null) {
    userServer = new UserServer(compositeId);
    userServer.user = user.id;
    userServer.server = server.id;
  }

  userServer.trustedAt = event.block.timestamp;
  userServer.trustedAtBlock = event.block.number;
  userServer.transactionHash = event.transaction.hash;
  userServer.save();
}

export function handleServerUntrusted(event: ServerUntrusted): void {
  log.info("Handling ServerUntrusted for user {} and serverId {}", [
    event.params.user.toHex(),
    event.params.serverId.toString(),
  ]);

  const userId = event.params.user.toHex();
  const serverId = event.params.serverId.toString();
  const compositeId = `${userId}-${serverId}`;

  const userServer = UserServer.load(compositeId);
  if (userServer != null) {
    // Set the untrusted block instead of removing the entity
    userServer.untrustedAtBlock = event.block.number;
    userServer.save();
  } else {
    log.warning(
      "Attempted to untrust a server relationship that was not found: {}",
      [compositeId],
    );
  }
}
