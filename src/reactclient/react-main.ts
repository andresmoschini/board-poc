/// <reference path="../../typings/socket.io-client/socket.io-client.d.ts" />
/// <reference path="../custom-typings/defaults.d.ts" />

import { BoardVM } from "./react-view-model";

import * as app from "../common/client-app";
app.start(new BoardVM(), { rootNode: document.getElementById("boardapp") });
