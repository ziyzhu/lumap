import * as React from 'react';
import {Drawer, Button, Classes, Position} from '@blueprintjs/core';

export default class DrawerComponent extends React.Component {
  public state = {
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

  private handleOpen = () => this.setState({isOpen: true});
  private handleClose = () => this.setState({isOpen: false});

  render() {
    return (
      <>
        <Button style={{position: 'fixed', top: '20px', left: '20px'}} rightIcon="arrow-right" onClick={this.handleOpen}>
          Show Drawer
        </Button>
        <Drawer onClose={this.handleClose} title="Lehigh Map" {...this.state}>
          <div className={Classes.DRAWER_BODY}>
            <div className={Classes.DIALOG_BODY}></div>
          </div>
          <div className={Classes.DRAWER_FOOTER}>Footer</div>
        </Drawer>
      </>
    );
  }
}
