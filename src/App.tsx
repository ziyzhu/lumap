//import React from 'react';
//import logo from './logo.svg';
import './App.css';
import React, {Component} from 'react';
import {useLocation, BrowserRouter, Route, Switch, Redirect} from 'react-router-dom';
import ImodelPage from './pages/ImodelPage';

function App() {
  return (
    <BrowserRouter>
      <Route exact path={['/', '/home']} component={ImodelPage} />
    </BrowserRouter>
  );
}

export default App;
