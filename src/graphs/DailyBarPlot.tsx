import {ResponsiveBar} from '@nivo/bar';
import * as React from 'react';

export const DailyBarPlot = props => {
    const barData = props.data;
    return (
        <>
            <h1 style={{textAlign: 'center', marginBottom: '0', marginTop: '30px'}}>{props.header}</h1>
            <ResponsiveBar
                data={barData}
                indexBy="time"
                keys={['usage']}
                margin={{top: 50, right: 0, bottom: 76, left: 60}}
                colors={{scheme: 'paired'}}
                borderColor={{from: 'color', modifiers: [['darker', 1.6]]}}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    tickSize: 0,
                    tickPadding: 1,
                    tickRotation: -90,
                    legend: 'Date',
                    legendPosition: 'middle',
                    legendOffset: 70,
                }}
                axisLeft={{
                    tickSize: 2,
                    tickPadding: 0,
                    tickRotation: 0,
                    legend: 'Energy Usage Value (kwh)',
                    legendPosition: 'middle',
                    legendOffset: -40,
                }}
                labelSkipWidth={5}
                labelSkipHeight={12}
                labelTextColor={{from: 'color', modifiers: [['darker', 1.6]]}}
                legends={[
                    {
                        dataFrom: 'keys',
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 120,
                        translateY: 0,
                        itemsSpacing: 2,
                        itemWidth: 100,
                        itemHeight: 20,
                        itemDirection: 'left-to-right',
                        itemOpacity: 0.85,
                        symbolSize: 20,
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemOpacity: 1,
                                },
                            },
                        ],
                    },
                ]}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
            />
        </>
    );
};
