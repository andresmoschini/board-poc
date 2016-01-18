var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".split("");
export function randomString(length: number = 8) : string {
    // write a better generator
    if (! length) {
        length = Math.floor(Math.random() * chars.length);
    }

    var str = "";
    for (var i = 0; i < length; i++) {
        str += chars[Math.floor(Math.random() * chars.length)];
    }
    return str;
}

export function extend<T>(dst: T, ...srcs: T[]) : T {
  srcs.forEach(src => {
    for (var prop in src) {
      if (src.hasOwnProperty(prop)) {
        (<any>dst)[prop] = (<any>src)[prop];
      }
    }
  });
  return dst;
}

export function clone<T>(obj: T) : T {
  return JSON.parse(JSON.stringify(obj));
}
