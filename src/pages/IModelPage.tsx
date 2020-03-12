import * as React from 'react';

import {ElectronRpcConfiguration} from '@bentley/imodeljs-common';
import {OpenMode, ClientRequestContext, Logger, LogLevel, Id64, Id64String} from '@bentley/bentleyjs-core';
import {AccessToken, ConnectClient, IModelQuery, Project, Config} from '@bentley/imodeljs-clients';
import {IModelApp, IModelConnection, FrontendRequestContext, AuthorizedFrontendRequestContext, SpatialViewState, DrawingViewState} from '@bentley/imodeljs-frontend';
import {Presentation, SelectionChangeEventArgs, ISelectionProvider, IFavoritePropertiesStorage, FavoriteProperties, FavoritePropertiesManager} from '@bentley/presentation-frontend';
//import { SignIn } from "@bentley/ui-components";
import {AppClient} from '../api/AppClient';
import {SimpleViewportComponent} from '../components/Viewport';
import Toolbar from '../components/Toolbar';
import {SignIn} from '@bentley/ui-components';
import DrawerComponent from '../components/DrawerComponent';
import {BuildingMapper} from '../api/mapper';

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
      alert(e.message);
    }
    await this._onIModelSelected(imodel);
  };

  /** Finds project and imodel ids using their names */
  private async _getIModelInfo(): Promise<{projectId: string; imodelId: string}> {
    const projectName = 'Lehigh Campus'; //Config.App.get('imjs_test_project');
    const imodelName = 'Lehigh Campus'; //Config.App.get('imjs_test_imodel');

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
      // attempt to get a view definition
      const viewDefinitionId = await this.getFirstViewDefinitionId(imodel);
      this.setState({imodel, viewDefinitionId});
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      this.setState({imodel: undefined, viewDefinitionId: undefined});
      alert(e.message);
    }
  };

  private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
    const selection = selectionProvider.getSelection(evt.imodel, evt.level);
    if (selection.isEmpty) {
      console.log('Selection cleared');
    } else {
      console.log('Selection change');
      if (selection.instanceKeys.size !== 0) {
        // log all selected ECInstance ids grouped by ECClass name
        console.log('ECInstances:');
        selection.instanceKeys.forEach((ids, ecclass) => {
          console.log(`${ecclass}: [${[...ids].join(',')}]`);
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

  render() {
    // ID of the presentation ruleset used by all of the controls; the ruleset
    // can be found at `assets/presentation_rules/Default.PresentationRuleSet.xml`
    const rulesetId = 'Default';
    if (this.state.user.isLoading) {
      // if user is currently being loaded, just tell that
      return <h1>signing-in...</h1>;
    } else if (!this.state.user.accessToken) {
      // if user doesn't have and access token, show sign in page
      return <SignIn onSignIn={this._onStartSignin} />;
    } else if (this.state.imodel && this.state.viewDefinitionId) {
      return (
        <>
          <SimpleViewportComponent rulesetId={rulesetId} imodel={this.state.imodel} viewDefinitionId={this.state.viewDefinitionId} />
          <Toolbar />
          <DrawerComponent />
        </>
      );
    } else {
      return <h1>Nothing</h1>;
    }
  }
}
