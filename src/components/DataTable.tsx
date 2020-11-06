import * as React from 'react';
import {PIDataIntegrator} from '../api/PIDataIntegrator';
import {Spinner} from '@blueprintjs/core';
import {PlotGroup} from '../graphs/PlotGroup';

interface IPropDataTable {
    selectedObjects: any[];
}

interface IStateDataTable {
    plotParams: any;
    fixedData: any;
    plotData: any;
    missingObjects: any[];
    isEmpty: boolean;
    isLoading: boolean;
    isGroup: boolean;
}

export class DataTable extends React.Component<IPropDataTable, IStateDataTable> {
    constructor(props) {
        super(props);
        this.state = {
            plotParams: {
                startTime: '*-1w',
                endTime: '*',
            },
            fixedData: {},
            plotData: {},
            missingObjects: [],
            isEmpty: false,
            isLoading: true,
            isGroup: false,
        };
    }

    componentDidMount() {
        const proxyUrl = 'https://lehighmap.csb.lehigh.edu:5000/api/piwebapi';
        const baseUrl = 'https://pi-core.cc.lehigh.edu/piwebapi';
        const integrator = new PIDataIntegrator(proxyUrl, baseUrl);
        const {selectedObjects} = this.props;
        const presentObjects = selectedObjects.filter(obj => obj && obj.piWebId !== undefined);
        const missingObjects = selectedObjects.filter(obj => obj && obj.piWebId === undefined);
        const {plotParams} = this.state;
        if (!presentObjects || presentObjects.length === 0) {
            this.setState({isLoading: false, isEmpty: true, missingObjects: missingObjects});
        }

        const promises = new Array<Promise<any>>();
        const plots: any = [];
        for (const presentObject of presentObjects) {
            if (!presentObject.piWebId) continue;
            promises.push(integrator.getPlot(presentObject.piWebId, plotParams).then(plot => plots.push(plot)));
        }

        Promise.all(promises)
            .then(() => {
                const isGroup = plots.length > 1 ? true : false;
                const {fixedData, plotData} = integrator.parsePlots(plots)!;
                this.setState({fixedData: fixedData, plotData: plotData, isGroup: isGroup});
            })
            .then(() => this.setState({isLoading: false}));
    }

    render() {
        const {isLoading, isEmpty, missingObjects, fixedData, plotData} = this.state;

        let ui: JSX.Element;
        if (isLoading) {
            ui = <Spinner size={Spinner.SIZE_STANDARD} />;
        } else if (!isEmpty) {
            ui = (<div> 
                    {/*<p>Buildings with missing data: {missingObjects.map(obj => obj.name).join(', ')}</p>*/}
                    <PlotGroup data={plotData} size={[900, 500]} /> 
                  </div>);
        } else {
            ui = <p>Empty : (</p>;
        }
        return ui;
    }
}
