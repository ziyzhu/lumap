import {BuildingMapper} from './Mapper';
import {IModelConnection} from '@bentley/imodeljs-frontend';

export class AppSetting {
  public buildingMapper: BuildingMapper;
  constructor(imodel: IModelConnection) {
    this.buildingMapper = new BuildingMapper();
    this.buildingMapper.createBridge(imodel).then(() => {
      console.log(this.buildingMapper.bridge);
    });
    this.buildingMapper.createTable();
  }
  public apply() {
    // TODO to be implemented
    console.log(this.buildingMapper.table);
  }
}
