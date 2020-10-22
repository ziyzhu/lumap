import * as React from 'react';
import { scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { select } from 'd3-selection';
import { line } from 'd3-shape';

interface IPropLinePlot {
    data: any;
    size: any[];
}

interface IStateLinePlot {
}

export class LinePlot extends React.Component<IPropLinePlot, IStateLinePlot> {
    public node: any;
    constructor(props) {
        super(props);
        this.createLinePlot = this.createLinePlot.bind(this);
    }

    componentDidMount() {
        this.createLinePlot();
    }

    componentDidUpdate() {
        this.createLinePlot();
    }

    createLinePlot() {
        /*
        const rawData = this.props.data;
        const parsedData = rawData.filter(d => d['Value'] !== undefined && typeof d['Value'] === 'number');
        const values = parsedData.map(d => d['Value']);
        const node = this.node;
        const xMin = new Date(parsedData[0]);
        const xMax = new Date(parsedData[parsedData.length - 1]);
        const yMax = max(values);
        const width = 500 / values.length;

        const xScale = scaleLinear()
            .domain([xMin, xMax])
            .range([0, this.props.size[0]]);
        const yScale = scaleLinear()
            .domain([0, yMax])
            .range([0, this.props.size[1]]);

        select(node)
            .selectAll('path')
            .data(values)
            .enter()
            .append("path")

        select(node)
            .datum(parsedData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line()
                .x(d => xScale(new Date(d['Timestamp'])))
                .y(d => yScale(d['Value']))
            )
        */

        const rawData = this.props.data;
        const parsedData = rawData.filter(d => d['Value'] !== undefined && typeof d['Value'] === 'number');
        const values = parsedData.map(d => d['Value']);

        const node = this.node;
        const valueMax = max(values);
        const width = 500 / values.length;

        const yScale = scaleLinear()
            .domain([0, valueMax])
            .range([0, this.props.size[1]]);

        select(node)
            .selectAll('rect')
            .data(values)
            .enter()
            .append('rect');

        select(node)
            .selectAll('rect')
            .data(values)
            .exit()
            .remove();

        select(node)
            .selectAll('rect')
            .data(values)
            .style('fill', '#fe9922')
            .attr('x', (d, i) => i * width)
            .attr('y', (d) => this.props.size[1] - yScale(d))
            .attr('height', (d) => yScale(d))
            .attr('width', width);
    }

    render() {
        return (
            <svg
                ref={(node) => (this.node = node)}
                width={500}
                height={500}
            ></svg>
        );
    }
}
