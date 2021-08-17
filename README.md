## Event

> 简单的 event 通信工具 适用于 node jsdom 环境

### 使用方法

> 基础使用 类似于 node emitter

```typescript
// simple
import { getEmitter } from 'emitter';
const event = getEmitter();

event.on<number, void>('syncEvent', (params) => {
  console.log(params);
});

event.emit<number, void>('syncEvent', { params: 123 });

// can't receive msg

event.emitterDidMount(); // 打印 123
```

> 异步使用

```typescript
import { getEmitter } from 'emitter';
const event = getEmitter();

event.on<number, { success: boolean }>('asyncEvent', (params, callback) => {
  if (params.params === 321) {
    callback(false, {
      success: true
    })
  } else {
    callback(new Error('params is not valid'), null);
  }
}, 'callback');

event.on<number, { success: boolean }>('promiseEvent', (params, callback) => {
  if (params.params === 11) {
    callback(false, { success: true });
  } else {
    callback(new Error('params is not valid'));
  }
}, 'promise');

// emit 
event.asyncEmit<number, { success: boolean }>('asyncEvent', { params: 123 }, (err, res) => {
  if (err) {
    throw new Error(err.message);
  } else {
    // do what thing
  }
})

// promise 
event.promiseEmit<number, { success: boolean }>('promiseEvent', { params: 12 })
  .then(value => {
    // do some thing
  })
  .catch(err => {
    // handle error
  })
```

> 进阶装饰器用法
```typescript
@emitter
class Test {
  checkData: string = 'checkData';
  cbData: number = 1;

  @on<string, { success: boolean, num: number }>('Test:on', 'callback')
  on(args: IEmitterSingleEvent<string>, callback?: InnerCallback<Error, { success: boolean, num: number }>) {
    const params = args?.params ?? '';
    if (params === this.checkData) {
      callback(false, { success: true, num: 0 });
    } else {
      callback(new Error('data check not pass'), { success: false, num: -1 });
    }
  }

  @emit<string, { success: boolean, num: number }>('TT:on', 'callback')
  emit(data: IEmitterSingleEvent<string>) {
    return [
      data,
      (error: Error | false, result: { success: boolean, num: number }) => {
        if (error) {
          throw error;
        } else {
          this.cbData = result.num;
        }
      }
    ];
  }
}

@emitter
class TT {
  checkData: string = 'checkData';
  cbData: number = 1;

  @on<string, { success: boolean, num: number }>('TT:on', 'callback')
  on(args: IEmitterSingleEvent<string>, callback?: InnerCallback<Error, { success: boolean, num: number }>) {
    const params = args?.params ?? '';
    if (params === this.checkData) {
      callback(false, { success: true, num: 0 });
    } else {
      callback(new Error('data check not pass'), { success: false, num: -1 });
    }
  }

  @emit<string, { success: boolean, num: number }>('Test:on', 'callback')
  emit(data: IEmitterSingleEvent<string>): any {
    return [
      data,
      (error: Error | false, result: { success: boolean, num: number }) => {
        if (error) {
          throw error;
        } else {
          this.cbData = result.num;
        }
      }
    ];
  }

}
const testObject = new Test();
const tt = new TT();

testObject.emit({ params: 'checkData' });
tt.emit({ params: 'checkData' });

getEmitter().emitterDidMount();
```

> 生命周期 event 内部设计了一套完备的生命周期
```typescript
const event = getEmitter();
event.emitWillMount();
event.emitDidMount();
// ....

class A {

  @lifeCycleDecoratorFactor(LifeCycle.EmitterWillMount)
  xxxFunc() {

  }
}
const a = new A();

a.xxxFunc(); // 会执行 getEmitter().emitterWillMount();
```