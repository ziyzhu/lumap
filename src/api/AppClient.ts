import {ClientRequestContext, BeEvent} from '@bentley/bentleyjs-core';
import {UrlDiscoveryClient} from '@bentley/imodeljs-clients';
import {BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration} from '@bentley/frontend-authorization-client';
import {IModelApp, FrontendRequestContext, AuthorizedFrontendRequestContext} from '@bentley/imodeljs-frontend';
import {BentleyCloudRpcManager, BentleyCloudRpcParams} from '@bentley/imodeljs-common';
import {RpcInterfaceDefinition, IModelReadRpcInterface, IModelTileRpcInterface, SnapshotIModelRpcInterface} from '@bentley/imodeljs-common';
import {PresentationRpcInterface} from '@bentley/presentation-common';
import {AccessToken, ImsAuthorizationClient, AuthorizedClientRequestContext} from '@bentley/itwin-client';
import {Presentation} from '@bentley/presentation-frontend';
import {UiComponents} from '@bentley/ui-components';
import * as AppConfig from './AppConfig.json';
import {NoSignInIAuthClient} from './NoSignInIAuthClient';

export function getSupportedRpcs(): RpcInterfaceDefinition[] {
    return [IModelReadRpcInterface, IModelTileRpcInterface, PresentationRpcInterface, SnapshotIModelRpcInterface];
}

export class AppClient {
    private static _isReady: Promise<void>;
    public static requestContext: AuthorizedClientRequestContext;

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
        const authClient = new NoSignInIAuthClient();
        await authClient.generateTokenString(new ClientRequestContext());
        IModelApp.authorizationClient = authClient;
        try {
            AppClient.oidcClient.signIn(new ClientRequestContext());
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
