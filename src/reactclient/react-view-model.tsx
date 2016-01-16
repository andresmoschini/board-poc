/// <reference path="../../typings/react/react.d.ts" />

import * as utils from "../common/utils";
import { Note, Board } from "../common/model";
import { IBoardVM } from "../common/view-model";

import * as React from "react";

import { BoardComponent } from "./board-component";

export class BoardVM implements IBoardVM {

  element: HTMLElement;

  toPlain() {
    return {};
  }

  update(board: Board) {
    // not implemented yet
  }

  applyBindings(element: HTMLElement) {
    this.element = element;
    this.render();
  }

  render() {
    //TypeScript error: src/reactclient/react-view-model.ts(31,11): Error TS2339: Property 'render' does not exist on type 'typeof __React'.
    (React as any).render(<BoardComponent />, this.element);
  }

}
