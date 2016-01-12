// https://cdn.rawgit.com/chbrown/rfc6902/v1.0.6/rfc6902.js
declare type Patch = any;

declare var rfc6902 : {
  createPatch : (initial: any, final: any) => Patch;
  applyPatch : (destination: any, patch: Patch) => void;
};

// bower_components/jeditable/jquery.jeditable.js
interface JQuery {
  editable(fn: (value: any, params: any) => any, options: any): JQuery;
  editable(dest: string): JQuery;
}

// Generic dictionary syntactic sugar
declare type Dictionary<TValue> = { [id: string]: TValue; }

