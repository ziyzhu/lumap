import * as React from 'react';
import {Classes, Dialog} from '@blueprintjs/core';
import {BuildingDataObject} from '../api/Mapper';
import {PIDataIntegrator} from '../api/PIDataIntegrator';

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
    console.log(selectedObjects);
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

interface IPropDataTable {
  selectedObjects: BuildingDataObject[];
}

interface IStateDataTable {
  plotParams: any;
}

declare global {
  interface Window {
    gapi: any;
  }
}

export class DataTable extends React.Component<IPropDataTable, IStateDataTable> {
  
  fixedData: {};
  plotData: {};
  isLoading: boolean;

  constructor(props) {
    super(props);
    this.fixedData = {};
    this.plotData = {};
    this.isLoading = true;
    this.state = {
      plotParams: {},
    };
  }

  componentDidMount() {
    const proxyUrl = "https://lehighmap.csb.lehigh.edu:5000/api/piwebapi";
    const baseUrl = "https://pi-core.cc.lehigh.edu/piwebapi";
    const integrator = new PIDataIntegrator(proxyUrl, baseUrl);
    const { selectedObjects } = this.props;
    if (!selectedObjects) return;

    const promises = new Array<Promise<any>>();
    const plots: any = [];
    for (const selectedObject of selectedObjects) {
      if (!selectedObject.piWebId) continue
      promises.push(integrator.getPlot(selectedObject.piWebId).then(plot => plots.push(plot)));
    }

    Promise.all(promises).then(() => {
      const { fixedData, plotData } = integrator.parsePlots(plots)!;
      this.fixedData = fixedData;
      this.plotData = plotData;
    }).then(() => this.isLoading = false);
  }

  render() {
    for (const selectedObject of this.props.selectedObjects) {
      const { sheetData } = selectedObject;
    }

    return (
      <table className="bp3-html-table bp3-interactive bp3-html-table-striped ">
      {/* TODO change commented part to a better UI component & D3.js to fit fixedData, plotData, and sheetData */}
      </table>
    );
  }
}
