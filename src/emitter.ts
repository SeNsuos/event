import { AsyncParallelBailHook, HookMap, InnerCallback, SyncBailHook } from 'tapable';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import * as uuid from 'uuid';
import 'reflect-metadata';

export { InnerCallback };

export interface LifeCycleMethod {
  emitterWillMount: <T = any>(callback?: ILifeCycleCallback, ...args: T[]) => void;
  emitterDidMount: <T = any>(callback?: ILifeCycleCallback, ...args: T[]) => void;
  emitterWillUnMount: <T = any>(callback?: ILifeCycleCallback, ...args: T[]) => void;
  emitterDidUnMount: <T = any>(callback?: ILifeCycleCallback, ...args: T[]) => void;
}

export enum LifeCycle {
  EmitterUnknown = 'EmitterUnknown',
  EmitterWillMount = 'EmitterWillMount',
  EmitterDidMount = 'EmitterDidMount',
  EmitterWillUnmout = 'EmitterWillUnmout',
  EmitterDidUnMount = 'EmitterDidUnMount'
}

export type IEmitterSyncHooks<T = any, R = any> = { [k in LifeCycle]: SyncBailHook<T, R> };
export type IEmitterAsyncHooks<T = any, R = any> = { [k in LifeCycle]: AsyncParallelBailHook<T, R> };

export interface IEmitterSingleEvent<T = any> {
  params: T,
  callbackId?: number;
}

export type ILifeCycleCallback = (...args: any[]) => void;
export type EmitType = 'callback' | 'promise' | 'null';

export type Consturctor = { new (...args: any[]): any };
export type IEmitterOnCallback<T, R> = (args: IEmitterSingleEvent<T>, callback?: InnerCallback<Error, R>) => void;
export type IMethodsMap<T = any, R = any> = Map<string, { method: IEmitterOnCallback<T, R>, syncType: EmitType }>;

// interface Error {
//   name: string;
//   message: string;
//   stack?: string;
// }

class Emitter implements LifeCycleMethod {
  private _lifeCycle: LifeCycle = LifeCycle.EmitterUnknown;
  private _syncHooks: Partial<IEmitterSyncHooks>;
  private _asyncHooks: Partial<IEmitterAsyncHooks>;
  private _syncEventHooks: HookMap<SyncBailHook<IEmitterSingleEvent, any>>;
  private _asyncEventHooks: HookMap<AsyncParallelBailHook<IEmitterSingleEvent, any>>;
  // private _syncHooksSubscription: Map<string, Function>;
  private _syncEventHooksSubscription: Set<string>;
  private _asyncEventHooksSubscription: Set<string>;
  // TODO race or loop hook ability

  public get lifeCycle() { return this._lifeCycle }
  public get syncHooks() { return this._syncHooks }
  public get asyncHooks() { return this._asyncHooks }
  public get syncEventHooks() { return this._syncEventHooks }
  public get asyncEventHooks() { return this._asyncEventHooks }
  // public get syncHooksSubscription() { return this._syncHooksSubscription }
  public get syncEventHooksSubscription() { return this._syncEventHooksSubscription }
  public get asyncEventHooksSubscription() { return this._asyncEventHooksSubscription }

  public init() {
    this._lifeCycle = LifeCycle.EmitterUnknown;
    this._syncHooks = {
      [LifeCycle.EmitterWillMount]: new SyncBailHook(),
      [LifeCycle.EmitterDidMount]: new SyncBailHook(),
      [LifeCycle.EmitterWillUnmout]: new SyncBailHook(),
      [LifeCycle.EmitterDidUnMount]: new SyncBailHook()
    }
    // this._syncHooksSubscription = new Map<string, Function>();
    this._asyncHooks = {
      [LifeCycle.EmitterWillMount]: new AsyncParallelBailHook(),
      [LifeCycle.EmitterDidMount]: new AsyncParallelBailHook(),
      [LifeCycle.EmitterWillUnmout]: new AsyncParallelBailHook(),
      [LifeCycle.EmitterDidUnMount]: new AsyncParallelBailHook()
    }
    // this.syncHooks.EmitterDidMount.intercept({
    //   register: (tapInfo) => {
    //     const { name, fn } = tapInfo;
    //     if (!this.syncHooksSubscription.has(name)) this.syncHooksSubscription.set(name, fn);
    //     return tapInfo;
    //   }
    // })
    this._syncEventHooks = new HookMap((_, hook) => hook ?? new SyncBailHook(['args']));
    this._asyncEventHooks = new HookMap((_, h) => h ?? new AsyncParallelBailHook(['args']));
    this._syncEventHooksSubscription = new Set<string>();
    this._asyncEventHooksSubscription = new Set<string>();
    this.syncEventHooks.intercept({
      factory: (key, hook) => {
        if (!this.syncEventHooksSubscription.has(key))
          this.syncEventHooksSubscription.add(key);
        const h = hook ?? new SyncBailHook(['args']);

        // h.intercept({

        // })

        return h;
      }
    })
    this.asyncEventHooks.intercept({
      factory: (k, h) => {
        if (!this.asyncEventHooksSubscription.has(k)) this.asyncEventHooksSubscription.add(k);
        const hook = h ?? new AsyncParallelBailHook(['args']);

        return hook;
      }
    })
  }

  public emitterWillMount<T = any>(callback?: ILifeCycleCallback, ...args: T[]): void {
    this._lifeCycle = LifeCycle.EmitterWillMount;
    callback ?
      this.syncHooks.EmitterWillMount.callAsync(...args, (err: any, result: any) => callback(err || result)) :
      this.syncHooks.EmitterWillMount.call(args);
  }

  public emitterDidMount<T = any>(callback?: ILifeCycleCallback, ...args: T[]): void {
    this._lifeCycle = LifeCycle.EmitterDidMount;
    callback ?
      this.syncHooks.EmitterDidMount.callAsync(...args, (err: any, result: any) => callback(err || result)) :
      this.syncHooks.EmitterDidMount.call(args);
  }

  public emitterWillUnMount<T = any>(callback?: ILifeCycleCallback, ...args: T[]): void {
    this._lifeCycle = LifeCycle.EmitterWillUnmout;
    callback ?
      this.syncHooks.EmitterDidMount.callAsync(...args, (err: any, result: any) => callback(err || result)) :
      this.syncHooks.EmitterDidMount.call(args);
  }

  public emitterDidUnMount<T = any>(callback?: ILifeCycleCallback, ...args: T[]): void {
    this._lifeCycle = LifeCycle.EmitterDidUnMount;
    callback ?
      this.syncHooks.EmitterDidMount.callAsync(...args, (err: any, result: any) => callback(err || result)) :
      this.syncHooks.EmitterDidUnMount.call(args);
  }

  public on<T, R>(service: string, fn: IEmitterOnCallback<T, R>, syncType: EmitType = 'null') {
    switch (syncType) {
      case 'callback':
        this.asyncEventHooks.for(service).tapAsync(service, fn);
        break;
      case 'promise':
        this.asyncEventHooks.for(service).tapPromise(service, (args) => {
          return new Promise<typeof args>(res => {
            res(args)
          })
            .then(result => {
              let nextResult: any;
              fn(result, (err, callbackResult) => {
                if (err) {
                  throw err;
                } else {
                  nextResult = callbackResult;
                }
              })

              return nextResult;
            })
            .catch(err => {
              throw err;
            });
        });
        break;
      case 'null':
        this.syncEventHooks.for(service).tap(service, fn);
        break;
    }
  }

  /**
   * emit
   * @param service - event service name
   * @param params - event emit params
   * @returns void
   * 
   * @example
   * Here is an example
   * ```
   * const event = getEvent();
   * event.emit<{ args: number }>('test', { args: 1 })
   * ```
   */
  public emit<T, R>(service: string, params: IEmitterSingleEvent<T>, callback?: InnerCallback<Error, R>): void {
    // 挂载前
    if (this.lifeCycle === LifeCycle.EmitterUnknown || this.lifeCycle === LifeCycle.EmitterWillMount) {
      this.syncHooks.EmitterDidMount.tap(service, () => {
        !callback ?
          this.syncEventHooks.for(service).call(params) :
          this.syncEventHooks.for(service).callAsync(params, callback);
      })
    } else {
      !callback ?
        this.syncEventHooks.for(service).call(params) :
        this.syncEventHooks.for(service).callAsync(params, callback);
    }
  }

  public asyncEmit<T, R>(service: string, params: IEmitterSingleEvent<T>, callback: InnerCallback<Error, R>): void {
    // 挂载前
    if (this.lifeCycle === LifeCycle.EmitterUnknown || this.lifeCycle === LifeCycle.EmitterWillMount) {
      this.syncHooks.EmitterDidMount.tap(service, () => {
        this.asyncEventHooks.for(service).callAsync(params, callback);
      })
    } else {
      this.asyncEventHooks.for(service).callAsync(params, callback);
    }
  }

  public promiseEmit<T, R>(service: string, params: IEmitterSingleEvent<T>): Promise<R> {
    let promise = null;

    if (this.lifeCycle === LifeCycle.EmitterUnknown || this.lifeCycle === LifeCycle.EmitterWillMount) {
      promise = new Promise((res, rej) => {
        this.syncHooks.EmitterDidMount.tap(service, () => {
          this.asyncEventHooks.for(service).promise(params)
            .then(result => {
              res(result)
            })
            .catch(err => rej(err))
        })
      })
    } else {
      promise = this.asyncEventHooks.for(service).promise(params);
    }

    return promise;
  }

  public static fromRxjsToEvent<T, R>(service: string, fn: IEmitterOnCallback<T, R>, observable: Observable<T>, syncType: 'null' | 'promise' = 'null'): Emitter {
    const emitter = getEmitter();
    // 注册监听
    emitter.on<T, R>(service, fn, syncType);

    observable.subscribe(value => {
      switch (syncType) {
        case 'null':
          emitter.emit<T, R>(service, { params: value });
          break;
        case 'promise':
          emitter.promiseEmit<T, R>(service, { params: value });
      }
    })

    return emitter;
  }

  public static fromRxjs<T, R>(observable: Observable<T>): {
    on: (fn: IEmitterOnCallback<T, R>) => void;
    destroy: Subscription['unsubscribe'];
    value?: typeof observable extends BehaviorSubject<T> ? BehaviorSubject<T>['getValue'] : () => void
  } {
    const service = uuid.v1();
    const emitter = getEmitter();

    const subscription = observable.subscribe(value => {
      emitter.emit<T, R>(service, { params: value });
      emitter.asyncEmit<T, R>(service, { params: value }, (err, _) => {
        if (err) {
          throw err
        }
      });
    })

    return {
      on: (fn) => emitter.on<T, R>(service, fn),
      destroy: subscription.unsubscribe,
      value: (observable as BehaviorSubject<T>).getValue
    }
  }
  

  public off(service: string): void {
    this.asyncEventHooksSubscription.delete(service);
    this.syncEventHooksSubscription.delete(service);

    // @ts-ignore
    this.asyncEventHooks._map.delete(service);
    // @ts-ignore
    this.syncEventHooks._map.delete(service);
  }

  public offAll() {
    this.init();
  }
}

const getEmitter = (): Emitter => {
  const globalEnvironment = typeof window === 'undefined' ? global : window;
  if (!globalEnvironment._event) {
    const event = new Emitter();
    event.init();
    globalEnvironment._event = event;
  }

  return globalEnvironment._event;
}

// decorator
const lifeCycleDecoratorFactor = (lifeCylce: LifeCycle, order: 'before' | 'after' = 'after',callback?: ILifeCycleCallback) => 
  (_: any, __: any, descriptor: any) => {
    const func = descriptor.value;
    const lifeCycleFun = () => {
      const event = getEmitter();
      switch (lifeCylce) {
        case LifeCycle.EmitterWillMount:
          event.emitterWillMount(callback);
          break;
        case LifeCycle.EmitterDidMount:
          event.emitterDidMount(callback);
          break;
        case LifeCycle.EmitterWillUnmout:
          event.emitterWillUnMount(callback);
          break;
        case LifeCycle.EmitterDidUnMount:
          event.emitterDidUnMount(callback);
          break;
        case LifeCycle.EmitterUnknown:
        default:
          console.error('wrong lifeCycle');
      }
    }
    if (func) {
      try {
        descriptor.value = function(...args: any[]) {
          order === 'before' && lifeCycleFun();
          const result = func.apply(this, args);
          order === 'after' && lifeCycleFun();  
          
          return result;
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

const emit = <T, R>(service: string = '', type: EmitType = 'null') =>
  (_: any, propertyKey: string, descriptor: TypedPropertyDescriptor<(...args: any[]) => typeof type extends 'promise' ? Promise<any> : any>) => {
    const fn = descriptor.value;
    descriptor.value = function(...args: any[]) {
      let [result, callback, realReturnValue] = fn.apply(this, args);
      const _this = this;
      const event = getEmitter();
      const serviceName = service.trim() === '' ? propertyKey : service;
      switch (type) {
        case 'null':
          event.emit<T, R>(serviceName, result);
          break;
        case 'callback':
          if (!callback) callback = () => {};
          event.asyncEmit<T, R>(serviceName, result, callback.bind(_this));
          break;
        case 'promise':
          if (!callback) callback = () => {};
          event.promiseEmit<T, R>(serviceName, result)
            .then(res => callback(false, res))
            .catch(err => callback(err, _this));
          default:
            break;
      }

      return realReturnValue !== undefined ? realReturnValue : result;
    }

    return descriptor;
  }

const emitter = <T extends Consturctor>(target: T) => {
  return class extends target {
    constructor(...args: any[]) {
      super(args);
      const that = this;
      const event = getEmitter();
      const methodsMap: IMethodsMap = Reflect.getMetadata('event:methods', target.prototype);
      if (methodsMap && methodsMap.size > 0) {
        methodsMap.forEach((item, service) => {
          const { method, syncType } = item;
          event.on<any, any>(service, method.bind(that), syncType);
        })
      }
    }
  }
}

const on = <T, R>(service: string, syncType: EmitType = 'null') => 
    (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<IEmitterOnCallback<T, R>>) => {
        const method = descriptor.value;
        let methodsMap: IMethodsMap<T, R> = Reflect.getMetadata('event:methods', target);
        if (!methodsMap) methodsMap = new Map();
        if (!methodsMap.has(service ?? propertyKey)) {
            methodsMap.set(service ?? propertyKey, {
              method,
              syncType
            });
        }

        Reflect.defineMetadata('event:methods', methodsMap, target);

        return descriptor;
    }

export {
  Emitter,
  getEmitter,
  lifeCycleDecoratorFactor,
  emit,
  emitter,
  on
}