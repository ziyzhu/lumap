import {IModelApp} from '@bentley/imodeljs-frontend';
import {BuildingMapper} from '../api/Mapper';

export enum UserEvent {
  ZoomIn,
  // more events will be supported
}

/*
 * Handles callbacks for all types of user event
 */
export const handleUserEvent = (matchingKey: string, event: UserEvent) => {
  switch (event) {
    case UserEvent.ZoomIn:
      if (IModelApp && IModelApp.viewManager && IModelApp.viewManager.selectedView && BuildingMapper.mapper) {
        const buildingMapper = BuildingMapper.mapper;
        const ecId = buildingMapper.getEcFromKey(matchingKey);
        const viewport = IModelApp.viewManager.selectedView;
        viewport.zoomToElements(ecId);
      }
      break;
    default:
      console.log('This event is not yet supported');
  }
};
