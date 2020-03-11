import * as React from 'react';
import {Drawer} from '@blueprintjs/core';

export default class SideMenu extends React.Component {
  render() {
    return <Drawer size="30%" canOutsideClickClose={false} hasBackdrop={false} isOpen={true} />;
  }
}
