const SHARK_METERS_WEBID = 'F1EmWsSLFDAMCEi9V3Cd3PWPogSQ1uk7kg5RGAzgBQVq83CgUEktREFUQVxMRUhJR0hcTEVISUdIXFNIQVJLIE1FVEVSUw';
const SINGLE_BUILDING_ATTRIBUTES = ['Amps A', 'Amps B', 'Amps C', 'Daily Energy', 'Daily Power', 'Monthly Average Watts', 'Power Fac A', 'Power Fac B', 'Power Fac C', 'Power Factor', 'VA Average', 'VA Total', 'VA Total', 'VAR Total', 'Watts Total', 'Wh Total'];
const GROUP_BUILDING_ATTRIBUTES = ['Daily Energy', 'Daily Power', 'Monthly Average Watts'];

export class PIDataIntegrator {
    proxyUrl: string;
    baseUrl: string;

    constructor(proxyUrl: string, baseUrl: string) {
        this.proxyUrl = proxyUrl;
        this.baseUrl = baseUrl;
    }

    buildUrl(path: string, params?: any) {
        const piEndpoint = new URL(`${this.baseUrl}/${path}`);
        if (params) {
            for (const key in params) {
                piEndpoint.searchParams.append(key, params[key]);
            }
        }
        const piEndpointEncoded = encodeURI(piEndpoint.href);
        const url = new URL(`${this.proxyUrl}?url=${piEndpoint}`);
        const urlString = url.href;
        return urlString;
    }

    async fetch(url: string) {
        const rawResponse = await fetch(url);
        const parsedResponse = await rawResponse.json();
        return parsedResponse;
    }

    async getElements(params?: any, parentWebId?: string) {
        const defaultParentWebId = SHARK_METERS_WEBID;
        parentWebId = parentWebId ? parentWebId : defaultParentWebId;
        const path = `elements/${parentWebId}/elements`;
        const url = this.buildUrl(path, params);
        const elements = await this.fetch(url);
        return elements;
    }

    async getPlot(webId: string, params?: any) {
        const path = `streamsets/${webId}/plot`;
        const url = this.buildUrl(path, params);
        const plot = await this.fetch(url);
        return plot;
    }

    async getValues(webId: string, params?: any) {
        const path = `streamsets/${webId}/value`;
        const url = this.buildUrl(path, params);
        const plot = await this.fetch(url);
        return plot;
    }

    parsePlots(plots: any) {
        const fixedData: any[] = [];
        const plotData: any = {};

        if (!plots[0] || !plots[0]['Items']) return {fixedData, plotData};
        const attributes = plots.length > 1 ? GROUP_BUILDING_ATTRIBUTES : SINGLE_BUILDING_ATTRIBUTES;

        for (const plot of plots) {
            const fixedDataItem = {};
            for (let i = 0; i < plot['Items'].length; i++) {
                const attribute = plot['Items'][i];
                if (i < 8) {
                    fixedDataItem[attribute['Name']] = attribute['Items'][0]['Value'];
                } else if (attributes.includes(attribute['Name'])) {
                    plotData[attribute['Name']] = [];
                }
            }
            fixedData.push(fixedDataItem);
        }

        let attrIndex = 8;
        for (const attrName in plotData) {
            const initialAttributes = plots[0]['Items'][attrIndex]['Items'];
            plotData[attrName] = initialAttributes;
            for (let j = 1; j < plots.length; j++) {
                const plot = plots[j];
                const attr = plot['Items'][attrIndex];
                if (!attr) continue;
                const attrValues = attr['Items'];
                if (plotData[attrName].length != attrValues.length) continue;
                for (let z = 0; z < attrValues.length - 1; z++) {
                    const aggValue = parseFloat(plotData[attrName][z]['Value']);
                    const value = parseFloat(attrValues[z]['Value']);
                    if (typeof value === 'number' && attrName in plotData) {
                        plotData[attrName][z]['Value'] = aggValue + value;
                    }
                }
            }
            attrIndex += 1;
        }
        return {fixedData, plotData};
    }
}
