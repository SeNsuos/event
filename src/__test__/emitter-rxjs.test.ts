import { BehaviorSubject, observable, Observable, Subject } from 'rxjs';
import { Emitter, getEmitter, LifeCycle } from '..';

const subject = new Subject<boolean>();
const behaviorSubject = new BehaviorSubject<boolean>(false);


beforeAll(() => {
  
})

afterEach(() => {
  getEmitter().init();
})

describe('emitter fromRxjs ability', () => {
  it('test simple observable', () => {
    let result: boolean = false;
    const observable = new Observable<boolean>((subscriber) => {
      subscriber.next(true);
    });
    const eventFromRxjs = Emitter.fromRxjs<boolean, void>(observable);

    eventFromRxjs.on((args) => {
      if (args.params) {
        result = args.params;
      }
    });

    getEmitter().emitterDidMount();

    expect(result).toBeTruthy();
  })

  it('test subject', () => {
    let result: boolean = false;
    
    const eventFromRxjs = Emitter.fromRxjs<boolean, void>(subject);

    expect(getEmitter().lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterUnknown);

    eventFromRxjs.on((args) => {
      if (args.params) {
        result = args.params
      }
    })

    expect(result).toBeFalsy();

    subject.next(true);

    expect(result).toBeFalsy();

    getEmitter().emitterDidMount();

    expect(result).toBeTruthy();
  })

  it('test behaviorSubject', () => {
    let result: boolean = false;

    const eventFromRxjs = Emitter.fromRxjs<boolean, void>(behaviorSubject);

    eventFromRxjs.on((args) => {
      if (args.params) {
        result = args.params;
      }
    })

    expect(result).toBeFalsy();

    behaviorSubject.next(true);

    expect(result).toBeFalsy();

    getEmitter().emitterDidMount();

    expect(result).toBeTruthy();
  })
})