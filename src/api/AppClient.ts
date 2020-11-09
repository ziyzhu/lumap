import {ClientRequestContext, BeEvent} from '@bentley/bentleyjs-core';
import {UrlDiscoveryClient} from '@bentley/imodeljs-clients';
import {BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration} from '@bentley/frontend-authorization-client';
import {IModelApp, FrontendRequestContext} from '@bentley/imodeljs-frontend';
import {BentleyCloudRpcManager, BentleyCloudRpcParams} from '@bentley/imodeljs-common';
import {RpcInterfaceDefinition, IModelReadRpcInterface, IModelTileRpcInterface, SnapshotIModelRpcInterface} from '@bentley/imodeljs-common';
import {PresentationRpcInterface} from '@bentley/presentation-common';
import {Presentation} from '@bentley/presentation-frontend';
import {UiComponents} from '@bentley/ui-components';
import * as AppConfig from './AppConfig.json';

export function getSupportedRpcs(): RpcInterfaceDefinition[] {
    return [IModelReadRpcInterface, IModelTileRpcInterface, PresentationRpcInterface, SnapshotIModelRpcInterface];
}

export class AppClient {
    private static _isReady: Promise<void>;
    public static get oidcClient() {
        return IModelApp.authorizationClient!;
    }
    public static get ready(): Promise<void> {
        return this._isReady;
    }
    public static async startup() {
        await IModelApp.startup();
        await AppClient.initializeOidc();
        const initPromises = new Array<Promise<any>>();
        initPromises.push(UiComponents.initialize(IModelApp.i18n));
        Presentation.initialize({
            activeLocale: IModelApp.i18n.languageList()[0],
        });
        initPromises.push(AppClient.initializeRpc());
        initPromises.push(AppClient.initializeOidc());
        this._isReady = Promise.all(initPromises).then(() => {});
    }

    private static async initializeRpc(): Promise<void> {
        let rpcParams = await this.getConnectionInfo();
        const rpcInterfaces = getSupportedRpcs();
        if (!rpcParams) rpcParams = {info: {title: 'basic-viewport-app', version: 'v1.0'}, uriPrefix: 'http://localhost:3001'};
        BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
    }

    private static async initializeOidc() {
        const clientId = AppConfig.imjs_browser_client_id;
        const redirectUri = AppConfig.imjs_browser_redirect_uri;
        const scope = AppConfig.imjs_browser_scope;
        const postSignoutRedirectUri = '';
        const oidcConfiguration: BrowserAuthorizationClientConfiguration = {clientId, redirectUri, postSignoutRedirectUri, scope: scope + ' imodeljs-router', responseType: 'code'};
        await BrowserAuthorizationCallbackHandler.handleSigninCallback(oidcConfiguration.redirectUri);
        IModelApp.authorizationClient = new BrowserAuthorizationClient(oidcConfiguration);
        try {
            //const response = await fetch('https://lehighmap.csb.lehigh.edu:5000/api/token');
            //const { token } = await response.json();
            await (AppClient.oidcClient as BrowserAuthorizationClient).signInSilent(new ClientRequestContext());
        } catch (err) {
            console.log(err);
        }
    }

    private static async getConnectionInfo(): Promise<BentleyCloudRpcParams | undefined> {
        const urlClient = new UrlDiscoveryClient();
        const requestContext = new FrontendRequestContext();
        const orchestratorUrl = await urlClient.discoverUrl(requestContext, 'iModelJsOrchestrator.K8S', undefined);
        return {info: {title: 'general-purpose-imodeljs-backend', version: 'v2.0'}, uriPrefix: orchestratorUrl};
    }

    public static shutdown() {
        //this._oidcClient.dispose();
        IModelApp.shutdown();
    }
}
