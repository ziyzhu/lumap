import {IModelConnection} from '@bentley/imodeljs-frontend';
import GoogleConfig from '../api/GoogleConfig';

interface IGenericData {
  matchingKey: string;
}

interface IDynamicValue {
  value: string;
  unitAbbreviation: string;
  timestamp: string;
  good: boolean;
}

export interface IBuildingData extends IGenericData {
  buildingName: string;
  yearBuilt: IDynamicValue;
  monthlyAverageWatts: IDynamicValue;
  longitude: IDynamicValue;
  latitude: IDynamicValue;
  campus: IDynamicValue;
  buildingType: IDynamicValue;
  address: IDynamicValue;
  buildingNumber: IDynamicValue;
  about: IDynamicValue;
  dailyPower: IDynamicValue;
  dailyEnergy: IDynamicValue;
}

export interface ISheetData extends IGenericData {
  buildingNumber: string;
  buildingName: string;
  waterUsage: string;
  waterUsageUnit: string;
  gasUsage: string;
  gasUsageUnit: string;
  timestamp: string;
  condition: string;
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
  sheetData: ISheetData | {};
  constructor(key: string, data: IBuildingData) {
    super(key, data);
    this.key = key;
    this.data = data;
    this.sheetData = {};
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
  }

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
    this.keyToDataTable = await this.createKeyToDataTable();
    BuildingMapper.mapper = this;
    this.pushSheetData();
    setInterval(async () => {
      this.keyToDataTable = await this.createKeyToDataTable();
      this.pushSheetData();
    }, 1800000);
  }

  public mergeData(sheetData: ISheetData) {
    if (this.keyToDataTable[sheetData.matchingKey]) {
      this.keyToDataTable[sheetData.matchingKey].sheetData = sheetData;
    }
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

  // Asynchronously creates a matching table: Matching Key => Data Object.
  // Note; must be called upon construction
  public async createKeyToDataTable() {
    const keyToDataTable: {[matchingKey: string]: BuildingDataObject} = {};

    let bDict;
    try {
      const responseData = await fetch('https://lehighmap.csb.lehigh.edu:5000/api/v1/pi/buildings');
      // for testing only
      // const responseData = await fetch('http://localhost:5000/api/v1/pi/buildings');
      const responseJson: any = await responseData.json();
      bDict = responseJson.buildings;
    } catch (err) {
      const backupData = require('./PI_DATA_SNAPSHOT.json');
      bDict = backupData.buildings;
    }

    for (const buildingNumber in bDict) {
      const bObject: any = bDict[buildingNumber];
      const buildingName = bObject['BuildingName'];
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
        matchingKey: buildingNumber,
        buildingName: buildingName,
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

  getDataFromKey(matchingKey: string): BuildingDataObject {
    return this.keyToDataTable[matchingKey];
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

  pushSheetData() {
    const handler = (response, error) => {
      console.log('Error: ' + JSON.stringify(error));

      const sheetData = response.data;
      let dataItems: ISheetData[] = [];

      sheetData.slice(1).forEach(row => {
        const dataItem: ISheetData = {
          matchingKey: row[1],
          buildingName: row[0],
          buildingNumber: row[1],
          waterUsage: row[2],
          waterUsageUnit: row[3],
          gasUsage: row[4],
          gasUsageUnit: row[5],
          timestamp: row[6],
          condition: row[7],
        };
        //dataItems.push(dataItem);
        this.mergeData(dataItem);
      });
    };

    const initClient = () => {
      window.gapi.client
        .init({
          apiKey: GoogleConfig.apiKey,
          discoveryDocs: GoogleConfig.discoveryDocs,
        })
        .then(() => {
          load(handler);
        });
    };
    window.gapi.load('client', initClient);
  }
}

function load(callback) {
  window.gapi.client.load('sheets', 'v4', () => {
    window.gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: GoogleConfig.spreadsheetId,
        range: 'Sheet1!A1:T',
      })
      .then(
        response => {
          const data = response.result.values;
          callback({data});
        },
        response => {
          callback(false, response.result.error);
        },
      );
  });
}
