import * as React from 'react';
import {ElectronRpcConfiguration} from '@bentley/imodeljs-common';
import {OpenMode, Logger, LogLevel, Id64, Id64String} from '@bentley/bentleyjs-core';
import {ContextRegistryClient, Project} from '@bentley/context-registry-client';
import {IModelQuery} from '@bentley/imodelhub-client';
import {AccessToken} from '@bentley/imodeljs-clients';
import {IModelApp, IModelConnection, FrontendRequestContext, AuthorizedFrontendRequestContext, SpatialViewState, DrawingViewState, RemoteBriefcaseConnection} from '@bentley/imodeljs-frontend';
import {Presentation, SelectionChangeEventArgs, ISelectionProvider} from '@bentley/presentation-frontend';
import {SignIn} from '../components/SignIn';
import {Spinner, Position, Intent, IToastProps, Toaster} from '@blueprintjs/core';
import {SimpleViewportComponent} from '../components/Viewport';
import Toolbar from '../components/Toolbar';
import DrawerComponent from '../components/DrawerComponent';
import {DataTableDialog} from '../components/DataTableDialog';
import {AppClient} from '../api/AppClient';
import * as AppConfig from '../api/AppConfig.json';
import {AppSetting} from '../api/AppSetting';
import {BuildingMapper, BuildingDataObject} from '../api/Mapper';

Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning);
Logger.setLevel('basic-viewport-app', LogLevel.Info);

interface IStateImodelPage {
    clientIsReady: boolean;
}

export default class IModelPage extends React.Component<{}, IStateImodelPage> {
    constructor(props) {
        super(props);
        this.state = {clientIsReady: false};
    }
    componentDidMount() {
        AppClient.startup().then(() => {
            this.setState({clientIsReady: true});
        });
    }
    render() {
        const {clientIsReady} = this.state;
        if (clientIsReady) return <IModelContent />;
        return (
            <div className="page-center">
                <Spinner size={Spinner.SIZE_STANDARD} />
                <p>Initializing the app for you...</p>
            </div>
        );
    }
}

interface IStateImodelContent {
    user: {
        isLoading?: boolean;
        accessToken?: AccessToken;
    };
    offlineIModel: boolean;
    imodel?: IModelConnection;
    viewDefinitionId?: Id64String;
    selectedObjects?: BuildingDataObject[];
    mapperIsReady: boolean;
    dataTableIsOpen: boolean;
}

class IModelContent extends React.Component<{}, IStateImodelContent> {
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
            selectedObjects: [],
            mapperIsReady: false,
            dataTableIsOpen: false,
        };
        IModelApp.viewManager.onViewOpen.addOnce(vp => {
            //vp.changeBackgroundMapProps({applyTerrain: true});
            //vp.changeBackgroundMapProps({groundBias:-100});
            const viewFlags = vp.viewFlags.clone();
            viewFlags.shadows = false;
            vp.viewFlags = viewFlags;
        });
    }

    public componentDidMount() {
        AppClient.oidcClient.onUserStateChanged.addListener(this._onUserStateChanged);
        Presentation.selection.selectionChange.addListener(this._onSelectionChanged);
        this._openIModel();
    }

    public componentWillUnmount() {
        AppClient.oidcClient.onUserStateChanged.removeListener(this._onUserStateChanged);
        Presentation.selection.selectionChange.removeListener(this._onSelectionChanged);
    }

    private _openIModel = async () => {
        let imodel: IModelConnection | undefined;
        try {
            // attempt to open the imodel
            // const info = await this._getIModelInfo();
            // imodel = await IModelConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
            const info = await this._getIModelInfo();
            imodel = await RemoteBriefcaseConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
        } catch (e) {
            console.log(e.message);
        }
        await this._onIModelSelected(imodel);
    };

    private async _getIModelInfo(): Promise<{projectId: string; imodelId: string}> {
        const projectName = AppConfig.imjs_project_name;
        const imodelName = AppConfig.imjs_imodel_name;

        const requestContext: AuthorizedFrontendRequestContext = await AuthorizedFrontendRequestContext.create();

        const connectClient = new ContextRegistryClient();
        let project: Project;
        let projects: Project[];
        try {
            projects = await connectClient.getProjects(requestContext, {$filter: `Name+eq+'${projectName}'`});
            if (projects.length === 0) throw new Error(`Project with name "${projectName}" does not exist`);
            project = projects[0];
        } catch (e) {
            throw new Error(`Project with name "${projectName}" does not exist`);
        }

        const imodelQuery = new IModelQuery();
        const imodels = await IModelApp.iModelClient.iModels.get(requestContext, project.wsgId, imodelQuery);
        if (imodels.length === 0) throw new Error(`iModel with name "${imodelName}" does not exist in project "${projectName}"`);
        return {projectId: project.wsgId, imodelId: imodels[0].wsgId};
    }

    private _onIModelSelected = async (imodel: IModelConnection | undefined) => {
        if (!imodel) {
            this.setState({imodel: undefined, viewDefinitionId: undefined});
            return;
        }
        try {
            const buildingMapper = new BuildingMapper();
            buildingMapper.init(imodel).then(() => {
                this.setState({mapperIsReady: true});
            });
            const appSetting = new AppSetting(imodel);
            appSetting.apply();
            const viewDefinitionId = await this.getFirstViewDefinitionId(imodel);
            this.setState({imodel, viewDefinitionId});
        } catch (e) {
            await imodel.close();
            this.setState({imodel: undefined, viewDefinitionId: undefined});
        }
    };

    private _onSelectionChanged = (evt: SelectionChangeEventArgs, selectionProvider: ISelectionProvider) => {
        const selection = selectionProvider.getSelection(evt.imodel, evt.level);

        if (selection.isEmpty) {
            console.log('Selection cleared');
        } else {
            console.log('Selection change');
            if (selection.instanceKeys.size !== 0) {
                selection.instanceKeys.forEach((ids, ecclass) => {
                    if (BuildingMapper.current) {
                        const selectedObjects = BuildingMapper.current.getDataFromEcSet(ids);
                        const toastMessage = selectedObjects.map(obj => `${obj.name} (${obj.buildingType})`).join(', ');
                        this.addToast(this.createToast(toastMessage));
                        this.setState({selectedObjects: BuildingMapper.current.getDataFromEcSet(ids)});
                    }
                });
            }
        }
    };

    private async getFirstViewDefinitionId(imodel: IModelConnection): Promise<Id64String> {
        const defaultViewId = await imodel.views.queryDefaultViewId();
        if (Id64.isValid(defaultViewId)) return defaultViewId;
        const spatialViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({from: SpatialViewState.classFullName});
        if (spatialViews.length > 0) return spatialViews[0].id!;
        const drawingViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({from: DrawingViewState.classFullName});
        if (drawingViews.length > 0) return drawingViews[0].id!;
        throw new Error('No valid view definitions in imodel');
    }

    private _onStartSignin = async () => {
        this.setState(prev => ({user: {...prev.user, isLoading: true}}));
        AppClient.oidcClient.signIn(new FrontendRequestContext());
    };

    private _onUserStateChanged = () => {
        this.setState(prev => ({user: {...prev.user, isAuthorized: AppClient.oidcClient.isAuthorized, isLoading: false}}));
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
            IModelApp.authorizationClient = undefined;
        }
    }

    private toaster: Toaster;

    private refHandlers = {
        toaster: (ref: Toaster) => (this.toaster = ref),
    };

    private addToast(toast: IToastProps) {
        toast.timeout = 5000;
        this.toaster.show(toast);
    }

    private createToast(name): IToastProps {
        if (name) {
            return {
                action: {
                    text: <strong>Inspect</strong>,
                    onClick: () => {
                        this.setState({dataTableIsOpen: true});
                    },
                },
                intent: Intent.PRIMARY,
                message: (
                    <>
                        You have selected <b>{name}</b>
                    </>
                ),
                timeout: 5000,
            };
        } else {
            return {
                intent: Intent.WARNING,
                message: <>This building does not have data yet.</>,
                timeout: 5000,
            };
        }
    }

    private handleDialogClose = () => this.setState({dataTableIsOpen: false});

    render() {
        const rulesetId = 'Default';
        let ui: React.ReactNode;

        if (this.state.user.isLoading) {
            ui = (
                <div className="page-center">
                    <Spinner size={Spinner.SIZE_STANDARD} />
                    <p>Signing you in...</p>
                </div>
            );
        } else if (!AppClient.oidcClient.hasSignedIn && !this.state.offlineIModel) {
            if (ElectronRpcConfiguration.isElectron) ui = <SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} onOffline={this._onOffline} />;
            else ui = <SignIn onSignIn={this._onStartSignin} onRegister={this._onRegister} />;
        } else if (!this.state.imodel || !this.state.viewDefinitionId) {
            ui = (
                <div className="page-center">
                    <Spinner size={Spinner.SIZE_STANDARD} />
                    <p>Fetching Lehigh University Campus iModel...</p>
                </div>
            );
            this.delayedInitialization();
        } else if (!this.state.mapperIsReady) {
            ui = (
                <div className="page-center">
                    <Spinner size={Spinner.SIZE_STANDARD} />
                    <p>Connecting data to iModel...</p>
                </div>
            );
        } else {
            ui = (
                <>
                    <SimpleViewportComponent imodel={this.state.imodel} viewDefinitionId={this.state.viewDefinitionId} />
                    <Toolbar />
                    <DrawerComponent selectedObjects={this.state.selectedObjects} />
                    <Toaster autoFocus={false} canEscapeKeyClear={true} position={Position.TOP} ref={this.refHandlers.toaster} />;
                    <DataTableDialog handleClose={this.handleDialogClose} isOpen={this.state.dataTableIsOpen} selectedObjects={this.state.selectedObjects} />
                </>
            );
        }
        return <div>{ui}</div>;
    }
}
