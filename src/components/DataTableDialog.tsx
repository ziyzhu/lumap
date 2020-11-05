import * as React from 'react';
import {Classes, Dialog} from '@blueprintjs/core';
import {BuildingDataObject} from '../api/Mapper';
import {DataTable} from './DataTable';

interface IPropDataTableDialog {
    isOpen: boolean;
    selectedObjects?: BuildingDataObject[];
    handleClose?: any;
}

interface IStateDataTableDialog {
    isOpen: boolean;
}

export class DataTableDialog extends React.Component<IPropDataTableDialog, IStateDataTableDialog> {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: this.props.isOpen,
        };
    }

    componentDidUpdate(prevProps) {
        if (this.props.isOpen !== prevProps.isOpen) {
            this.setState({isOpen: this.props.isOpen});
        }
    }

    private handleClose = () => {
        this.props.handleClose();
        this.setState({isOpen: false});
    };

    render() {
        const {selectedObjects} = this.props;
        let title = 'Building Not Found';
        if (selectedObjects && selectedObjects.length > 0) {
            title = selectedObjects.filter(obj => obj !== undefined).map(obj => obj.name).join(', ')
        }
        return (
            <Dialog style={{width: '80%', minWidth: '1000px'}} icon="home" onClose={this.handleClose} title={title} {...this.state}>
                <div className={Classes.DIALOG_BODY}>{selectedObjects ? <DataTable selectedObjects={selectedObjects} /> : <h2>The data of this building is missing.</h2>}</div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}></div>
                </div>
            </Dialog>
        );
    }
}

declare global {
    interface Window {
        gapi: any;
    }
}
