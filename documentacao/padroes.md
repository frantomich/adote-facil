# Princípios e Padrões de Projeto

## Princípios SOLID

Esta análise examina a aplicação dos princípios SOLID na estrutura do código do sistema Adote Fácil.

## 1. **[S]** - Single Responsibility Principle

**Descrição:** O princípio da responsabilidade única é aquele que diz que uma classe deve ter apenas uma única responsabilidade, ou seja, deve ser responsável por apenas uma tarefa específica dentro da aplicação.

**Análise do Projeto:** No código do projeto, esse princípio é bem aplicado, com cada classe e serviço focando em uma única tarefa ou responsabilidade.

**Exemplo de Código:**

**Classe `UserLoginService`** (`/backend/src/services/user/user-login.ts`)
   - **Responsabilidade única**: Autenticar usuários.
   
   ```typescript
   export class UserLoginService {
     constructor(
       private readonly userRepository: UserRepository,
       private readonly encrypter: Encrypter,
       private readonly authenticator: Authenticator,
     ) {}

     async execute(params: UserLoginDTO.Params): Promise<UserLoginDTO.Result> {
       const { email, password } = params

       // APENAS responsabilidade de autenticação
       const user = await this.userRepository.findByEmail(email)
       if (!user) {
         return Failure.create({ message: 'Email ou senha inválidos.' })
       }

       const isValidPassword = this.encrypter.compare(password, user.password)
       if (!isValidPassword) {
         return Failure.create({ message: 'Email ou senha inválidos.' })
       }

       const token = this.authenticator.generateToken({
         id: user.id, email: user.email, name: user.name
       })

       return Success.create({
         user: { id: user.id, email: user.email, name: user.name },
         token,
       })
     }
   }
   ```

## 2. **[O]** - Open/Closed Principle

**Descrição:** O princípio aberto/fechado é definido como a ideia de que uma classe deve estar aberta para extensão, mas fechada para modificações.

**Análise do Projeto:** O projeto demonstra este princípio principalmente através da estrutura modular dos serviços e repositórios. A classe `Either` no sistema de tratamento de erros é um excelente exemplo, permitindo extensão de tipos de sucesso e falha sem modificar a classe base.

**Exemplo de Código:**

**Classe `Either`** (`/backend/src/utils/either.ts`)
   - **Aberta para extensão**: Permite novos tipos de Success e Failure;
   - **Fechada para modificação**: A estrutura base não precisa ser alterada.
   
   ```typescript
   export class Failure<T> {
     readonly value: T
     
     private constructor(value: T) {
       this.value = value
     }
     
     isFailure(): this is Failure<T> {
       return true
     }
     
     static create<U>(value: U): Failure<U> {
       return new Failure(value)
     }
   }
   
   export type Either<F, S> = Failure<F> | Success<S>
   ```
   
## 3. **[L]** - Liskov Substitution Principle

**Descrição:** O princípio de substituição de Liskov define a ideia de que objetos de uma classe base devem poder ser substituídos por objetos de subclasses sem alterar o comportamento do programa.

**Análise do Projeto:** Embora o projeto não utilize herança extensivamente, o princípio é respeitado através da consistência de interfaces e contratos. As classes `Success` e `Failure` podem ser substituídas uma pela outra na interface `Either` sem quebrar o comportamento do sistema.

**Exemplo de Código:**

**Sistema `Either`** (`/backend/src/utils/either.ts`)
   - **Substituição transparente**: Tanto Success quanto Failure implementam os mesmos métodos.
   
   ```typescript
   // Ambas as classes implementam os mesmos métodos de forma consistente
   export class Success<T> {
     isFailure(): this is Failure<never> {
       return false
     }
     
     isSuccess(): this is Success<T> {
       return true
     }
   }
   
   export class Failure<T> {
     isFailure(): this is Failure<T> {
       return true
     }
     
     isSuccess(): this is Success<never> {
       return false
     }
   }
   ```


## 4. **[I]** - Interface Segregation Principle

**Descrição:** O princípio de segregação de interfaces é definido como a ideia de que uma classe deve conter apenas métodos que realmente serão utilizados, evitando a implementação de métodos desnecessários.

**Análise do Projeto:** O projeto aplica este princípio através de interfaces específicas e focadas. Cada DTO (Data Transfer Object) define apenas os campos necessários para sua operação específica, evitando interfaces "gordas" com métodos não utilizados.

**Exemplo de Código:**

**DTOs específicos** (`/backend/src/repositories/user.dto.d.ts`)
   - **Interfaces focadas**: Cada DTO tem apenas os campos necessários.
   
   ```typescript
   export namespace CreateUserRepositoryDTO {
     export type Params = {
       name: string
       email: string
       password: string
     }
     export type Result = User
   }
   
   export namespace UpdateUserRepositoryDTO {
     export type Params = {
       id: string
       data: { name?: string; email?: string; password?: string }
     }
     export type Result = User
   }
   ```

## 5. **[D]** - Dependency Inversion Principle

**Descrição:** O princípio de inversão de dependência é definido como a ideia de que uma classe deve depender de apenas de abstrações, e não de implementações concretas.

**Análise do Projeto:** Este princípio é amplamente aplicado através da injeção de dependências via construtor. Os serviços dependem de abstrações (repositórios, providers) ao invés de implementações específicas, facilitando testes e manutenção.

**Exemplo de Código:**

**Classe `CreateAnimalService`** (`/backend/src/services/animal/create-animal.ts`)
   - **Depende de abstrações**: Recebe repositórios via construtor.
   
   ```typescript
   export class CreateAnimalService {
     constructor(
       private readonly animalRepository: AnimalRepository,
       private readonly animalImageRepository: AnimalImageRepository,
     ) {}
   
     async execute(params: CreateAnimalDTO.Params): Promise<CreateAnimalDTO.Result> {
       // Usa as abstrações injetadas, não implementações concretas
       const animal = await this.animalRepository.create({
         name, type, gender, race, description, userId,
       })
       
       await Promise.all(
         pictures.map((picture) =>
           this.animalImageRepository.create({
             animalId: animal.id,
             imageData: picture,
           }),
         ),
       )
     }
   }
   ```

---

## Padrões de Projeto Identificados

Além dos princípios SOLID, o projeto implementa alguns padrões de projeto. Aqui estão os principais identificados:

## 1. **Singleton Pattern**

**Descrição:** Garante que uma classe tenha apenas uma instância e fornece um ponto global de acesso a ela.

**Análise do Projeto:** O padrão Singleton é aplicado em várias partes do sistema, especialmente nos providers e na conexão com o banco de dados. A instância única do Prisma Client e dos providers garante eficiência de recursos e consistência.

**Exemplo de Código:**

**Prisma Database Connection** (`/backend/src/database.ts`)
   - **Instância única**: Uma única conexão com o banco de dados é criada e exportada.
   
   ```typescript
   import { PrismaClient } from '@prisma/client'
   
   export const prisma = new PrismaClient()
   ```

**Encrypter Provider** (`/backend/src/providers/encrypter.ts`)
   - **Instância singleton**: Uma única instância exportada.
   
   ```typescript
   export class Encrypter {
     encrypt(value: string): string {
       return bcrypt.hashSync(value, 10)
     }
   
     compare(value: string, hash: string): boolean {
       return bcrypt.compareSync(value, hash)
     }
   }
   
   export const encrypterInstance = new Encrypter()
   ```

## 2. **Factory Pattern**

**Descrição:** Cria objetos sem especificar suas classes exatas, delegando a responsabilidade de criação para métodos especializados.

**Análise do Projeto:** O padrão Factory é implementado através dos métodos estáticos `create` nas classes Success e Failure, fornecendo uma interface consistente para criação de instâncias.

**Exemplo de Código:**

**Either Factory Methods** (`/backend/src/utils/either.ts`)
   - **Métodos de criação**: Encapsulam a lógica de instanciação.
   
   ```typescript
   export class Failure<T> {
     private constructor(value: T) {
       this.value = value
     }
   
     static create<U>(value: U): Failure<U> {
       return new Failure(value)
     }
   }
   
   export class Success<T> {
     private constructor(value: T) {
       this.value = value
     }
   
     static create<U>(value: U): Success<U> {
       return new Success(value)
     }
   }
   
   // Uso nos serviços:
   return Failure.create({ message: 'Email já cadastrado.' })
   return Success.create({ user })
   ```

## 3. **Dependency Injection Pattern**

**Descrição:** Injeta dependências via construtor ao invés de criar internamente.

**Análise do Projeto:** Este padrão é extensivamente utilizado em todo o backend. Controllers recebem serviços, serviços recebem repositórios e providers via construtor. Isso facilita testes unitários e reduz o acoplamento entre classes.

**Exemplo de Código:**

**Controller com Injeção de Dependência** (`/backend/src/controllers/user/create-user.ts`)
   - **Injeção via construtor**: Controller recebe o serviço como dependência.
   
   ```typescript
   class CreateUserController {
     constructor(private readonly createUser: CreateUserService) {}
   
     async handle(request: Request, response: Response): Promise<Response> {
       const { name, email, password } = request.body
   
       const result = await this.createUser.execute({ name, email, password })
       const statusCode = result.isFailure() ? 400 : 201
       return response.status(statusCode).json(result.value)
     }
   }
   
   export const createUserControllerInstance = new CreateUserController(
     createUserServiceInstance,
   )
   ```

**Service com Múltiplas Injeções** (`/backend/src/services/user/user-login.ts`)
   - **Múltiplas dependências**: Recebe repository, encrypter e authenticator.
   
   ```typescript
   export class UserLoginService {
     constructor(
       private readonly userRepository: UserRepository,
       private readonly encrypter: Encrypter,
       private readonly authenticator: Authenticator,
     ) {}
   }
   ```

## 4. **Repository Pattern**

**Descrição:** Encapsula a lógica de acesso a dados, fornecendo uma interface uniforme para operações de persistência.

**Análise do Projeto:** O projeto implementa claramente o Repository Pattern, com classes dedicadas para cada entidade (User, Animal, Chat, etc.), abstraindo a complexidade do Prisma ORM e oferecendo métodos específicos para cada operação.

**Exemplo de Código:**

**UserRepository** (`/backend/src/repositories/user.ts`)
   - **Encapsulamento de acesso a dados**: Abstrai operações do banco de dados.
   
   ```typescript
   export class UserRepository {
     constructor(private readonly repository: PrismaClient) {}
   
     async create(params: CreateUserRepositoryDTO.Params): Promise<CreateUserRepositoryDTO.Result> {
       return this.repository.user.create({ data: params })
     }
   
     async findByEmail(email: string) {
       return this.repository.user.findUnique({ where: { email } })
     }
   
     async update(params: UpdateUserRepositoryDTO.Params) {
       return this.repository.user.update({
         where: { id: params.id },
         data: params.data,
       })
     }
   }
   ```

## 5. **DTO (Data Transfer Object) Pattern**

**Descrição:** Define objetos para transferir dados entre camadas ou componentes do sistema, encapsulando parâmetros e resultados.

**Análise do Projeto:** O projeto utiliza extensively DTOs através de namespaces TypeScript, definindo contratos claros para entrada e saída de dados em cada operação.

**Exemplo de Código:**

**CreateUserDTO** (`/backend/src/services/user/create-user.ts`)
   - **Contrato bem definido**: Especifica parâmetros, tipos de falha e sucesso.
   
   ```typescript
   namespace CreateUserDTO {
     export type Params = {
       name: string
       email: string
       password: string
     }
   
     export type Failure = { message: string }
     export type Success = User
     export type Result = Either<Failure, Success>
   }
   
   export class CreateUserService {
     async execute(params: CreateUserDTO.Params): Promise<CreateUserDTO.Result> {
       // Implementação usando os tipos definidos no DTO
     }
   }
   ```

---

## Conclusão

O projeto **Adote Fácil** demonstra uma aplicação consistente e bem estruturada dos princípios SOLID e padrões de projeto fundamentais:

### Princípios SOLID:
- **[S]** Single Responsibility: Cada classe tem uma responsabilidade bem definida;
- **[O]** Open/Closed: Sistema extensível através de tipos genéricos e estruturas modulares;
- **[L]** Liskov Substitution: Consistência de comportamento entre implementações similares;
- **[I]** Interface Segregation: DTOs específicos e interfaces focadas;
- **[D]** Dependency Inversion: Injeção de dependências e uso de abstrações.

### Padrões de Projeto:
- **Singleton**: Para gerenciamento de recursos únicos (database, providers);
- **Dependency Injection**: Extensivamente usado para desacoplamento;
- **Factory**: Métodos de criação padronizados;
- **Repository**: Abstração clara da camada de dados;
- **DTO**: Contratos bem definidos entre camadas.

Esta arquitetura resulta em um código **maintível**, **testável** e **extensível**, seguindo boas práticas de engenharia de software.
