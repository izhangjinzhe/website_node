import svgCaptcha from 'svg-captcha'
import send from '../utils/sendMail'
import { setValue } from '../utils/redisTest'
import jsonwebtoken from 'jsonwebtoken'
import { JWT_SECRET } from '../config'
import { checkCode } from '../utils/utils'
import UserModel from '../model/users'
import bcrypt from 'bcrypt'

class loginController {
  constructor () {
  }

  async getCaptcha (ctx) {
    const { query } = ctx.request
    // https://github.com/produck/svg-captcha/blob/HEAD/README_CN.md
    const captcha = svgCaptcha.create({
      size: 6, //验证码长度
      ignoreChars: '0o1iq9', // 排除
      noise: Math.floor(Math.random() * 5), // 干扰线条数
      color: true // 文字颜色
    })
    // 保存验证码对应关系并设置超时时间
    setValue(query.uuid, captcha.text, 5 * 60)
    ctx.body = {
      code: 200,
      data: captcha.data
    }
  }

  async sendMail (ctx) {
    const { body } = ctx.request
    console.log(body)
    const result = await send({
      path: body.username,
      user: 'zhangjinzhe', // 查出的user
      code: body.code
    })
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async login (ctx) {
    const { body } = ctx.request
    // 判断验证码
    if (await checkCode(body.uuid, body.code)) {
      // 判断用户名密码
      const user = await UserModel.findOne({ username: body.username })
      const flag = await bcrypt.compare(body.password, user ? user.password : '')
      if (user && flag) {
        const token = jsonwebtoken.sign({ id: 'zhang' }, JWT_SECRET, {
          expiresIn: '1d'
        })
        ctx.body = {
          code: 200,
          data: token,
          msg: '成功'
        }
      } else {
        ctx.body = {
          code: 401,
          data: null,
          msg: '用户名或密码错误'
        }
      }

    } else {
      ctx.body = {
        code: 401,
        data: null,
        msg: '图片验证码不正确'
      }
    }
  }

  async register (ctx) {
    const { body } = ctx.request
    // 判断验证码
    if (await checkCode(body.uuid, body.code)) {
      const username = await UserModel.findOne({ username: body.username })
      // 判断邮箱是否可用
      if (!username) {
        const name = await UserModel.findOne({ name: body.name })
        if (!name) {
          const pwd = await bcrypt.hash(body.password, 10)
          const user = new UserModel({
            username: body.username,
            password: pwd,
            name: body.name
          })
          const result = await user.save()
          ctx.body = {
            code: 200,
            data: result,
            msg: '注册成功'
          }
        } else {
          ctx.body = {
            code: 401,
            data: null,
            msg: '该昵称已被注册,请重新填写!'
          }
        }
      } else {
        ctx.body = {
          code: 401,
          data: null,
          msg: '该邮箱已被注册,请重新填写!'
        }
      }

    } else {
      ctx.body = {
        code: 401,
        data: null,
        msg: '图片验证码不正确或已过期,请重新输入!'
      }
    }
  }

}

export default new loginController()
