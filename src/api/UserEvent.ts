import {IModelApp, EmphasizeElements} from '@bentley/imodeljs-frontend';
import {BuildingMapper} from '../api/Mapper';
import {EmphasizeElementManager, ActionType} from '../api/EmphasizeElementManager';

export enum UserEvent {
  ZoomIn,
  Highlight,
  Clear,
  // more events will be supported
}

/*
 * Handles callbacks for all types of user event
 */
export const handleUserEvent = (matchingKey: string, event: UserEvent) => {
  const buildingMapper = BuildingMapper.mapper;
  const ecId = buildingMapper.getEcFromKey(matchingKey);
  const manager = EmphasizeElementManager.current;
  switch (event) {
    case UserEvent.ZoomIn:
      if (IModelApp && IModelApp.viewManager && IModelApp.viewManager.selectedView && BuildingMapper.mapper) {
        const viewport = IModelApp.viewManager.selectedView;
        viewport.zoomToElements(ecId);
      }
      break;
    case UserEvent.Highlight:
      manager.selectionSet.emptyAll();
      manager.selectionSet.add(ecId);
      manager.runAction(ActionType.ColorRed);
      break;
    case UserEvent.Clear:
      manager.selectionSet.emptyAll();
      manager.selectionSet.add(ecId);
      manager.runAction(ActionType.ColorBlue);
      break;

    default:
      console.log('This event is not yet supported');
  }
};
