/// <reference path="../../typings/jquery/jquery.d.ts" />
/// <reference path="../../typings/knockout/knockout.d.ts" />
/// <reference path="../../typings/socket.io-client/socket.io-client.d.ts" />
/// <reference path="../custom-typings/defaults.d.ts" />
/// <reference path="../custom-typings/jquery-jeditable.d.ts" />

import * as dragNDrop from "./kobindings/dragndrop";
dragNDrop.register();

import * as jEditable from "./kobindings/jeditable";
jEditable.register();

import { BoardVM } from "./ko-view-model";

import * as app from "../common/client-app";
app.start(new BoardVM());
