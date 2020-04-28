import * as React from 'react';
import {IModelApp, ZoomViewTool, PanViewTool, RotateViewTool, SelectionTool, FitViewTool} from '@bentley/imodeljs-frontend';
import {Icon} from '@blueprintjs/core';

import './Toolbar.css';

/** Toolbar containing simple navigation tools */
const toolbar = () => {
  return (
    <div className="toolbar">
      <a href="#" title={SelectionTool.flyover} onClick={select}>
        <span>
          <Icon icon="select" />
        </span>
      </a>
      <a href="#" title={FitViewTool.flyover} onClick={fitView}>
        <span>
          <Icon icon="zoom-to-fit" />
        </span>
      </a>
      <a href="#" title={RotateViewTool.flyover} onClick={rotate}>
        <span>
          <Icon icon="pivot-table" />
        </span>
      </a>
      <a href="#" title={PanViewTool.flyover} onClick={pan}>
        <span>
          <Icon icon="hand" />
        </span>
      </a>
      <a href="#" title={ZoomViewTool.flyover} onClick={zoom}>
        <span>
          <Icon icon="search" />
        </span>
      </a>
    </div>
  );
};

/**
 ** See the https://imodeljs.github.io/iModelJs-docs-output/learning/frontend/tools/
 ** for more details and available tools.
 **/

const select = () => {
  IModelApp.tools.run(SelectionTool.toolId);
};

const fitView = () => {
  IModelApp.tools.run(FitViewTool.toolId, IModelApp.viewManager.selectedView);
};

const rotate = () => {
  IModelApp.tools.run(RotateViewTool.toolId, IModelApp.viewManager.selectedView);
};

const pan = () => {
  IModelApp.tools.run(PanViewTool.toolId, IModelApp.viewManager.selectedView);
};

const zoom = () => {
  IModelApp.tools.run(ZoomViewTool.toolId, IModelApp.viewManager.selectedView);
};

export default toolbar;
