import {BuildingMapper} from './Mapper';
import {IModelConnection} from '@bentley/imodeljs-frontend';

export class AppSetting {
  constructor(imodel: IModelConnection) {
    console.log(imodel.name);
  }
  public apply() {
    // TODO insert the instructions that need to be executed upon app's initialization
  }
}
