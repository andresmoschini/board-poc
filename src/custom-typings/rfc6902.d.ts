// https://cdn.rawgit.com/chbrown/rfc6902/v1.0.6/rfc6902.js
declare type Patch = any;

declare var rfc6902 : {
  createPatch : (initial: any, final: any) => Patch;
  applyPatch : (destination: any, patch: Patch) => void;
};
