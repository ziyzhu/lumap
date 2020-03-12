import {IModelApp, EmphasizeElements, ScreenViewport, FeatureOverrideType} from '@bentley/imodeljs-frontend';
import {ColorDef} from '@bentley/imodeljs-common';

export enum ActionType {
  Emphasize = 'Emphasize',
  Isolate = 'Isolate',
  Hide = 'Hide',
  Override = 'Color',
}

abstract class EmphasizeActionBase {
  protected abstract execute(emph: EmphasizeElements, vp: ScreenViewport): boolean;

  public run(): boolean {
    const vp = IModelApp.viewManager.selectedView;

    if (undefined === vp) {
      return false;
    }

    const emph = EmphasizeElements.getOrCreate(vp);
    return this.execute(emph, vp);
  }
}

class EmphasizeAction extends EmphasizeActionBase {
  private _wantEmphasis: boolean;

  public constructor(wantEmphasis: boolean) {
    super();
    this._wantEmphasis = wantEmphasis;
  }
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.wantEmphasis = this._wantEmphasis;
    emph.emphasizeSelectedElements(vp);
    return true;
  }
}

class ClearEmphasizeAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearEmphasizedElements(vp);
    return true;
  }
}

class HideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.hideSelectedElements(vp);
    return true;
  }
}

class ClearHideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearHiddenElements(vp);
    return true;
  }
}

class IsolateAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.isolateSelectedElements(vp);
    return true;
  }
}

class ClearIsolateAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearIsolatedElements(vp);
    return true;
  }
}

class OverrideAction extends EmphasizeActionBase {
  private _colorValue: ColorDef;

  public constructor(colorValue: ColorDef) {
    super();
    this._colorValue = colorValue;
  }

  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.overrideSelectedElements(vp, this._colorValue, FeatureOverrideType.ColorOnly, false, true);
    return true;
  }
}

class ClearOverrideAction extends EmphasizeActionBase {
  public execute(emph: EmphasizeElements, vp: ScreenViewport): boolean {
    emph.clearOverriddenElements(vp);
    return true;
  }
}

export class EmphasizeElementManager {
  static runAction = (type: ActionType) => {
    switch (type) {
      default:
      case ActionType.Emphasize: {
        const action = new EmphasizeAction(true);
        action.run();
        break;
      }
      case ActionType.Isolate: {
        const action = new IsolateAction();
        action.run();
        break;
      }
      case ActionType.Hide: {
        const action = new HideAction();
        action.run();
        break;
      }
      case ActionType.Override: {
        const action = new OverrideAction(ColorDef.red);
        action.run();
        break;
      }
    }
  };
}
