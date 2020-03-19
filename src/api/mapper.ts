import {EmphasizeElementManager} from './EmphasizeElementManager';

interface IDynamicValue {
  value: string;
  unitAbbreviation: string;
  timestamp: string;
  good: boolean;
}

interface IGenericData {
  objectId: string;
}

export interface IBuildingData extends IGenericData {
  yearBuilt: IDynamicValue;
  monthlyAverageWatts: IDynamicValue;
  longitude: IDynamicValue;
  latitude: IDynamicValue;
  campus: IDynamicValue;
  buildingType: IDynamicValue;
  buildingNumber: IDynamicValue;
  address: IDynamicValue;
  about: IDynamicValue;
  dailyPower: IDynamicValue;
  dailyEnergy: IDynamicValue;
}

class GenericDataObject {
  data: IGenericData;
  constructor(data: IGenericData) {
    this.data = data;
  }
}

class BuildingDataObject extends GenericDataObject {
  data: IBuildingData;
  constructor(data: IBuildingData) {
    super(data);
    this.data = data;
  }
}

abstract class GenericMapper {
  public bridge;
  public table;
  constructor() {
    this.bridge = {};
    this.table = {};
  }
}

export class BuildingMapper extends GenericMapper {
  constructor() {
    super();
    this.bridge = {
      '0x129128': 'Steps1',
      '0xFF2B3': 'PackardLab',
      '0xFF2B4': 'Alumni',
      '0x1ffd8': 'Linderman',
    };
    this.table = this.createTable();
  }

  // must be called immediately upon construction
  public createTable() {
    const table: {[ecInstanceId: string]: BuildingDataObject} = {};
    // use external data
    const bDict: any = require('./PI_Shark_Meter_Frozen_Data.json');
    for (const bName in bDict) {
      // building object
      const bObject: any = bDict[bName];
      // attribute dictionary
      const bAttrDict: {[attrName: string]: IDynamicValue} = {};

      for (const bAttr in bObject) {
        // ignore detailed meter data
        if (bAttr === 'Amps A') break;

        const value: IDynamicValue = {
          value: bObject[bAttr]['Value'],
          unitAbbreviation: bObject[bAttr]['UnitsAbbreviation'],
          timestamp: bObject[bAttr]['Timestamp'],
          good: bObject[bAttr]['Good'],
        };
        bAttrDict[bAttr] = value;
      }

      // map original data to class attribute
      const data: IBuildingData = {
        objectId: bName,
        yearBuilt: bAttrDict['YearBuilt'],
        monthlyAverageWatts: bAttrDict['Monthly Average Watts'],
        longitude: bAttrDict['Longitude'],
        latitude: bAttrDict['Latitude'],
        campus: bAttrDict['Campus'],
        buildingType: bAttrDict['BuildingType'],
        buildingNumber: bAttrDict['BuildingNumber'],
        address: bAttrDict['Address'],
        about: bAttrDict['About'],
        dailyPower: bAttrDict['Daily Power'],
        dailyEnergy: bAttrDict['Daily Energy'],
      };

      // add new data object as a new entry to the data lookup table
      const newDataObject = new BuildingDataObject(data);
      table[bName] = newDataObject;
    }
    return table;
  }

  getDataObject(ecInstanceId: string): BuildingDataObject {
    return this.table[ecInstanceId];
  }

  getDataObjects(ecInstanceIdList: string[]): BuildingDataObject[] {
    let objects: BuildingDataObject[] = [];
    for (const ecInstanceId of ecInstanceIdList) {
      objects.push(this.table[ecInstanceId]);
    }
    return objects;
  }
}
