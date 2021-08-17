import { getEmitter, LifeCycle } from '..';

let syncTestVariable = null;

beforeAll((done) => {
  const event = getEmitter();

  event.on<number, void>('syncEvent', (params) => {
    syncTestVariable = params.params;
  });

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

  setTimeout(() => {
    event.emitterDidMount();
    console.log('did mount ---', event.lifeCycle);
    done();
  }, 2000);
});

afterAll((done) => {
  const event = getEmitter();

  event.offAll();
  syncTestVariable = null;

  done();
})

describe('emit before event has mounted', () => {
  const event = getEmitter();

  it('async emit before mouting and get result: ', (done) => {
    let result = null;
    event.asyncEmit<number, { success: boolean }>('asyncEvent', { params: 321 }, (err, res) => {
      if (err) {
        done();
        throw new Error(err.message);
      } else {
        result = res;
      }
      done();
    });
    expect(result).toMatchObject({
      success: true
    })
  })

  it('async emit before mouting and trigger error', () => {
    try {
      event.asyncEmit<number, { success: boolean }>('asyncEvent', { params: 123 }, (err, res) => {
        if (err) {
          throw new Error(err.message);
        } else {
          // do what thing
        }
      })
    } catch (err) {
      expect(err.message).toBe('params is not valid');
    }
  })

  it('async emit before mouting and lifeCycle is emitterDidMount', (done) => {
    let lifeCycle = LifeCycle.EmitterUnknown;
    event.asyncEmit<number, { success: boolean }>('asyncEvent', { params: 321 }, (err, res) => {
      if (err) {
        done();
        throw new Error(err.message);
      } else {
        lifeCycle = event.lifeCycle;
      }
      done();
    });
    expect(lifeCycle).toEqual(LifeCycle.EmitterDidMount);
  })

  // sync
  it('sync emit before mouting and correctly run without callback', () => {
    event.emit<number, void>('syncEvent', { params: 123 });
    expect(syncTestVariable).toBe(123);
  })

  // promise
  it('promise emit before mouting and result', () => {
    expect.assertions(1);
    
    return expect(event.promiseEmit<number, { success: boolean }>('promiseEvent', { params: 11 }))
      .resolves
      .toEqual<{ success: boolean }>({ success: true });
  })

  it('promise emit before mouting and run with error', () => {
    expect.assertions(1);
    return expect(event.promiseEmit<number, { success: boolean }>('promiseEvent', { params: 12 }))
      .rejects
      .toEqual(new Error('params is not valid'));
  })
})