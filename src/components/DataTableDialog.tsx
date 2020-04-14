import * as React from 'react';

import {AnchorButton, Button, Classes, Code, Dialog, H5, Intent, Switch, Tooltip} from '@blueprintjs/core';
import {IBuildingData, BuildingDataObject} from '../api/Mapper';

interface IPropDialog {
  isOpen: boolean;
  selectedObject?: BuildingDataObject;
  handleClose?: any;
}
interface IStateDialog {
  isOpen: boolean;
}

export class DataTableDialog extends React.Component<IPropDialog, IStateDialog> {
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
    const {selectedObject} = this.props;
    const {isOpen} = this.state;
    return (
      <Dialog isOpen={isOpen} icon="home" onClose={this.handleClose} title={selectedObject ? selectedObject.data.buildingName : 'Building Not Found'} {...this.state}>
        <div className={Classes.DIALOG_BODY}>{selectedObject ? <DataTable buildingData={selectedObject.data} /> : <h2>The data of this building is missing.</h2>}</div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}></div>
        </div>
      </Dialog>
    );
  }
}

interface IPropTable {
  buildingData: IBuildingData;
}
interface IStateTable {}
export class DataTable extends React.Component<IPropTable, IStateTable> {
  constructor(props) {
    super(props);
  }
  render() {
    const {buildingData} = this.props;
    return (
      <table className="bp3-html-table bp3-interactive">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Last Recorded</th>
            <th>Condition</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Year Built</td>
            <td>{buildingData.yearBuilt.value}</td>
            <td>{buildingData.yearBuilt.unitAbbreviation}</td>
            <td>{buildingData.yearBuilt.timestamp}</td>
            <td>{buildingData.yearBuilt.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Longitude</td>
            <td>{buildingData.longitude.value}</td>
            <td>{buildingData.longitude.unitAbbreviation}</td>
            <td>{buildingData.longitude.timestamp}</td>
            <td>{buildingData.longitude.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Latitude</td>
            <td>{buildingData.latitude.value}</td>
            <td>{buildingData.latitude.unitAbbreviation}</td>
            <td>{buildingData.latitude.timestamp}</td>
            <td>{buildingData.latitude.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Campus</td>
            <td>{buildingData.campus.value}</td>
            <td>{buildingData.campus.unitAbbreviation}</td>
            <td>{buildingData.campus.timestamp}</td>
            <td>{buildingData.campus.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Type</td>
            <td>{buildingData.buildingType.value}</td>
            <td>{buildingData.buildingType.unitAbbreviation}</td>
            <td>{buildingData.buildingType.timestamp}</td>
            <td>{buildingData.buildingType.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Number</td>
            <td>{buildingData.buildingNumber.value}</td>
            <td>{buildingData.buildingNumber.unitAbbreviation}</td>
            <td>{buildingData.buildingNumber.timestamp}</td>
            <td>{buildingData.buildingNumber.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Address</td>
            <td>{buildingData.address.value}</td>
            <td>{buildingData.address.unitAbbreviation}</td>
            <td>{buildingData.address.timestamp}</td>
            <td>{buildingData.address.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building About</td>
            <td>{buildingData.about.value}</td>
            <td>{buildingData.about.unitAbbreviation}</td>
            <td>{buildingData.about.timestamp}</td>
            <td>{buildingData.about.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Daily Power (today)</td>
            <td>{buildingData.dailyPower.value}</td>
            <td>{buildingData.dailyPower.unitAbbreviation}</td>
            <td>{buildingData.dailyPower.timestamp}</td>
            <td>{buildingData.dailyPower.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Daily Eenergy (today)</td>
            <td>{buildingData.dailyEnergy.value}</td>
            <td>{buildingData.dailyEnergy.unitAbbreviation}</td>
            <td>{buildingData.dailyEnergy.timestamp}</td>
            <td>{buildingData.dailyEnergy.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}
