import {Logger, LogLevel} from '@bentley/bentleyjs-core';
import {OidcFrontendClientConfiguration, IOidcFrontendClient, Config, UrlDiscoveryClient} from '@bentley/imodeljs-clients';
import {IModelApp, OidcBrowserClient, FrontendRequestContext} from '@bentley/imodeljs-frontend';
import {BentleyCloudRpcManager, BentleyCloudRpcParams} from '@bentley/imodeljs-common';
import {RpcInterfaceDefinition, IModelReadRpcInterface, IModelTileRpcInterface, SnapshotIModelRpcInterface} from '@bentley/imodeljs-common';
import {PresentationRpcInterface} from '@bentley/presentation-common';
import {Presentation} from '@bentley/presentation-frontend';
import {UiComponents} from '@bentley/ui-components';

/**
 ** Returns a list of RPCs supported by this application
 **/
export function getSupportedRpcs(): RpcInterfaceDefinition[] {
  return [IModelReadRpcInterface, IModelTileRpcInterface, PresentationRpcInterface, SnapshotIModelRpcInterface];
}

// Boiler plate code
export class AppClient {
  private static _isReady: Promise<void>;
  private static _oidcClient: IOidcFrontendClient;

  public static get oidcClient() {
    return this._oidcClient;
  }

  public static get ready(): Promise<void> {
    return this._isReady;
  }

  public static startup() {
    IModelApp.startup();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // initialize Presentation
    Presentation.initialize({
      activeLocale: IModelApp.i18n.languageList()[0],
    });

    // initialize RPC communication
    initPromises.push(AppClient.initializeRpc());

    // initialize OIDC
    initPromises.push(AppClient.initializeOidc());

    // the app is ready when all initialization promises are fulfilled
    this._isReady = Promise.all(initPromises).then(() => {});
  }

  private static async initializeRpc(): Promise<void> {
    let rpcParams = await this.getConnectionInfo();
    const rpcInterfaces = getSupportedRpcs();
    // initialize RPC for web apps
    if (!rpcParams) rpcParams = {info: {title: 'basic-viewport-app', version: 'v1.0'}, uriPrefix: 'http://localhost:3001'};
    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }

  private static async initializeOidc() {
    const clientId = 'imodeljs-spa-samples-2686'; //Config.App.getString('imjs_browser_test_client_id');
    const redirectUri = 'http://localhost:3000/signin-callback.html'; //Config.App.getString('imjs_browser_test_redirect_uri');
    const scope = 'openid email profile organization imodelhub context-registry-service:read-only product-settings-service general-purpose-imodeljs-backend imodeljs-router'; //Config.App.getString('imjs_browser_test_scope');
    const responseType = 'code';
    const oidcConfig: OidcFrontendClientConfiguration = {clientId, redirectUri, scope, responseType};

    this._oidcClient = new OidcBrowserClient(oidcConfig);

    const requestContext = new FrontendRequestContext();
    await this._oidcClient.initialize(requestContext);

    IModelApp.authorizationClient = this._oidcClient;
  }

  private static async getConnectionInfo(): Promise<BentleyCloudRpcParams | undefined> {
    const urlClient = new UrlDiscoveryClient();
    const requestContext = new FrontendRequestContext();
    const orchestratorUrl = await urlClient.discoverUrl(requestContext, 'iModelJsOrchestrator.K8S', undefined);
    return {info: {title: 'general-purpose-imodeljs-backend', version: 'v1.0'}, uriPrefix: orchestratorUrl};
  }

  public static shutdown() {
    this._oidcClient.dispose();
    IModelApp.shutdown();
  }
}
