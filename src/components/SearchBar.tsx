import * as React from 'react';
import {Card, ButtonGroup, Classes, Button, H5, MenuItem} from '@blueprintjs/core';
import {ItemPredicate, ItemRenderer, MultiSelect} from '@blueprintjs/select';
import {BuildingMapper, BuildingDataObject} from '../api/Mapper';
import {UserEvent, handleUserEvent} from '../api/UserEvent';
import {DataTableDialog} from '../components/DataTableDialog';

const BuildingMultiSelect = MultiSelect.ofType<any>();

interface IState {
    buildings: any[];
    items: any[];
    dataTableIsOpen: boolean;
    dataTableKey: string;
}

export class SearchBar extends React.Component<{}, IState> {
    constructor(props) {
        super(props);
        this.state = {
            buildings: [],
            items: [],
            dataTableIsOpen: false,
            dataTableKey: '',
        };
    }

    componentDidMount() {
        const dataObjects: BuildingDataObject[] = BuildingMapper.current.getDataObjects();
        // this.setState({items: dataObjects.map(obj => obj.data)});
        this.setState({items: dataObjects.map(obj => obj.sheetData)});
    }

    private getSelectedBuildingIndex(selectedBuilding: any) {
        let buildingIndex = -1;
        this.state.buildings!.forEach((building, index) => {
            if (building.matchingKey === selectedBuilding.matchingKey) {
                buildingIndex = index;
            }
        });
        return buildingIndex;
    }

    private isBuildingSelected(building: any) {
        return this.getSelectedBuildingIndex(building) !== -1;
    }

    private renderBuilding: ItemRenderer<any> = (building, {modifiers, handleClick}) => {
        if (!modifiers.matchesPredicate) {
            return null;
        }
        return <MenuItem active={modifiers.active} icon={this.isBuildingSelected(building) ? 'tick' : 'blank'} key={building.matchingKey} label={building.yearBuilt.value} onClick={handleClick} text={`${building.buildingName}`} shouldDismissPopover={false} />;
    };

    private selectBuilding(building: any) {
        this.selectBuildings([building]);
    }

    private selectBuildings(buildingsToSelect: any[]) {
        const {buildings, items} = this.state;

        let nextBuildings = buildings.slice();
        let nextItems = items.slice();

        buildingsToSelect.forEach(building => {
            nextBuildings = !arrayContainsBuilding(nextBuildings, building) ? [...nextBuildings, building] : nextBuildings;
        });

        this.setState({
            buildings: nextBuildings,
            items: nextItems,
        });
    }

    private deselectBuilding(index: number) {
        const {buildings} = this.state;

        this.setState({
            buildings: buildings.filter((_building, i) => i !== index),
            items: this.state.items,
        });
    }

    private handleBuildingSelect = (building: any) => {
        if (!this.isBuildingSelected(building)) {
            this.selectBuilding(building);
        } else {
            this.deselectBuilding(this.getSelectedBuildingIndex(building));
        }
    };

    private renderTag = (building: any) => building.buildingName;

    private handleTagRemove = (_tag: string, index: number) => {
        this.deselectBuilding(index);
    };

    private handleClear = () => this.setState({buildings: []});

    private handleBuildingsPaste = (buildings: any[]) => {
        this.selectBuildings(buildings);
    };

    private filterBuilding: ItemPredicate<any> = (query, building, _index, exactMatch) => {
        console.log(building);
        const normalizedName = building.buildingName.toLowerCase();
        const normalizedQuery = query.toLowerCase();

        if (exactMatch) {
            return normalizedName === normalizedQuery;
        } else {
            return `${normalizedName}. ${building.yearBuilt.value}`.indexOf(normalizedQuery) >= 0;
        }
    };
    private handleDialogClose = () => this.setState({dataTableIsOpen: false});

    render() {
        const clearButton = this.state.buildings.length > 0 ? <Button icon="cross" minimal={true} onClick={this.handleClear} /> : undefined;
        const mapper = BuildingMapper.current;
        return (
            <>
                <div className="container" style={{justifyContent: 'center'}}>
                    <BuildingMultiSelect
                        placeholder={'Select multiple buildings...'}
                        resetOnSelect={true}
                        fill={true}
                        itemsEqual={areBuildingsEqual}
                        popoverProps={{minimal: false}}
                        itemRenderer={this.renderBuilding}
                        items={this.state.items}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        selectedItems={this.state.buildings}
                        onItemSelect={this.handleBuildingSelect}
                        onItemsPaste={this.handleBuildingsPaste}
                        tagRenderer={this.renderTag}
                        tagInputProps={{onRemove: this.handleTagRemove, rightElement: clearButton}}
                        itemPredicate={this.filterBuilding}
                    />
                </div>
                <div className="container" style={{display: 'block'}}>
                    {this.state.buildings.map(building => (
                        <Card key={building.buildingNumber.value} style={{marginBottom: '10px'}}>
                            <H5>
                                <a
                                    href="#"
                                    onClick={() => {
                                        this.setState({dataTableIsOpen: true, dataTableKey: building.matchingKey});
                                    }}>
                                    {building.buildingName}
                                </a>
                            </H5>
                            <p>{building.address.value}</p>
                            <ButtonGroup style={{minWidth: 200}}>
                                <Button
                                    text="Zoom In"
                                    onClick={() => {
                                        handleUserEvent(building.matchingKey, UserEvent.ZoomIn);
                                    }}
                                    className={Classes.BUTTON}
                                />
                                <Button
                                    text="Highlight"
                                    onClick={() => {
                                        handleUserEvent(building.matchingKey, UserEvent.Highlight);
                                    }}
                                    className={Classes.BUTTON}
                                />
                                <Button
                                    text="Isolate"
                                    onClick={() => {
                                        handleUserEvent(building.matchingKey, UserEvent.Isolate);
                                    }}
                                    className={Classes.BUTTON}
                                />
                                <Button
                                    text="Clear"
                                    onClick={() => {
                                        handleUserEvent(building.matchingKey, UserEvent.Clear);
                                    }}
                                    className={Classes.BUTTON}
                                />
                            </ButtonGroup>
                        </Card>
                    ))}
                    <DataTableDialog handleClose={this.handleDialogClose} isOpen={this.state.dataTableIsOpen} selectedObjects={[mapper.getDataFromKey(this.state.dataTableKey)]} />
                </div>
            </>
        );
    }
}

function areBuildingsEqual(buildingA: any, buildingB: any) {
    return buildingA.matchingKey.toLowerCase() === buildingB.matchingKey.toLowerCase();
}

function arrayContainsBuilding(buildings: any[], buildingToFind: any): boolean {
    return buildings.some((building: any) => building.matchingKey === buildingToFind.matchingKey);
}
