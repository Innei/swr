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
}

main()
