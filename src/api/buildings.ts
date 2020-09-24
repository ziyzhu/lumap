import {IBuildingData} from '../api/Mapper';

export function areBuildingsEqual(buildingA: IBuildingData, buildingB: IBuildingData) {
  // Compare only the titles (ignoring case) just for simplicity.
  return buildingA.matchingKey.toLowerCase() === buildingB.matchingKey.toLowerCase();
}

export function arrayContainsBuilding(buildings: IBuildingData[], buildingToFind: IBuildingData): boolean {
  return buildings.some((building: IBuildingData) => building.matchingKey === buildingToFind.matchingKey);
}
