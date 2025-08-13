import { log } from "@graphprotocol/graph-ts";

/**
 * Generic entity loader with error handling
 * @param entityType - The entity type (for logging)
 * @param entityId - The entity ID to load
 * @param loadFunction - Function to load the entity
 * @param context - Optional context for error logging
 * @returns The loaded entity or null if not found
 */
export function loadEntityWithErrorHandling<T>(
  entityType: string,
  entityId: string,
  loadFunction: (id: string) => T | null,
  context?: string,
): T | null {
  const entity = loadFunction(entityId);
  if (entity == null) {
    const message = context
      ? `${entityType} not found for ${context}: {}`
      : `${entityType} not found: {}`;
    log.error(message, [entityId]);
  }
  return entity;
}

/**
 * Safely adds an item to an array if it doesn't already exist
 * @param array - The array to add to
 * @param item - The item to add
 * @returns True if item was added, false if it already existed
 */
export function addToArrayIfNotExists<T>(array: T[], item: T): boolean {
  const index = array.indexOf(item);
  if (index === -1) {
    array.push(item);
    return true;
  }
  return false;
}

/**
 * Safely removes an item from an array
 * @param array - The array to remove from
 * @param item - The item to remove
 * @returns True if item was removed, false if it wasn't found
 */
export function removeFromArray<T>(array: T[], item: T): boolean {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
    return true;
  }
  return false;
}
