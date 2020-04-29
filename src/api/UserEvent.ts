import {IModelApp, EmphasizeElements} from '@bentley/imodeljs-frontend';
import {BuildingMapper} from '../api/Mapper';
import {EmphasizeElementManager, ActionType} from '../api/EmphasizeElementManager';
import {ColorDef} from '@bentley/imodeljs-common';

export enum UserEvent {
  ZoomIn,
  Highlight,
  Isolate,
  Clear,
  // more events will be supported
}

/*
 * Handles callbacks for all types of user event
 */
export const handleUserEvent = (matchingKey: string, event: UserEvent) => {
  if (!IModelApp || !IModelApp.viewManager || !IModelApp.viewManager.selectedView || !BuildingMapper.mapper) {
    return;
  }

  const buildingMapper = BuildingMapper.mapper;
  const ecId = buildingMapper.getEcFromKey(matchingKey);
  const manager = EmphasizeElementManager.current;
  const viewport = IModelApp.viewManager.selectedView;
  const emph = EmphasizeElements.getOrCreate(viewport);

  switch (event) {
    case UserEvent.ZoomIn:
      viewport.zoomToElements(ecId, {animateFrustumChange: true});
      break;
    case UserEvent.Highlight:
      emph.overrideElements(ecId, viewport, ColorDef.red);
      break;
    case UserEvent.Isolate:
      emph.isolateElements(ecId, viewport);
      break;
    case UserEvent.Clear:
      EmphasizeElements.clear(viewport);
      break;

    default:
      console.log('This event is not yet supported');
  }
};
