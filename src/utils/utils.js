import { getValue } from './redisTest.js'

export const checkCode = async (uuid, code) => {
  const data = await getValue(uuid)
  if (data) {
    return data.toLowerCase() === code.toLowerCase()
  } else {
    return false
  }
}
