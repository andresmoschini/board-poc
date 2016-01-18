/// <reference path="../../node_modules/rfc6902/rfc6902.d.ts" />

// TODO: consider unify app.ts and allow it to use different view models (Knockout, React, etc)

import * as rfc6902 from "rfc6902";
import * as utils from "./utils";
import * as model from "./model";
import { IBoardVM } from "./view-model";

export interface AppConfiguration {
  rootNode?: HTMLElement;
  socketEventName?: string;
  throttlingInterval?: number;
}

export var defaultConfiguration: AppConfiguration = {
  rootNode: null,
  socketEventName: "board",
  throttlingInterval: 1000
};

export function start(boardVM: IBoardVM, config?: AppConfiguration) {
  var app = new App(boardVM, config);
  app.start();
  return app;
}

class App {
  shadowServer: model.Board = { };
  shadowClient: model.Board = { };
  boardVM: IBoardVM;
  socket: SocketIOClient.Socket;
  config: AppConfiguration;

  constructor(boardVM: IBoardVM, config?: AppConfiguration) {
    this.boardVM = boardVM;
    this.config = utils.extend({ }, defaultConfiguration, config);
  }

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
      this.socket.emit(this.config.socketEventName, { patch: myChanges });
    }
  };

  start() {
    this.boardVM.update(this.shadowServer);
    this.boardVM.applyBindings(this.config.rootNode);
    this.shadowClient = this.boardVM.toPlain();
    this.socket = io();
    this.socket.on(this.config.socketEventName, this.onMessage);
    setInterval(this.onInterval, this.config.throttlingInterval);
  }
}
