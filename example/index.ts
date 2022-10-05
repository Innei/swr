import { swr } from '~/swr'

for (let i = 0; i < 10; i++) {
  swr('test', () => {
    return Math.random()
  }).then((re) => {
    console.log(re)
  })
}
