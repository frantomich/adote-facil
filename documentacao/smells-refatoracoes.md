# Detecção de Code Smells e Refatorações

Este documento detalha a identificação e a correção de *code smells* encontrados no projeto "adote-facil". O objetivo é melhorar a qualidade, a manutenibilidade e a clareza do código-fonte, tanto no backend quanto no frontend. Foram utilizadas análises manuais e o auxílio de ferramentas como o ESLint para identificar os pontos de melhoria.

A seguir, são apresentados 3 casos de *code smells* encontrados, juntamente com a refatoração aplicada para cada um.

---

### 1. Backend: Magic Strings (Literais de String)

**Smell Identificado:**

O uso de "strings mágicas" (literais de string) para mensagens de erro foi identificado em múltiplos serviços do backend. Essa prática dificulta a manutenção, pois a mesma mensagem pode precisar ser atualizada em vários locais diferentes, aumentando a chance de inconsistências e erros de digitação.

**Trecho do Código Original:**

As strings literais aparecem diretamente no retorno de erro dos serviços.

*Em `src/services/user/create-user.ts`*:
```typescript
// ...
if (userAlreadyExists) {
  return Failure.create({ message: 'Email já cadastrado.' }) // <-- Magic String
}
// ...
```

*Em `src/services/user/user-login.ts`*:
```typescript
// ...
if (!user) {
  return Failure.create({ message: 'Email ou senha inválidos.' }) // <-- Magic String
}

const isValidPassword = this.encrypter.compare(password, user.password)

if (!isValidPassword) {
  return Failure.create({ message: 'Email ou senha inválidos.' }) // <-- Magic String repetida
}
//…
```

**Refatoração Aplicada:**

Para solucionar o problema, as mensagens de erro foram centralizadas em um objeto de constantes (`ErrorMessages`). Essa abordagem facilita a reutilização e a manutenção das mensagens, garantindo consistência em toda a aplicação e tornando o código mais limpo e legível.

**Código Refatorado:**

Foi criado um novo arquivo `src/utils/error-messages.ts` para armazenar as constantes.

```typescript
// src/utils/error-messages.ts
export const ErrorMessages = {
  USER_ALREADY_EXISTS: 'Email já cadastrado.',
  INVALID_CREDENTIALS: 'Email ou senha inválidos.',
  ANIMAL_CREATION_FAILED: 'Erro ao criar o animal.',
  ANIMAL_STATUS_UPDATE_FAILED: 'Erro ao atualizar o status do animal.',
  // ... outras mensagens
}
```

As constantes foram então importadas e utilizadas nos serviços correspondentes.

*Em `src/services/user/create-user.ts`*:
```typescript
import { Failure } from '../../utils/either.js'
import { ErrorMessages } from '../../utils/error-messages.js' // Importa as constantes
// ...
if (userAlreadyExists) {
  return Failure.create({ message: ErrorMessages.USER_ALREADY_EXISTS })
}
//...
```

*Em `src/services/user/user-login.ts`*:
```typescript
import { Failure } from '../../utils/either.js'
import { ErrorMessages } from '../../utils/error-messages.js' // Importa as constantes
// ...
if (!user) {
  return Failure.create({ message: ErrorMessages.INVALID_CREDENTIALS })
}
//...
if (!isValidPassword) {
  return Failure.create({ message: ErrorMessages.INVALID_CREDENTIALS })
}
//...
```

---

### 2. Backend: Código Duplicado

**Smell Identificado:**

Foi identificado um bloco de código duplicado nos serviços `GetAvailableAnimalsService` e `GetUserAnimalsService`. Ambos continham a mesma lógica para formatar as imagens dos animais, convertendo os dados de `Buffer` para strings `base64`. A duplicação de código aumenta a complexidade da manutenção, pois qualquer alteração na lógica de formatação precisaria ser aplicada em dois lugares distintos.

**Trecho do Código Original:**

O mesmo trecho de código se repetia em `src/services/animal/get-available.ts` e `src/services/animal/get-user.ts`.

```typescript
// Exemplo em src/services/animal/get-available.ts
// ...
export class GetAvailableAnimalsService {
  // ...
  async execute(
    params: GetAvailableAnimalsDTO.Params,
  ): Promise<GetAvailableAnimalsDTO.Result> {
    // ...
    const animals = await this.animalRepository.findAllAvailableNotFromUser({
        //...
    });
    
    // INÍCIO DA DUPLICAÇÃO
    const formattedAnimals = animals.map((animal) => {
      return {
        ...animal,
        images: animal.images.map((image) => {
          return image.imageData.toString('base64')
        }),
      }
    });
    // FIM DA DUPLICAÇÃO
    
    return Success.create({ animals: formattedAnimals })
  }
}
```

**Refatoração Aplicada:**

A lógica de formatação foi extraída para uma classe utilitária estática, a `AnimalFormatter`. Essa classe agora detém a responsabilidade única de formatar os dados dos animais, eliminando a duplicação e tornando o código dos serviços mais limpo, conciso e aderente ao princípio de responsabilidade única (SRP).

**Código Refatorado:**

Foi criada a classe `AnimalFormatter` em `src/utils/animal-formatter.ts`.

```typescript
// src/utils/animal-formatter.ts
import { Animal, AnimalImage } from '@prisma/client'

type AnimalWithImages = Animal & { images: AnimalImage[] }

export class AnimalFormatter {
  public static formatAnimalsWithImages(
    animals: AnimalWithImages[],
  ): Array<Animal & { images: string[] }> {
    return animals.map((animal) => ({
      ...animal,
      images: animal.images.map((image) => image.imageData.toString('base64')),
    }))
  }
}
```

Os serviços agora utilizam o formatador para simplificar o código e remover a duplicação.

```typescript
import { AnimalFormatter } from '../../utils/animal-formatter.js'
// ...

// Usando o formatador para simplificar
const formattedAnimals = AnimalFormatter.formatAnimalsWithImages(animals)

return Success.create({ animals: formattedAnimals })
```

---

### 3. Frontend: Código Morto (Depuração)

**Smell Identificado:**

Foram encontrados trechos de código morto, especificamente comandos `console.log`, que foram utilizados durante a depuração e esquecidos no código-fonte do frontend. Embora úteis durante o desenvolvimento, esses comandos poluem o código e podem, em cenários de produção, vazar informações sensíveis no console do navegador do usuário.

**Trecho do Código Original:**

Comandos `console.log` foram encontrados em componentes React.

*Em `src/app/area_logada/animais_disponiveis/AvailableAnimalsPage.tsx`*:
```typescript
// ...
useEffect(() => {
  const fetchAvailableAnimals = async () => {
    // ...
    const response = await getAvailableAnimals(filter, token || '');

    console.log(response); // <-- Código de debug esquecido

    if (response.status === 200) { /* ... */ }
  };
  fetchAvailableAnimals();
}, [setAvailableAnimals, filter]);
// ...
```

*Em `src/app/area_logada/animais_disponiveis/[id]/AnimalDetailsPage.tsx`*:
```typescript
// ...
useEffect(() => {
  const getAnimalResponse = getAnimalById(params.id);
  console.log({ getAnimalResponse }); // <-- Código de debug esquecido
  setAnimal(getAnimalResponse);
}, [getAnimalById, params.id]);
// ...
```

**Refatoração Aplicada:**

A correção foi direta e consistiu na remoção completa das linhas contendo `console.log`. Além disso, foi configurada uma regra no ESLint para sinalizar o uso de `console.log` como um aviso durante o desenvolvimento, ajudando a prevenir que esse tipo de código morto seja enviado para o repositório no futuro.

**Código Refatorado:**

As linhas de código desnecessárias foram simplesmente removidas.

*Em `src/app/area_logada/animais_disponiveis/AvailableAnimalsPage.tsx` (refatorado)*:
```typescript
useEffect(() => {
  const fetchAvailableAnimals = async () => {
    setLoading(true);
    const token = getCookie('token');
    const response = await getAvailableAnimals(filter, token || '');

    // A linha do console.log foi simplesmente removida.

    if (response.status === 200) {
      setAvailableAnimals(response.data.animals);
    }
    setLoading(false);
  };
  fetchAvailableAnimals();
}, [setAvailableAnimals, filter]);
