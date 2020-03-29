import * as React from 'react';
import {Drawer, Button, Classes, Position} from '@blueprintjs/core';
import {AppSetting} from '../api/AppSetting';
import {BuildingMapper, BuildingDataObject} from '../api/Mapper';
import {handleUserEvent, UserEvent} from '../api/UserEvent';

interface IProps {
  appSetting: AppSetting;
  selectedObjects?: BuildingDataObject[];
}

export default class DrawerComponent extends React.Component<IProps> {
  constructor(props) {
    super(props);
    this.state = {
      autoFocus: true,
      canEscapeKeyClose: true,
      canOutsideClickClose: false,
      enforceFocus: true,
      hasBackdrop: false,
      isOpen: true,
      position: Position.LEFT,
      size: '30%',
      usePortal: true,
    };
  }

  private handleOpen = () => this.setState({isOpen: true});
  private handleClose = () => this.setState({isOpen: false});

  render() {
    // TODO currently used for demo purposes
    const selectedObjects = this.props.selectedObjects;
    let objStrings;
    if (selectedObjects && selectedObjects.length > 0) {
      objStrings = (
        <>
          {selectedObjects.map(obj =>
            obj ? (
              <>
                <p key={obj.data.matchingKey}>
                  <Button onClick={() => handleUserEvent(obj.data.matchingKey, UserEvent.ZoomIn)}>Zoom In</Button>
                  {Object.keys(obj.data).map(k => (
                    <>
                      <p>{k + ': ' + (typeof obj.data[k] === 'string' ? obj.data[k] : obj.data[k].value)}</p>
                    </>
                  ))}
                </p>
                <p> ---- </p>
              </>
            ) : (
              <>
                'undefined building'
                <p> ---- </p>
              </>
            ),
          )}
        </>
      );
    }
    // end

    return (
      <>
        <Button style={{position: 'fixed', top: '20px', left: '20px'}} rightIcon="arrow-right" onClick={this.handleOpen}>
          Show Drawer
        </Button>
        <Drawer onClose={this.handleClose} title="Lehigh Map" {...this.state}>
          <div className={Classes.DRAWER_BODY}>
            <div className={Classes.DIALOG_BODY}>{objStrings}</div>
          </div>
          <div className={Classes.DRAWER_FOOTER}>Footer</div>
        </Drawer>
      </>
    );
  }
}
