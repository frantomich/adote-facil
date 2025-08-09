import {
  Authenticator,
  authenticatorInstance,
} from '../../providers/authenticator.js'
import { Encrypter, encrypterInstance } from '../../providers/encrypter.js'
import {
  UserRepository,
  userRepositoryInstance,
} from '../../repositories/user.js'
import { Either, Failure, Success } from '../../utils/either.js'

import { ErrorMessages } from '../../utils/error-messages.js' // Importa as constantes

export namespace UserLoginDTO {
  export type Params = {
    email: string
    password: string
  }

  export type Failure = { message: string }

  export type Success = {
    user: {
      id: string
      email: string
      name: string
    }
    token: string
  }

  export type Result = Either<Failure, Success>
}

export class UserLoginService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly encrypter: Encrypter,
    private readonly authenticator: Authenticator,
  ) {}

  async execute(params: UserLoginDTO.Params): Promise<UserLoginDTO.Result> {
    const { email, password } = params

    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      return Failure.create({ message: ErrorMessages.INVALID_CREDENTIALS }) // correcao aqui
    }

    const isValidPassword = this.encrypter.compare(password, user.password)

    if (!isValidPassword) {
      return Failure.create({ message: ErrorMessages.INVALID_CREDENTIALS }) // correcao aqui
    }

    const token = this.authenticator.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
    })

    return Success.create({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    })
  }
}

export const userLoginServiceInstance = new UserLoginService(
  userRepositoryInstance,
  encrypterInstance,
  authenticatorInstance,
)
