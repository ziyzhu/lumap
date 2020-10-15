import {IModelConnection} from '@bentley/imodeljs-frontend';
import GoogleConfig from '../api/GoogleConfig';
import {PIDataIntegrator} from '../api/PIDataIntegrator';

export class BuildingDataObject {
  key: string;
  name: string;
  piWebId?: string;
  sheetData?: any;
  constructor(key: string) {
    this.key = key;
  }
}

export class BuildingMapper {

  public ecToKeyTable;
  public keyToEcTable: {};
  public keyToDataTable: {[key: string]: BuildingDataObject};
  static current;

  constructor() {
    this.ecToKeyTable = {};
    this.keyToDataTable = {};
    this.keyToEcTable = {};
  }

  public async init(imodel: IModelConnection) {
    this.ecToKeyTable = await this.createEcToKeyTable(imodel);
    this.keyToEcTable = this.createKeyToEcTable();
    this.keyToDataTable = await this.createKeyToDataTable();
    BuildingMapper.current = this;
    await this.addPiData();
    this.addSheetData();
  }

  public async createEcToKeyTable(imodel: IModelConnection) {
    const adaptor = (s: string) => s.replace(/^0+/, '');
    const ecToKeyTable: {[ecInstanceId: string]: string} = {};
    const imodelBuildings = await this.asyncQuery(imodel, 'select * from DgnCustomItemTypes_Building.Building__x0020__InformationElementAspect;');
    for (const building of imodelBuildings) {
      ecToKeyTable[building.element.id] = adaptor(building.building__x0020__Number);
    }
    return ecToKeyTable;
  }

  public createKeyToEcTable() {
    const keyToEcTable = {};
    Object.keys(this.ecToKeyTable).forEach(key => {
      keyToEcTable[this.ecToKeyTable[key]] = key;
    });
    return keyToEcTable;
  }

  public async createKeyToDataTable() {
    const keyToDataTable: {[matchingKey: string]: BuildingDataObject} = {};
    for (const key in this.keyToEcTable) {
      keyToDataTable[key] = new BuildingDataObject(key);
    }
    return keyToDataTable;
  }

  public async asyncQuery(imodel: IModelConnection, q: string): Promise<any[]> {
    const rows: any[] = [];
    for await (const row of imodel.query(q)) rows.push(row);
    return rows;
  }

  getDataObjects(): BuildingDataObject[] {
    return Object.values(this.keyToDataTable).filter(item => item !== undefined);
  }

  getDataFromKey(matchingKey: string): BuildingDataObject {
    return this.keyToDataTable[matchingKey];
  }

  getDataFromEc(ecInstanceId: string): BuildingDataObject {
    return this.keyToDataTable[this.ecToKeyTable[ecInstanceId]];
  }

  getDataFromEcSet(ecInstanceIdSet: Set<string>): BuildingDataObject[] {
    const ecInstanceIdList = Array.from(ecInstanceIdSet);
    let objects: BuildingDataObject[] = [];
    for (const ecInstanceId of ecInstanceIdList) {
      objects.push(this.getDataFromEc(ecInstanceId));
    }
    return objects;
  }

  getKeyFromEc(ecId: string) {
    return this.ecToKeyTable[ecId];
  }

  getEcFromKey(matchingKey: string) {
    return this.keyToEcTable[matchingKey];
  }

  async addPiData() {
    const proxyUrl = "https://lehighmap.csb.lehigh.edu:5000/api/piwebapi";
    const baseUrl = "https://pi-core.cc.lehigh.edu/piwebapi";
    const integrator = new PIDataIntegrator(proxyUrl, baseUrl);

    const rawResponse = await fetch('https://lehighmap.csb.lehigh.edu:5000/api/webidmap');
    const parsedResponse: any = await rawResponse.json();
    const piWebIdMap = parsedResponse;
    for (const buildingNumber in parsedResponse) {
      if (this.keyToDataTable[buildingNumber]) {
        this.keyToDataTable[buildingNumber].piWebId = parsedResponse[buildingNumber];
      }
    }
  }

  // TODO integrate Doug's google sheet data here 
  addSheetData() {
    const mergeData = (sheetData: any) => {
      if (this.keyToDataTable[sheetData.matchingKey]) {
        this.keyToDataTable[sheetData.matchingKey].sheetData = sheetData;
      }
    }

    const handler = (response, error) => {
      console.log('Error: ' + JSON.stringify(error));
      const sheetData = response.data;
      sheetData.slice(1).forEach(row => {
        const dataItem: any = row;
        mergeData(dataItem);
      });
    };

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
