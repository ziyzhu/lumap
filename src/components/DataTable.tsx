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
            isGroup: false,
            isLoading: true,
        };
    }

    componentDidMount() {
        const proxyUrl = 'https://lehighmap.csb.lehigh.edu:5000/api/piwebapi';
        const baseUrl = 'https://pi-core.cc.lehigh.edu/piwebapi';
        const integrator = new PIDataIntegrator(proxyUrl, baseUrl);
        const { selectedObjects } = this.props;
        const { plotParams } = this.state;
        if (!selectedObjects) return;

        const promises = new Array<Promise<any>>();
        const plots: any = [];
        for (const selectedObject of selectedObjects) {
            if (!selectedObject.piWebId) continue;
            promises.push(integrator.getPlot(selectedObject.piWebId, plotParams).then(plot => plots.push(plot)));
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
        const {isLoading, fixedData, plotData} = this.state;

        let ui: JSX.Element;
        if (isLoading) {
            ui = <Spinner size={Spinner.SIZE_STANDARD} />;
        } else {
            ui = <PlotGroup data={plotData} size={[900, 500]}/>;
        }
        return ui;
    }
}
