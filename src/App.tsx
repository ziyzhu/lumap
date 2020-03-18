//import React from 'react';
//import logo from './logo.svg';
//import './App.css';
import React, {Component} from 'react';
import {useLocation, BrowserRouter, Route, Switch, Redirect} from 'react-router-dom';
import IModelPage from './pages/IModelPage';

function App() {
  return (
    <BrowserRouter>
      <Route exact path={['/', '/home']} component={IModelPage} />
    </BrowserRouter>
  );
}

export default App;
