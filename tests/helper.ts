export const generateRandomKey = () => {
  const random = Math.random()
  return random.toString(36).substr(2)
}
