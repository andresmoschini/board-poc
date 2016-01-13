export function register() {
  var _dragged: any;
  var _xFix: number;
  var _yFix: number;

  ko.bindingHandlers["drag"] = {
    init: (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: any, viewModel: any) => {
      element.setAttribute("draggable", "true");
      element.addEventListener("dragstart", e => {
        e.dataTransfer.setData("data", "data"); // required to drag
        _xFix = e.clientX - viewModel.posX();
        _yFix = e.clientY - viewModel.posY();
        _dragged = viewModel;
      }, false);
    }
  };

  ko.bindingHandlers["drop"] = {
    init: (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: any, viewModel: any) => {
      element.addEventListener("dragover", e => {
        e.preventDefault(); // allows us to drop
        return false;
      });

      element.addEventListener("drop", e => {
        _dragged.posX(e.clientX - _xFix);
        _dragged.posY(e.clientY - _yFix);
        return false;
      });
    }
  };
}
