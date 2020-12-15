import React, {useState, useEffect, useRef} from 'react';
import {LinePlot} from './LinePlot';
import {DailyBarPlot} from './DailyBarPlot';
import {MonthlyBarPlot} from './MonthlyBarPlot';

const LINE_PLOTS = ['Amps A', 'Amps B', 'Amps C', 'Power Fac A', 'Power Fac B', 'Power Fac C', 'Watts Total'];

const BAR_PLOTS = ['Daily Energy', 'Daily Power', 'Monthly Average Watts'];
const DAILY_BAR_PLOTS = ['Daily Energy'];
const MONTHLY_BAR_PLOTS = ['Monthly Average Watts','Daily Power'];

export const PlotGroup = props => {
    const [containerWidth, containerHeight] = props.size;
    const plots: any[] = [];

    for (const title in props.plotData) {
        const rawData = props.plotData[title];
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

            plot = (
                <PlotContainer key={title} width={containerWidth} height={containerHeight}>
                    <LinePlot data={lineData} header={title} />
                </PlotContainer>
            );
        } else if (BAR_PLOTS.includes(title)) {
            const barData = parsedData.map(d => {
                const time = new Date(d['Timestamp']).toLocaleDateString();
                const usage = parseFloat(d['Value'].toFixed(2));
                return {time, usage};
            });

            if (!barData || barData.length == 0) continue;

            if (DAILY_BAR_PLOTS.includes(title)) {
                plot = (
                    <PlotContainer key={title} width={containerWidth} height={containerHeight}>
                        <DailyBarPlot data={barData} header={title} />
                    </PlotContainer>
                );
            } else if (MONTHLY_BAR_PLOTS.includes(title)) {
                plot = (
                    <PlotContainer key={title} width={containerWidth} height={containerHeight}>
                        <MonthlyBarPlot data={barData} header={title} />
                    </PlotContainer>
                );
            }
        } 

        if (!plot) continue;
        plots.push(plot);
    }

    return <div>{plots}</div>;
};

const PlotContainer = props => {
    return <div style={{width: props.width, height: props.height, margin: 'auto'}}>{props.children}</div>;
};
