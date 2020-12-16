import * as React from 'react';
import { Drawer, Button, Classes, Position } from '@blueprintjs/core';
import { BuildingDataObject } from '../api/Mapper';
import { SearchBar } from '../components/SearchBar';
import CheckBoxes from '../components/CheckBoxes';

interface IProps {
    selectedObjects?: BuildingDataObject[];
}

export default class DrawerComponent extends React.Component<IProps> {
    constructor(props) {
        super(props);
        this.state = {
            autoFocus: true,
            canEscapeKeyClose: true,
            canOutsideClickClose: false,
            enforceFocus: true,
            hasBackdrop: false,
            isOpen: true,
            position: Position.LEFT,
            size: '30%',
            usePortal: true,
        };
    }

    private handleOpen = () => this.setState({ isOpen: true });
    private handleClose = () => this.setState({ isOpen: false });

    render() {
        // TODO currently used for demo purposes

        return (
            <>
                <Button
                    style={{ position: 'fixed', top: '20px', left: '20px' }}
                    rightIcon="arrow-right"
                    onClick={this.handleOpen}
                >
                    Menu
                </Button>
                <Drawer
                    onClose={this.handleClose}
                    title="Lehigh University Campus Map"
                    {...this.state}
                >
                    <div className={Classes.DRAWER_BODY}>
                        <CheckBoxes />
                        <SearchBar />
                        <div className={Classes.DIALOG_BODY}></div>
                    </div>
                    <div className={Classes.DRAWER_FOOTER}>
                        <Button
                            icon="git-repo"
                            text="See Our Github"
                            minimal={true}
                            fill={true}
                            onClick={() =>
                                window.open(
                                    'https://github.com/zachzhu2016/lumap'
                                )
                            }
                        />
                    </div>
                </Drawer>
            </>
        );
    }
}
