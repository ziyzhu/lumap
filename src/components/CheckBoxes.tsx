import * as React from 'react';
import { useState } from 'react';
import { Classes, Button, Checkbox } from '@blueprintjs/core';
import { UserEvent, handleUserEvent } from '../api/UserEvent';

export default function CheckBoxes() {
    const [academicCheck, setAcademicCheck] = useState<boolean>(false);
    const [adminCheck, setAdminCheck] = useState<boolean>(false);
    const [housingCheck, setHousingCheck] = useState<boolean>(false);
    const [athleticsCheck, setAthleticsCheck] = useState<boolean>(false);
    const [greekLifeCheck, setGreekLifeCheck] = useState<boolean>(false);
    const [parkingCheck, setParkingCheck] = useState<boolean>(false);

    return (
        <>
            <div className="container" style={{ display: 'block' }}>
                Building Type
                <br />
                <br />
                <table>
                    <tr>
                        <td>
                            <Checkbox
                                label="Academic"
                                key="academic"
                                checked={academicCheck}
                                onChange={() =>
                                    setAcademicCheck(!academicCheck)
                                }
                            />
                        </td>
                        <td>
                            <Checkbox
                                label="Admin"
                                key="admin"
                                checked={adminCheck}
                                onChange={() => setAdminCheck(!adminCheck)}
                            />
                        </td>
                        <td>
                            <Checkbox
                                label="Housing"
                                key="housing"
                                checked={housingCheck}
                                onChange={() => setHousingCheck(!housingCheck)}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Checkbox
                                label="Athletics"
                                key="athletics"
                                checked={athleticsCheck}
                                onChange={() =>
                                    setAthleticsCheck(!athleticsCheck)
                                }
                            />
                        </td>
                        <td>
                            <Checkbox
                                label="Greek Life"
                                key="greeklife"
                                checked={greekLifeCheck}
                                onChange={() =>
                                    setGreekLifeCheck(!greekLifeCheck)
                                }
                            />
                        </td>
                        <td>
                            <Checkbox
                                label="Parking"
                                key="parking"
                                checked={parkingCheck}
                                onChange={() => setParkingCheck(!parkingCheck)}
                            />
                        </td>
                    </tr>
                </table>
                <Button
                    text="Isolate"
                    onClick={() => {
                        // adapt filterBuilding method in Search Bar to filter buildings based on query
                        // possible need to create a state of iModel buildings pulled from Mapper.ts
                        const checks: string[] = [];

                        if (academicCheck === true) {
                            checks.push('academic');
                        }
                        if (adminCheck === true) {
                            checks.push('admin');
                        }
                        if (housingCheck === true) {
                            checks.push('housing');
                        }
                        if (athleticsCheck === true) {
                            checks.push('athletics');
                        }
                        if (greekLifeCheck === true) {
                            checks.push('greek life');
                        }
                        if (parkingCheck === true) {
                            checks.push('parking');
                        }
                        console.log('isolate');
                        handleUserEvent(checks, UserEvent.Isolate);
                        //handleUserEvent(UserEvent.Isolate);
                        //collect checked values of checkboxes and arrange them into list of building keys
                        //send list of Keys to UserEvent.Isolate
                        //if no boxes are checked, UserEvent.Clear
                    }}
                    className={Classes.BUTTON}
                />
            </div>
        </>
    );
}
