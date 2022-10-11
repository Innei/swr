import { describe, expect, test } from 'vitest'
import { configure, requestManger, swr } from '~'

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
})

describe('swr with cache', () => {
  afterAll(() => {
    configure({})
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
})