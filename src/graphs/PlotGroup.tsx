import React, {useState, useEffect, useRef} from 'react';
import {LinePlot} from './LinePlot';
import {BarPlot} from './BarPlot';

const LINE_PLOTS = ['Amps A', 'Amps B', 'Amps C', 'Power Fac A', 'Power Fac B', 'Power Fac C', 'Watts Total'];
const BAR_PLOTS = ['Daily Energy', 'Daily Power', 'Monthly Average Watts'];

export const PlotGroup = props => {
    const [containerWidth, containerHeight] = props.size;
    const plots: any[] = [];

    for (const title in props.data) {
        const rawData = props.data[title];
        const parsedData = rawData.filter(d => d['Value'] !== undefined && typeof d['Value'] === 'number');

        let plot;
        if (LINE_PLOTS.includes(title)) {
            const lineData: any = [];
            const points = parsedData.map((d, i) => {
                const time = i; //new Date(d['Timestamp']);
                const usage = parseFloat(d['Value'].toFixed(2));
                return {x: time, y: usage};
            });
            lineData.push({id: title, color: 'hsl(249, 70%, 50%)', data: points});
            if (!lineData || !points || points.length == 0) continue;
            plot = <LinePlot data={lineData}/>
        } else if (BAR_PLOTS.includes(title)) {
            const barData = parsedData.map(d => {
                const time = new Date(d['Timestamp']).toLocaleDateString();
                const usage = parseFloat(d['Value'].toFixed(2));
                return {time, usage};
            });
            if (!barData || barData.length == 0) continue;
            plot = <BarPlot data={barData}/>
        }
        if (!plot) continue;
        plots.push(plot);
    }

    return (
        <>
            {plots.map(plot => (
                <div style={{width: containerWidth, height: containerHeight}}>{plot}</div>
            ))}
        </>
    );
};
