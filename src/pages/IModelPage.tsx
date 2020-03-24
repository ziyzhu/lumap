import * as React from 'react';

import {ElectronRpcConfiguration} from '@bentley/imodeljs-common';
import {OpenMode, ClientRequestContext, Logger, LogLevel, Id64, Id64String} from '@bentley/bentleyjs-core';
import {AccessToken, ConnectClient, IModelQuery, Project, Config} from '@bentley/imodeljs-clients';
import {IModelApp, IModelConnection, FrontendRequestContext, AuthorizedFrontendRequestContext, SpatialViewState, DrawingViewState, Viewport} from '@bentley/imodeljs-frontend';
import {Presentation, SelectionChangeEventArgs, ISelectionProvider, IFavoritePropertiesStorage, FavoriteProperties, FavoritePropertiesManager} from '@bentley/presentation-frontend';
//import { SignIn } from "@bentley/ui-components";
import {AppClient} from '../api/AppClient';
import * as AppConfig from '../api/AppConfig.json';
import {AppSetting} from '../api/AppSetting';
import {SimpleViewportComponent} from '../components/Viewport';
import Toolbar from '../components/Toolbar';
import {SignIn} from '@bentley/ui-components';
import DrawerComponent from '../components/DrawerComponent';
import {BuildingMapper, BuildingDataObject} from '../api/Mapper';
import {ActionType, EmphasizeElementManager} from '../api/EmphasizeElementManager';

// initialize logging to the console
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning); // Set all logging to a default of Warning
Logger.setLevel('basic-viewport-app', LogLevel.Info); // Override the above default and set only App level logging to Info.

interface IState {
  user: {
    isLoading?: boolean;
    accessToken?: AccessToken;
  };
  offlineIModel: boolean;
  imodel?: IModelConnection;
  viewDefinitionId?: Id64String;
  appSetting?: AppSetting;
  selectedObjects?: BuildingDataObject[];
}

export default class IModelPage extends React.Component<{}, IState> {
  /** Creates an App instance */
  constructor(props?: any, context?: any) {
    super(props, context);
    this.state = {
      user: {
        isLoading: false,
        accessToken: undefined,
      },
      offlineIModel: false,
      viewDefinitionId: undefined,
      imodel: undefined,
      appSetting: undefined,
      selectedObjects: undefined,
    };
    IModelApp.viewManager.onViewOpen.addOnce(vp => {
      const viewFlags = vp.viewFlags.clone();
      viewFlags.shadows = false;
      vp.viewFlags = viewFlags;
    });
  }

  public componentDidMount() {
    AppClient.oidcClient.onUserStateChanged.addListener(this._onUserStateChanged);
    if (AppClient.oidcClient.isAuthorized) {
      AppClient.oidcClient
        .getAccessToken(new FrontendRequestContext()) // tslint:disable-line: no-floating-promises
        .then((accessToken: AccessToken | undefined) => {
          this.setState(prev => ({user: {...prev.user, accessToken, isLoading: false}}));
        });
    }
    // subscribe for unified selection changes
    Presentation.selection.selectionChange.addListener(this._onSelectionChanged);
    // open iModel
    this._openIModel();
  }

  public componentWillUnmount() {
    // unsubscribe from user state changes
    AppClient.oidcClient.onUserStateChanged.removeListener(this._onUserStateChanged);
    // unsubscribe from unified selection changes
    Presentation.selection.selectionChange.removeListener(this._onSelectionChanged);
  }

  private _openIModel = async () => {
    let imodel: IModelConnection | undefined;
    try {
      // attempt to open the imodel
      const info = await this._getIModelInfo();
      imodel = await IModelConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
    } catch (e) {
      console.log(e.message);
    }
    await this._onIModelSelected(imodel);
  };

  /** Finds project and imodel ids using their names */
  private async _getIModelInfo(): Promise<{projectId: string; imodelId: string}> {
    const projectName = AppConfig.imjs_project_name;
    const imodelName = AppConfig.imjs_imodel_name;

    const requestContext: AuthorizedFrontendRequestContext = await AuthorizedFrontendRequestContext.create();

    const connectClient = new ConnectClient();
    let project: Project;
    try {
      project = await connectClient.getProject(requestContext, {$filter: `Name+eq+'${projectName}'`});
    } catch (e) {
      throw new Error(`Project with name "${projectName}" does not exist`);
    }

    const imodelQuery = new IModelQuery();
    imodelQuery.byName(imodelName);
    const imodels = await IModelApp.iModelClient.iModels.get(requestContext, project.wsgId, imodelQuery);
    if (imodels.length === 0) throw new Error(`iModel with name "${imodelName}" does not exist in project "${projectName}"`);
    return {projectId: project.wsgId, imodelId: imodels[0].wsgId};
  }

  /** Handle iModel open event */
  private _onIModelSelected = async (imodel: IModelConnection | undefined) => {
    if (!imodel) {
      // reset the state when imodel is closed
      this.setState({imodel: undefined, viewDefinitionId: undefined});
      return;
    }
    try {
      // configuring iModel properties before a view definition is open
      this.setState({appSetting: new AppSetting(imodel)});
      if (this.state.appSetting) this.state.appSetting.apply();

      // attempt to get a view definition
      const viewDefinitionId = await this.getFirstViewDefinitionId(imodel);
      this.setState({imodel, viewDefinitionId});
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      this.setState({imodel: undefined, viewDefinitionId: undefined});
      console.log(e.message);
    }
  };

  private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
    const selection = selectionProvider.getSelection(evt.imodel, evt.level);
    const buildingMapper = this.state.appSetting ? this.state.appSetting.buildingMapper : undefined;

    if (selection.isEmpty) {
      console.log('Selection cleared');
    } else {
      console.log('Selection change');
      if (selection.instanceKeys.size !== 0) {
        // log all selected ECInstance ids grouped by ECClass name
        console.log('ECInstances:');
        selection.instanceKeys.forEach((ids, ecclass) => {
          console.log(`${ecclass}: ${[...ids].join(',')}`);

          if (buildingMapper) {
            this.setState({selectedObjects: buildingMapper.getDataObjects(ids)});
          }
          EmphasizeElementManager.runAction(ActionType.Override);
        });
      }
      if (selection.nodeKeys.size !== 0) {
        // log all selected node keys
        console.log('Nodes:');
        selection.nodeKeys.forEach(key => console.log(JSON.stringify(key)));
      }
    }
  };

  /** Pick the first available spatial view definition in the imodel */
  private async getFirstViewDefinitionId(imodel: IModelConnection): Promise<Id64String> {
    // Return default view definition (if any)
    const defaultViewId = await imodel.views.queryDefaultViewId();
    if (Id64.isValid(defaultViewId)) return defaultViewId;

    // Return first spatial view definition (if any)
    const spatialViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({from: SpatialViewState.classFullName});
    if (spatialViews.length > 0) return spatialViews[0].id!;

    // Return first drawing view definition (if any)
    const drawingViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({from: DrawingViewState.classFullName});
    if (drawingViews.length > 0) return drawingViews[0].id!;

    throw new Error('No valid view definitions in imodel');
  }

  private _onStartSignin = async () => {
    this.setState(prev => ({user: {...prev.user, isLoading: true}}), () => AppClient.oidcClient.signIn(new FrontendRequestContext()));
  };

  private _onUserStateChanged = (accessToken: AccessToken | undefined) => {
    this.setState(prev => ({user: {...prev.user, accessToken, isLoading: false}}));
  };

  private get _signInRedirectUri() {
    const split = AppConfig.imjs_browser_redirect_uri.split('://');
    return split[split.length - 1];
  }

  private _onRegister = () => {
    window.open('https://git.io/fx8YP', '_blank');
  };

  private _onOffline = () => {
    this.setState(prev => ({user: {...prev.user, isLoading: false}, offlineIModel: true}));
  };

  private delayedInitialization() {
    if (this.state.offlineIModel) {
      // WORKAROUND: create 'local' FavoritePropertiesManager when in 'offline' or snapshot mode. Otherwise,
      // the PresentationManager will try to use the Settings service online and fail.
      const storage: IFavoritePropertiesStorage = {
        loadProperties: async (_?: string, __?: string) => ({
          nestedContentInfos: new Set<string>(),
          propertyInfos: new Set<string>(),
          baseFieldInfos: new Set<string>(),
        }),
        async saveProperties(_: FavoriteProperties, __?: string, ___?: string) {},
      };
      Presentation.favoriteProperties = new FavoritePropertiesManager({storage});

      // WORKAROUND: Clear authorization client if operating in offline mode
      IModelApp.authorizationClient = undefined;
    }

    // initialize Presentation
    Presentation.initialize({activeLocale: IModelApp.i18n.languageList()[0]});
  }

  render() {
    const rulesetId = 'Default';
    let ui: React.ReactNode;

    if (this.state.user.isLoading || window.location.href.includes(this._signInRedirectUri)) {
      // if user is currently being loaded, just tell that
      ui = `${IModelApp.i18n.translate('SimpleViewer:signing-in')}...`;
    } else if (!AppClient.oidcClient.hasSignedIn && !this.state.offlineIModel) {
      // if user doesn't have an access token, show sign in page
      // Only call with onOffline prop for electron mode since this is not a valid option for Web apps
      // TODO this step should be bypassed
      if (ElectronRpcConfiguration.isElectron) ui = <SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} onOffline={this._onOffline} />;
      else ui = <SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} />;
    } else if (!this.state.imodel || !this.state.viewDefinitionId || !this.state.appSetting) {
      // NOTE: We needed to delay some initialization until now so we know if we are opening a snapshot or an imodel.
      this.delayedInitialization();
    } else {
      // if we do have an imodel and view definition id - render imodel components
      ui = (
        <>
          <SimpleViewportComponent rulesetId={rulesetId} imodel={this.state.imodel} viewDefinitionId={this.state.viewDefinitionId} />
          <Toolbar />
          <DrawerComponent appSetting={this.state.appSetting} selectedObjects={this.state.selectedObjects} />
        </>
      );
    }
    return <div>{ui}</div>;
  }
}
