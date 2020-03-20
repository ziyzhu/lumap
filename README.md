## Things to know before testing and editing the app:

* **To change iModel configuration**: 
    * Edit src/api/AppConfig.json

* **To further configure the behaviors of the iModel**: 
    * Edit src/api/AppSetting.ts

* **You should not edit**: 
    * src/api/AppClient.ts
    * src/api/Mapper.ts

## How we connect iModel objects to our actual data:

* **Data Object**: Data from external sources are represented as Data Objects in LUmap. For example, a building data object provided by the PI System is represented by BuildingDataObject. 

* **Matching Key**: A matching key is the common value found in both iModel ecinstances and **Data Objects**. 
    
* **Mapper**: A Mapper instance is used to map iModel objects(ecinstances) to the customized objects in the app which may contain data from external resources. A Mapper mainly consists of two attributes, Mapper.bridge and Mapper.table, both are JavaScript dictionaries. However, Mapper.bridge maps ecinstance ID to a **Matching Key** while Mapper.table maps a **Matching Key** to the corresponding **Data Objects**.

## How to run, test, and deploy the app:

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.


