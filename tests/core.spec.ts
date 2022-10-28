import { describe, expect, test } from 'vitest'
import { configure, requestManger, swr } from '~'

import { TrunkPromise } from '@xhs/trunk-promise'

import { generateRandomKey } from './helper'

describe('swr basically', () => {
  beforeEach(() => {
    requestManger.clearAll()
  })

  test('swr should be worked', async () => {
    const response = {
      data: 1,
    }
    const task = swr(generateRandomKey(), () => {
      return response
    })
    expect(task).resolves.toEqual(response)
  })

  test('swr worked with return a primitive value', async () => {
    const response = 1
    const task = swr(generateRandomKey(), () => {
      return response
    })
    expect(task).resolves.toEqual(response)
  })

  it('should work with return a Promise value', async () => {
    const response = {
      data: 1,
    }
    const task = swr(generateRandomKey(), () => {
      return Promise.resolve(response)
    })
    expect(task).resolves.toEqual(response)

    const task2 = swr(generateRandomKey(), () => {
      return Promise.resolve(1)
    })
    expect(task2).resolves.toEqual(1)
  })

  it('should waiting for pending request', async () => {
    const thisKey = generateRandomKey()
    let count = 0
    const dummyRequest = async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(count++)
        }, 1000)
      })
    }
    const task1 = swr(thisKey, dummyRequest)
    const task2 = swr(thisKey, dummyRequest)
    expect(task1).toEqual(task2)
    expect(task1).resolves.toEqual(0)
    expect(task2).resolves.toEqual(0)
  })

  it('should get Key', async () => {
    const key = [1, 2, 34]
    await swr(key, ({ key: thisKey }) => {
      expect(key === thisKey).toBeTruthy()

      return {}
    })
  })
})

describe('swr with cache', () => {
  afterAll(() => {
    configure({})
    vi.clearAllTimers()
  })

  beforeEach(() => {
    configure({
      maxAge: 5000,
    })

    vi.useFakeTimers({
      now: 0,
    })
  })

  it('should hit cache', async () => {
    const thisKey = generateRandomKey()
    let count = 0
    const fetchFn = async () => {
      return {
        count: count++,
      }
    }
    await expect(swr(thisKey, fetchFn)).resolves.toStrictEqual({
      count: 0,
    })
    // should hit cache
    setTimeout(async () => {
      // console.log(await swr(thisKey, fetchFn))

      await expect(swr(thisKey, fetchFn)).resolves.toContain({
        count: 0,
      })
      vi.advanceTimersByTime(5000)
    }, 1200)

    setTimeout(async () => {
      await expect(swr(thisKey, fetchFn)).resolves.toStrictEqual({
        count: 1,
      })
    }, 6000)

    vi.advanceTimersToNextTimer()
  })

  it('should soft refetch', async () => {
    const thisKey = generateRandomKey()
    let count = 0
    const fetchFn = async () => {
      return {
        count: count++,
      }
    }
    const task = swr(thisKey, fetchFn)
    await task

    // re-fetch hit cache
    setTimeout(() => {
      expect(task.refresh()).resolves.toStrictEqual({
        count: 0,
      })
      vi.advanceTimersToNextTimer()
    }, 1000)

    vi.advanceTimersToNextTimer()

    setTimeout(() => {
      expect(task.refresh()).resolves.toStrictEqual({
        count: 1,
      })
    }, 6000)
  })

  it('should force to refetch', async () => {
    const thisKey = generateRandomKey()
    let count = 0
    const fetchFn = async () => {
      return {
        count: count++,
      }
    }
    const task = swr(thisKey, () => fetchFn())
    const value = await task
    expect(value).toEqual({
      count: 0,
    })
    // re-fetch ignore cache
    setTimeout(async () => {
      await expect(task.refresh(true)).resolves.toStrictEqual({
        count: 1,
      })
      await expect(task.refresh(true)).resolves.toStrictEqual({
        count: 2,
      })
    }, 1000)

    vi.advanceTimersToNextTimer()
  })

  it("should override global configurate's maxAge", async () => {
    let count = 0
    const task = swr(
      generateRandomKey(),
      async () => {
        return {
          count: count++,
        }
      },
      {
        maxAge: 0,
      },
    )

    await task
    setTimeout(() => {
      expect(task.refresh()).resolves.toStrictEqual({
        count: 1,
      })
    }, 10)

    vi.advanceTimersToNextTimer()
  })
})

describe('swr advantage use', () => {
  afterEach(() => {
    vi.clearAllTimers()

    configure({})
  })

  beforeEach(() => {
    vi.useFakeTimers({
      now: 0,
    })
  })

  it('should use custom PromiseConstructor', () => {
    vi.useRealTimers()

    return new Promise((resolve) => {
      const thisKey = generateRandomKey()
      const task = swr(
        thisKey,
        async () => {
          return 1
        },
        {
          Promise: TrunkPromise as any,
          onRefresh: (promise: any, result) => {
            return promise.doResolve(result)
          },
        },
      )

      const fn = vi.fn().mockImplementation((r) => r)

      task
        .then((r) => fn(r))
        .then(() => {
          expect(task)
            .resolves.toEqual(1)
            .then(() => {
              expect(fn).toBeCalledTimes(1)
              resolve(0)
            })
        })
    })
  })

  it('configuration global custom promise', async () => {
    vi.useRealTimers()

    const fn2 = vi.fn()
    configure({
      Promise: TrunkPromise as any,
      onRefresh: (promise: any, result) => {
        fn2()

        return promise.doResolve(result)
      },
    })
    const fn = vi.fn().mockImplementation((r) => r)
    const thisKey = generateRandomKey()
    const task = swr(thisKey, async () => {
      return 1
    })

    await task
      .then((r) => {
        return fn(r)
      })
      .then(() => {
        return expect(task)
          .resolves.toEqual(1)
          .then(() => {
            expect(fn).toBeCalledTimes(1)
          })
      })

    await expect(task.refresh(true))
      .resolves.toEqual(1)
      .then(() => {
        expect(fn2).toBeCalledTimes(1)
        expect(fn).toBeCalledTimes(2)
      })
  })

  // FIXME
  it.skip('should re-run thenable callback', async () => {
    let count1 = 0

    const promise = new Promise((resolve) => {
      resolve({
        count: count1++,
      })
    })
    const dummyRequestAndHandle = () => {
      return promise.then((res) => {
        return res
      })
    }
    const task = swr(generateRandomKey(), dummyRequestAndHandle)
    const fn = vi.fn().mockImplementation((r) => r)
    promise.then(fn)

    await expect(task).resolves.toEqual({
      count: 0,
    })

    expect(fn).toBeCalledTimes(1)
    fn.mockReset()

    setTimeout(() => {
      task.refresh(true).then((res) => {
        setTimeout(() => {
          expect(fn).toBeCalledTimes(1)
        }, 100)
        vi.advanceTimersToNextTimer()
      })
    }, 100)

    vi.advanceTimersToNextTimer()
  })
})
