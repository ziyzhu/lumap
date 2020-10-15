const SHARK_METERS_WEBID = "F1EmWsSLFDAMCEi9V3Cd3PWPogSQ1uk7kg5RGAzgBQVq83CgUEktREFUQVxMRUhJR0hcTEVISUdIXFNIQVJLIE1FVEVSUw"

export class PIDataIntegrator {

    proxyUrl: string;
    baseUrl: string;

    constructor(proxyUrl: string, baseUrl: string) {
        this.proxyUrl = proxyUrl;
        this.baseUrl = baseUrl;
    }

    buildUrl(path: string, params?: any) {
        const url = new URL(`${this.proxyUrl}/${this.baseUrl}/${path}`);
        if (params) {
            for (const key in params) {
                url.searchParams.append(key, params[key]);
            }
        }
        const urlString = url.href;
        return urlString
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

    parsePlots(plots: any) {
        const fixedData = {};
        const plotData = {};
        if (!plots[0]["Items"]) return;
        for (let i = 0; i < plots[0]["Items"].length; i++) {
            const attribute = plots[0]["Items"][i];
            if (i < 8) fixedData[attribute["Name"]] = attribute["Items"][0]["Value"];
            else plotData[attribute["Name"]] = []
        }
        let attrIndex = 0;
        for (const key in plotData) {
            const attrValues = plots[0]["Items"][attrIndex]["Items"];
            plotData[key].push(attrValues);
            for (let j = 1; j < plots.length; j++) {
                const plotAttrValues = plots[j]["Items"][attrIndex]["Items"];
                for (let z = 0; z < plotAttrValues.length; z++) {
                    plotData[key][z]["Value"] = parseFloat(plotData[key][z]["Value"]) + parseFloat(plots[j]["Items"][attrIndex]["Items"][z]["Value"]);
                }
            }
            attrIndex += 1;
        }
        return { fixedData, plotData };
    }

    async getValues(webId: string, params?: any) {
        const path = `streamsets/${webId}/value`;
        const url = this.buildUrl(path, params);
        const plot = await this.fetch(url);
        return plot;
    }
}

