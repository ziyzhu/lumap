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
    return (
      <Dialog style={{width: '660px'}} icon="home" onClose={this.handleClose} title={selectedObject ? selectedObject.data.buildingName : 'Building Not Found'} {...this.state}>
        <div className={Classes.DIALOG_BODY}>{selectedObject ? <DataTable selectedObject={selectedObject} /> : <h2>The data of this building is missing.</h2>}</div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}></div>
        </div>
      </Dialog>
    );
  }
}

interface IPropTable {
  selectedObject: BuildingDataObject;
}

interface IStateTable {}

declare global {
  interface Window {
    gapi: any;
  }
}

export class DataTable extends React.Component<IPropTable, IStateTable> {
  constructor(props) {
    super(props);
  }

  render() {
    const {data, sheetData} = this.props.selectedObject;

    return (
      <table className="bp3-html-table bp3-interactive bp3-html-table-striped ">
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
          {'waterUsage' in sheetData && (
            <tr>
              <td>Daily Water Usage</td>
              <td>{sheetData.waterUsage}</td>
              <td>{sheetData.waterUsageUnit}</td>
              <td>{sheetData.timestamp}</td>
              <td>{sheetData.condition}</td>
            </tr>
          )}
          {'gasUsage' in sheetData && (
            <tr>
              <td>Daily Gas Usage</td>
              <td>{sheetData.gasUsage}</td>
              <td>{sheetData.gasUsageUnit}</td>
              <td>{sheetData.timestamp}</td>
              <td>{sheetData.condition}</td>
            </tr>
          )}
          <tr>
            <td>Daily Power</td>
            <td>{data.dailyPower.value}</td>
            <td>{data.dailyPower.unitAbbreviation}</td>
            <td>{data.dailyPower.timestamp}</td>
            <td>{data.dailyPower.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Daily Eenergy</td>
            <td>{data.dailyEnergy.value}</td>
            <td>{data.dailyEnergy.unitAbbreviation}</td>
            <td>{data.dailyEnergy.timestamp}</td>
            <td>{data.dailyEnergy.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Year Built</td>
            <td>{data.yearBuilt.value}</td>
            <td>{data.yearBuilt.unitAbbreviation}</td>
            <td>{data.yearBuilt.timestamp}</td>
            <td>{data.yearBuilt.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Longitude</td>
            <td>{data.longitude.value}</td>
            <td>{data.longitude.unitAbbreviation}</td>
            <td>{data.longitude.timestamp}</td>
            <td>{data.longitude.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Latitude</td>
            <td>{data.latitude.value}</td>
            <td>{data.latitude.unitAbbreviation}</td>
            <td>{data.latitude.timestamp}</td>
            <td>{data.latitude.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Campus</td>
            <td>{data.campus.value}</td>
            <td>{data.campus.unitAbbreviation}</td>
            <td>{data.campus.timestamp}</td>
            <td>{data.campus.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Type</td>
            <td>{data.buildingType.value}</td>
            <td>{data.buildingType.unitAbbreviation}</td>
            <td>{data.buildingType.timestamp}</td>
            <td>{data.buildingType.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Number</td>
            <td>{data.buildingNumber.value}</td>
            <td>{data.buildingNumber.unitAbbreviation}</td>
            <td>{data.buildingNumber.timestamp}</td>
            <td>{data.buildingNumber.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building Address</td>
            <td>{data.address.value}</td>
            <td>{data.address.unitAbbreviation}</td>
            <td>{data.address.timestamp}</td>
            <td>{data.address.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
          <tr>
            <td>Building About</td>
            <td>{data.about.value}</td>
            <td>{data.about.unitAbbreviation}</td>
            <td>{data.about.timestamp}</td>
            <td>{data.about.good === true ? 'Good' : 'Not Good'}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}
