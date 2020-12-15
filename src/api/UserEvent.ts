import {IModelApp, EmphasizeElements} from '@bentley/imodeljs-frontend';
import {BuildingMapper} from '../api/Mapper';
import {EmphasizeElementManager} from '../api/EmphasizeElementManager';
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
export const handleUserEvent = (matchingKeys: string[], event: UserEvent) => {
  if (!IModelApp || !IModelApp.viewManager || !IModelApp.viewManager.selectedView || !BuildingMapper.current) {
    return;
  }

  const buildingMapper = BuildingMapper.current;
  const ecIds: any[] = [];
  for (const matchingKey of matchingKeys) {
      const ecId = buildingMapper.getEcFromKey(matchingKey);
      ecIds.push(ecId);
  }
  const manager = EmphasizeElementManager.current;
  const viewport = IModelApp.viewManager.selectedView;
  const emph = EmphasizeElements.getOrCreate(viewport);

  switch (event) {
    case UserEvent.ZoomIn:
      viewport.zoomToElements(ecIds[0], {animateFrustumChange: true});
      break;
    case UserEvent.Highlight:
      emph.overrideElements(ecIds, viewport, ColorDef.red);
      break;
    case UserEvent.Isolate:
      emph.isolateElements(ecIds, viewport);
      break;
    case UserEvent.Clear:
      EmphasizeElements.clear(viewport);
      break;

    default:
      console.log('This event is not yet supported');
  }
};
