import {BuildingMapper} from './mapper';
import {IModelConnection} from '@bentley/imodeljs-frontend';

export class AppSetting {
  public static apply(imodel: IModelConnection) {
    const buildingMapper = new BuildingMapper();
    // TODO further use IModelConnection object
    console.log(buildingMapper.table);
    console.log(imodel.views);
  }
}
