import {IModelConnection} from '@bentley/imodeljs-frontend';

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
  buildingName: string;
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

export class GenericDataObject {
  key: string;
  data: IGenericData;
  constructor(key: string, data: IGenericData) {
    this.key = key;
    this.data = data;
  }
}

export class BuildingDataObject extends GenericDataObject {
  data: IBuildingData;
  constructor(key: string, data: IBuildingData) {
    super(key, data);
    this.key = key;
    this.data = data;
  }
}

abstract class GenericMapper {
  public ecToKeyTable;
  public keyToDataTable;
  public keyToEcTable;
  static mapper;

  constructor() {
    this.ecToKeyTable = {};
    this.keyToDataTable = {};
    this.keyToEcTable = {};
    GenericMapper.mapper = this;
    console.log(this);
  }

  // Asynchronously returns the queried rows
  public async asyncQuery(imodel: IModelConnection, q: string): Promise<any[]> {
    const rows: any[] = [];
    for await (const row of imodel.query(q)) rows.push(row);
    return rows;
  }
}

export class BuildingMapper extends GenericMapper {
  public keyToDataTable: {[matchingKey: string]: BuildingDataObject};

  constructor() {
    super();
    // uses building number as the matching key to connect imodel and data
    this.ecToKeyTable = {};
    this.keyToDataTable = {};
    this.keyToEcTable = {};
  }

  public async init(imodel: IModelConnection) {
    this.ecToKeyTable = await this.createEcToKeyTable(imodel);
    this.keyToEcTable = this.createKeyToEcTable();
    this.keyToDataTable = this.createKeyToDataTable();
    BuildingMapper.mapper = this;
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
        buildingName: bName,
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
      const objectKey = this.keyToEcTable[data.matchingKey];
      const newDataObject = new BuildingDataObject(objectKey, data);
      keyToDataTable[data.matchingKey] = newDataObject;
    }

    return keyToDataTable;
  }

  getDataObjects(): BuildingDataObject[] {
    return Object.values(this.keyToDataTable).filter(item => item !== undefined);
  }

  // Returns a single object from a ecinstance ID
  getDataFromEc(ecInstanceId: string): BuildingDataObject {
    return this.keyToDataTable[this.ecToKeyTable[ecInstanceId]];
  }

  // Returns multiple objects from a set of ecinstance ID's
  getDataFromEcSet(ecInstanceIdSet: Set<string>): BuildingDataObject[] {
    const ecInstanceIdList = Array.from(ecInstanceIdSet);
    let objects: BuildingDataObject[] = [];
    for (const ecInstanceId of ecInstanceIdList) {
      objects.push(this.keyToDataTable[this.ecToKeyTable[ecInstanceId]]);
    }
    return objects;
  }

  getKeyFromEc(ecId: string) {
    return this.ecToKeyTable[ecId];
  }

  getEcFromKey(matchingKey: string) {
    return this.keyToEcTable[matchingKey];
  }
}
