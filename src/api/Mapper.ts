import {IModelConnection} from '@bentley/imodeljs-frontend';
import {EmphasizeElementManager} from './EmphasizeElementManager';

interface IGenericData {
  matchingKey: string;
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
  public ecToKeyTable;
  public keyToDataTable;
  public keyToEcTable;

  constructor() {
    this.ecToKeyTable = {};
    this.keyToDataTable = {};
    this.keyToEcTable = {};
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
    // uses building number as the matching key to connect imodel and data
    this.ecToKeyTable = undefined;
    this.keyToDataTable = undefined;
    this.keyToEcTable = undefined;
  }

  public async init(imodel: IModelConnection) {
    this.ecToKeyTable = await this.createEcToKeyTable(imodel);
    this.keyToEcTable = this.createKeyToEcTable();
    this.keyToDataTable = this.createKeyToDataTable();
  }

  public createKeyToEcTable() {
    const keyToEcTable = {};
    Object.keys(this.ecToKeyTable).forEach(key => {
      keyToEcTable[this.ecToKeyTable[key]] = key;
    });
    return keyToEcTable;
  }

  // Asynchronously creates a matching table: ecinstance ID => Matching Key
  // Note; must be called upon construction
  public async createEcToKeyTable(imodel: IModelConnection) {
    // closure function to remove leading zero in a string
    const adaptor = (s: string) => s.replace(/^0+/, '');

    const ecToKeyTable: {[ecInstanceId: string]: string} = {};
    const imodelBuildings = await this.asyncQuery(imodel, 'select * from DgnCustomItemTypes_Building.Building__x0020__InformationElementAspect;');

    for (const building of imodelBuildings) {
      ecToKeyTable[building.element.id] = adaptor(building.building__x0020__Number);
    }

    return ecToKeyTable;
  }

  // Synchronously creates a matching table: Matching Key => Data Object.
  // Note; must be called upon construction
  public createKeyToDataTable() {
    const keyToDataTable: {[matchingKey: string]: BuildingDataObject} = {};
    // use external data
    const bDict: any = require('./PI_Shark_Meter_Read_Snapshot.json');
    for (const bName in bDict) {
      // building object
      const bObject: any = bDict[bName];
      // attribute dictionary
      const bAttrDict: {[attrName: string]: IDynamicValue} = {};

      for (const bAttr in bObject) {
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
        matchingKey: bAttrDict['BuildingNumber']['value'],
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
      keyToDataTable[buildingNumber] = newDataObject;
    }

    return keyToDataTable;
  }

  // Returns a single object from a ecinstance ID
  getDataObject(ecInstanceId: string): BuildingDataObject {
    return this.keyToDataTable[this.ecToKeyTable[ecInstanceId]];
  }

  // Returns multiple objects from a set of ecinstance ID's
  getDataObjects(ecInstanceIdSet: Set<string>): BuildingDataObject[] {
    const ecInstanceIdList = Array.from(ecInstanceIdSet);
    let objects: BuildingDataObject[] = [];
    for (const ecInstanceId of ecInstanceIdList) {
      objects.push(this.keyToDataTable[this.ecToKeyTable[ecInstanceId]]);
    }
    return objects;
  }
}
