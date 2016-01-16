import { Board } from "../common/model";

export interface IBoardVM {
  toPlain() : Board;
  update(board: Board) : void;
  applyBindings(element: HTMLElement) : void;
}
