import {IModelConnection} from '@bentley/imodeljs-frontend';
import {EmphasizeElementManager} from './EmphasizeElementManager';

interface IGenericData {
  objectId: string;
}

// represents PI data structure
interface IDynamicValue {
  value: string;
  unitAbbreviation: string;
  timestamp: string;
  good: boolean;
}

// represents PI data structure
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

  // Asynchronously returns the queried rows
  public async asyncQuery(imodel: IModelConnection, q: string): Promise<any[]> {
    const rows: any[] = [];
    for await (const row of imodel.query(q)) rows.push(row);
    return rows;
  }
}

export class BuildingMapper extends GenericMapper {
  constructor() {
    super();
    // uses building number as the bridge key to connect imodel and data
    this.bridge = undefined;
    this.table = undefined;
  }

  // Asynchronously creates a matching table: ecinstance ID => Matching Key
  // Note; must be called upon construction
  public async createBridge(imodel: IModelConnection) {
    // closure function to remove leading zero in a string
    const adaptor = (s: string) => s.replace(/^0+/, '');

    const bridge: {[ecInstanceId: string]: string} = {};
    const imodelBuildings = await this.asyncQuery(imodel, 'select * from DgnCustomItemTypes_Building.Building__x0020__InformationElementAspect;');

    for (const building of imodelBuildings) {
      bridge[building.element.id] = adaptor(building.building__x0020__Number);
    }

    this.bridge = bridge;
  }

  // Synchronously creates a matching table: Matching Key => Data Object.
  // Note; must be called upon construction
  public createTable() {
    const table: {[bridgeKey: string]: BuildingDataObject} = {};
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
      const buildingNumber = data['buildingNumber']['value'];
      table[buildingNumber] = newDataObject;
    }

    this.table = table;
  }

  // Returns a single object from a ecinstance ID
  getDataObject(ecInstanceId: string): BuildingDataObject {
    return this.table[this.bridge[ecInstanceId]];
  }

  // Returns multiple objects from a set of ecinstance ID's
  getDataObjects(ecInstanceIdSet: Set<string>): BuildingDataObject[] {
    const ecInstanceIdList = Array.from(ecInstanceIdSet);
    let objects: BuildingDataObject[] = [];
    for (const ecInstanceId of ecInstanceIdList) {
      objects.push(this.table[this.bridge[ecInstanceId]]);
    }
    return objects;
  }
}
