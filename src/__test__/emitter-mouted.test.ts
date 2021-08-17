import { getEmitter, LifeCycle } from '..';

let syncTestVariable = null;

beforeAll(done => {
  const event = getEmitter();
  // 挂载
  event.emitterDidMount();

  event.on<string, void>('sync', (params) => {
    if (params.params === 'sync') {
      syncTestVariable = 0;
    } else {
      syncTestVariable = 1;
    }
  })

  event.on<string, number>('async', (params, callback) => {
    if (params.params === 'async') {
      callback(false, 0);
    } else {
      callback(new Error('params is not valid'), 1);
    }
  }, 'callback');

  event.on<string, number>('promise', (params, callback) => {
    if (params.params === 'promise') {
      callback(false, 0);
    } else {
      callback(new Error('params is not valid'), 1);
    }
  }, 'promise');

  done();
})

afterAll((done) => {
  const event = getEmitter();

  event.offAll();
  syncTestVariable = null;

  done();
})

describe('emit after event has mounted', () => {
  const event = getEmitter();
  
  it('sync emit after event has mouted and get result', () => {
    event.emit<string, void>('sync', { params: 'sync' });
    expect(syncTestVariable).toBe(0);
  })

  it('async emit after event has mouted and get result', (done) => {
    let result = null;
    event.asyncEmit<string, number>('async', { params: 'async' }, (err, res) => {
      if (err) {
        done();
        throw err;
      } else {
        result = res;
        done();
      }
    });

    expect(result).toBe(0);
  })

  it('async emit after event has mouted and run with error', () => {
    try {
      event.asyncEmit<string, number>('async', { params: 'async1' }, (err, res) => {
        if (err) {
          throw err;
        } else {
          // do something with result
        }
      });
    } catch (err) {
      expect(err.message).toEqual('params is not valid');
    }
  })

  it('promise emit after event has mouted and get result', () => {
    expect.assertions(1);
    return expect(event.promiseEmit<string, number>('promise', { params: 'promise' }))
      .resolves
      .toBe(0);
  })

  it('promise emit after event has mouted and run with error', () => {
    expect.assertions(1);
    return expect(event.promiseEmit<string, number>('promise', { params: 'promise1' }))
      .rejects
      .toEqual(new Error('params is not valid'));
  })

  it('event has mouted and check event\'s lifeCycle', () => {
    expect(event.lifeCycle).toEqual<LifeCycle>(LifeCycle.EmitterDidMount);
  })
})