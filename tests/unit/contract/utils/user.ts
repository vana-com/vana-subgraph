import { log } from "@graphprotocol/graph-ts";
import { User } from "../../../../generated/schema";

export function userDefaults(id: string): User {
  const user = new User(id);
  log.info("User created: {}", [user.id.toString()]);
  return user;
}

export function createNewUser(id: string): User {
  const user = userDefaults(id);
  user.save();
  return user;
}
