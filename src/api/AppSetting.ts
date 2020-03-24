import {BuildingMapper} from './Mapper';
import {IModelConnection} from '@bentley/imodeljs-frontend';

export class AppSetting {
  public buildingMapper: BuildingMapper;
  constructor(imodel: IModelConnection) {
    this.buildingMapper = new BuildingMapper();
    this.buildingMapper.init(imodel).then(() => {
      console.log(this.buildingMapper.ecToKeyTable);
      console.log(this.buildingMapper.keyToEcTable);
      console.log(this.buildingMapper.keyToDataTable);
    });
  }
  public apply() {
    // TODO to be implemented
  }
}
