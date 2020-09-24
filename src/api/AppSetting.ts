import {IModelConnection} from '@bentley/imodeljs-frontend';
import {EmphasizeElementManager} from './EmphasizeElementManager';

export class AppSetting {
  constructor(imodel: IModelConnection) {
    const manager = new EmphasizeElementManager(imodel.selectionSet);
  }
  public apply() {
    // TODO insert the instructions that need to be executed upon app's initialization
  }
}
