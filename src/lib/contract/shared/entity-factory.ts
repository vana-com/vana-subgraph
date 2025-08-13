import { BigInt as GraphBigInt } from "@graphprotocol/graph-ts";

/**
 * Generic function to get or create an entity with initialization
 * @param id - The entity ID
 * @param loadFunction - Function to load the entity
 * @param createFunction - Function to create the entity
 * @param initFunction - Function to initialize the entity
 * @returns The loaded or created entity
 */
export function getOrCreateEntity<T>(
  id: string,
  loadFunction: (id: string) => T | null,
  createFunction: (id: string) => T,
  initFunction?: (entity: T) => void,
): T {
  let entity = loadFunction(id);
  if (entity == null) {
    entity = createFunction(id);
    if (initFunction) {
      initFunction(entity);
    }
    // Note: entities should be saved in the initFunction or by the caller
  }
  return entity;
}

/**
 * Generic initialization function for entities with zero BigInt fields
 * @param entity - The entity to initialize
 * @param fields - Array of field names to initialize with zero
 */
export function initializeZeroFields(entity: any, fields: string[]): void {
  for (let i = 0; i < fields.length; i++) {
    entity[fields[i]] = GraphBigInt.zero();
  }
}

/**
 * Creates an entity with the save operation
 * @param id - The entity ID
 * @param entityConstructor - Constructor function for the entity
 * @param initFunction - Optional initialization function
 * @returns The created and saved entity
 */
export function createAndSaveEntity<T>(
  id: string,
  entityConstructor: (id: string) => T,
  initFunction?: (entity: T) => void,
): T {
  const entity = entityConstructor(id);
  if (initFunction) {
    initFunction(entity);
  }
  // Assuming all entities have a save method
  (entity as any).save();
  return entity;
}
