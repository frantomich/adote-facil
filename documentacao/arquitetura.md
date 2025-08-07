# Arquitetura do Projeto Adote Fácil

## Visão Geral da Arquitetura

O projeto Adote Fácil adota uma **arquitetura em camadas** com separação clara de responsabilidades, combinada com uma **arquitetura de microsserviços** através do uso de containers Docker. Além disso o sistema apresenta caracteristicas de uma **arquitetura cliente-servidor**, com frontend e backend separados.

## Estrutura do Backend

O backend segue uma arquitetura em **4 camadas principais**:

### 1. Camada de Apresentação (Controllers)
- **Localização**: `backend/src/controllers/`
- **Responsabilidade**: Gerenciar requisições HTTP, validar entrada e formatação de resposta
- **Exemplos**: `create-user.ts`, `user-login.ts`, `create-animal.ts`

### 2. Camada de Negócio (Services)
- **Localização**: `backend/src/services/`
- **Responsabilidade**: Implementar regras de negócio e lógica da aplicação
- **Exemplos**: `CreateUserService`, `UserLoginService`

### 3. Camada de Dados (Repositories)
- **Localização**: `backend/src/repositories/`
- **Responsabilidade**: Abstração para acesso aos dados e persistência
- **ORM**: Prisma para mapeamento objeto-relacional

### 4. Camada de Infraestrutura
- **Providers**: Serviços auxiliares como autenticação e criptografia
- **Middlewares**: Interceptadores para autenticação e validação
- **Database**: Configuração do Prisma e conexão com PostgreSQL
- **Config**: Configurações de upload e outras funcionalidades

## Estrutura do Frontend

O frontend utiliza **Next.js** com arquitetura baseada em:

### 1. Camada de Apresentação (Components/Pages)
- **Localização**: `frontend/src/app/` e `frontend/src/components/`
- **Responsabilidade**: Interface do usuário e experiência

### 2. Camada de Serviços (API)
- **Localização**: `frontend/src/api/`
- **Responsabilidade**: Comunicação com o backend

### 3. Camada de Estado (Contexts/Providers)
- **Localização**: `frontend/src/contexts/` e `frontend/src/providers/`
- **Responsabilidade**: Gerenciamento de estado global