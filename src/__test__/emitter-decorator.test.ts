import { lifeCycleDecoratorFactor, LifeCycle, getEmitter, on, emitter, emit, IEmitterSingleEvent, InnerCallback } from '..';

class Test1 {
  data = {
    price: 123,
    num: 10,
    name: '测试'
  }

  lifeCyle = LifeCycle.EmitterUnknown;

  @lifeCycleDecoratorFactor(LifeCycle.EmitterWillMount)
  willMount() {
    this.lifeCyle = LifeCycle.EmitterWillMount;
  }

  @lifeCycleDecoratorFactor(LifeCycle.EmitterDidMount)
  didMount() {
    this.lifeCyle = LifeCycle.EmitterDidMount;
  }

  @lifeCycleDecoratorFactor(LifeCycle.EmitterWillUnmout)
  willUnMount() {
    this.lifeCyle = LifeCycle.EmitterWillUnmout;
  }

  @lifeCycleDecoratorFactor(LifeCycle.EmitterDidUnMount)
  didUnMount() {
    this.lifeCyle = LifeCycle.EmitterDidUnMount;
  }
}

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

const test1Object = new Test1();
const testObject = new Test();
const tt = new TT();


describe('test emitter decorator', () => {
  it('emitter test willMount', () => {
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterUnknown);
    test1Object.willMount();
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterWillMount);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterWillMount);
  })

  it('emitter test didMount', () => {
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterWillMount);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterWillMount);
    // execute lifeCycle method
    test1Object.didMount();
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterDidMount);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterDidMount);
  })

  it('emitter test willUnMount', () => {
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterDidMount);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterDidMount);
    // execute lifeCycle method
    test1Object.willUnMount();
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterWillUnmout);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterWillUnmout);
  })

  it('emitter test didUnmount', () => {
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterWillUnmout);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterWillUnmout);
    // execute lifeCycle method
    test1Object.didUnMount();
    expect(test1Object.lifeCyle).toEqual<LifeCycle>(LifeCycle.EmitterDidUnMount);
    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterDidUnMount);
  })

  it('emitter test emit and on ability', () => {
    // validate initial value
    expect(testObject.checkData === 'checkData' && testObject.cbData === 1).toBeTruthy();
    expect(tt.checkData === 'checkData' && tt.cbData === 1).toBeTruthy();
    // correctly value ✅
    testObject.emit({ params: 'checkData' });
    tt.emit({ params: 'checkData' });
    // detect event emitter
    expect(testObject.cbData).toBe<number>(0);
    expect(tt.cbData).toBe<number>(0);
  })

  it('emitter test emit and on handle error', () => {
    // validate initial value
    expect(testObject.checkData === 'checkData' && testObject.cbData === 1).toBeTruthy();
    expect(testObject.emit).toThrow('data check not pass');
    expect(tt.emit).toThrow('data check not pass');
  })
})

afterEach(() => {
  testObject.cbData = 1;
  tt.cbData = 1;
})