import { Emitter } from "../emitter";

declare global {
  interface Window {
    _event: Emitter;
  }
  namespace NodeJS {
    interface Global {
      _event: Emitter;
    }
  }
}