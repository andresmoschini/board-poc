/// <reference path="../../node_modules/rfc6902/rfc6902.d.ts" />

import * as rfc6902 from "rfc6902";
import * as utils from "../common/utils";
import * as model from "../common/model";
import * as viewModel from "./view-model";

export interface AppConfiguration {
  rootNode?: any;
  socketEventName?: string;
  throttlingInterval?: number;
}

export var defaultConfiguration: AppConfiguration = {
  rootNode: null,
  socketEventName: "board",
  throttlingInterval: 1000
};

export function start(config?: AppConfiguration) {
  var app = new App();
  config = utils.extend({ }, defaultConfiguration, config);
  app.start(config);
}

class App {
  shadowServer: model.Board = { };
  shadowClient: model.Board = { };
  boardVM = new viewModel.Board();
  socket: SocketIOClient.Socket;
  socketEventName: string;

  applyServerPatch(serverChanges: model.Patch) {
    var current = this.boardVM.toPlain();
    var myChanges = rfc6902.createPatch(this.shadowClient, current);
    // I am clonnig patch because the created objects has the same reference
    rfc6902.applyPatch(this.shadowServer, utils.clone(serverChanges));
    rfc6902.applyPatch(current, serverChanges);
    rfc6902.applyPatch(current, myChanges);
    this.boardVM.update(current);
    this.shadowClient = this.boardVM.toPlain();
  }

  onMessage = (msg: model.Message) => {
    var board = (<model.BoardMessage>msg).board;
    var patch = (<model.PatchMessage>msg).patch;
    if (board) {
      // TODO: refresh all the board
    } else if (patch) {
      this.applyServerPatch(patch);
    }
  };

  onInterval= () => {
    var current = this.boardVM.toPlain();
    var myChanges = rfc6902.createPatch(this.shadowServer, current);
    if (myChanges.length) {
      // TODO: consider to send it using HTTP in place of Socket
      this.socket.emit(this.socketEventName, { patch: myChanges });
    }
  };

  start(config: AppConfiguration) {
    this.socketEventName = config.socketEventName;
    this.boardVM.update(this.shadowServer);
    this.boardVM.applyBindings(config.rootNode);
    this.shadowClient = this.boardVM.toPlain();
    this.socket = io();

    this.socket.on(this.socketEventName, this.onMessage);
    setInterval(this.onInterval, config.throttlingInterval);
  }
}
