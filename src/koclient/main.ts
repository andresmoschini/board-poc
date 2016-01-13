/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../../typings/socket.io-client/socket.io-client.d.ts" />
/// <reference path="../custom-typings/defaults.d.ts" />
/// <reference path="../custom-typings/jquery-jeditable.d.ts" />
/// <reference path="../custom-typings/rfc6902.d.ts" />

import DragNDrop = require("./kobindings/dragndrop");
DragNDrop.register();

import JEditable = require("./kobindings/jeditable");
JEditable.register();

import App = require("./app");
App.start();
