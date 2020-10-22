import * as React from 'react';
import {Classes, Dialog} from '@blueprintjs/core';
import {BuildingDataObject} from '../api/Mapper';
import {DataTable} from './DataTable'

interface IPropDataTableDialog {
  isOpen: boolean;
  selectedObjects?: BuildingDataObject[];
  handleClose?: any;
}

interface IStateDataTableDialog {
  isOpen: boolean;
}

export class DataTableDialog extends React.Component<IPropDataTableDialog, IStateDataTableDialog> {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: this.props.isOpen,
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.isOpen !== prevProps.isOpen) {
      this.setState({isOpen: this.props.isOpen});
    }
  }

  private handleClose = () => {
    this.props.handleClose();
    this.setState({isOpen: false});
  };

  render() {
    const { selectedObjects } = this.props;
    return (
      <Dialog style={{width: '660px'}} icon="home" onClose={this.handleClose} title={""/*selectedObjects ? selectedObjects.data.buildingName : 'Building Not Found'*/} {...this.state}>
        <div className={Classes.DIALOG_BODY}>{selectedObjects ? <DataTable selectedObjects={selectedObjects} /> : <h2>The data of this building is missing.</h2>}</div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}></div>
        </div>
      </Dialog>
    );
  }
}

declare global {
  interface Window {
    gapi: any;
  }
}
