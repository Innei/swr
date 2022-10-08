import { swr } from '~/swr'

const fetchFn = async () => {
  const re = await swr(['test'], () => {
    return Math.random()
  })
  console.log(re)
}

// const fetchThrowFn = () => {
//   swr('test2', () => {
//     throw new Error('test')
//   }).then((re) => {
//     console.log(re)
//   })
// }

// for (let i = 0; i < 10; i++) {
//   fetchFn()
// }

// setTimeout(() => {
//   fetchFn()
// }, 100)

// setTimeout(() => {
//   fetchThrowFn()
// }, 100)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
async function main() {
  swr(
    ['test'],
    async () => {
      await sleep(500)
      console.log('call 1')

      return 1
    },
    {
      maxAge: 50,
    },
  ).then((res) => {
    console.log('1 done', res)
  })

  swr(['test'], () => {
    console.log('call 2')

    return 2
  }).then((res) => {
    console.log('2 done', res)
  })

  swr(['test'], () => {
    console.log('call 2')

    return 2
  }).then((res) => {
    console.log('3 done', res)
  })

  setTimeout(() => {
    swr(['test'], () => {
      console.log('cache get')

      return 2
    }).then((res) => {
      console.log(res, 'from cache')
    })
  }, 30)
  setTimeout(() => {
    swr(
      ['test'],
      () => {
        console.log(222)

        return 2
      },
      // {
      //   maxAge: 120,
      // },
    ).then((res) => {
      console.log(res, '2 cc')
    })
  }, 550)
  let i = 0
  const task2 = swr(
    ['test-2'],
    async () => {
      console.log('call test-2')

      return ++i
    },
    {
      maxAge: 0,
    },
  )
  task2.then((res) => {
    console.log('test-2 done', res)
  })
  task2.refresh(true).then((res) => {
    console.log('test-2 refresh', res)
  })
  task2.refresh().then((res) => {
    console.log('test-2 refresh', res)
  })
  setTimeout(() => {
    task2.refresh().then((res) => {
      console.log('test-2 refresh', res)
    })
  }, 100)

  const task3 = swr(['test3'], ({ key }) => {
    console.log(key, 'key', '   test-3')
    return { message: `test-3, i =${i++}` }
  })

  task3.subscribe((res) => {
    console.log('3: subscribe', res)
  })

  setTimeout(() => {
    console.log('refresh 1')

    task3.refresh()
  }, 100)

  setTimeout(() => {
    console.log('refresh 2')
    task3.refresh()
  }, 200)

  const task4 = swr(
    ['test4'],
    ({ key }) => {
      return 'task-4'
    },
    {
      initialData: 'has-inital',
    },
  )

  task4.subscribe((res) => {
    console.log('4: subscribe', res)
  })
}

main()
