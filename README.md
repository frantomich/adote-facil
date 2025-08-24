# **Relatório de Testes Automatizados**

## **Visão Geral**
Este documento detalha a estratégia de testes automatizados proposta para o projeto Adote Fácil. A abordagem é dividida em duas camadas principais: Testes Unitários para o backend, garantindo a lógica de negócio, e Testes de Aceitação (E2E) para o frontend, garantindo que as jornadas do usuário funcionem de ponta a ponta.

---

## **1. Testes Unitários (Backend)**

### **1.1. Análise e Proposta**

Após análise, constatou-se que o projeto não possuía uma suíte de testes unitários. A principal melhoria proposta é a criação dessa suíte com foco em validar as regras de negócio de forma isolada, principalmente os **casos de uso (use cases)**.

A estratégia utiliza o framework **Jest** (ou similar, como Vitest) e o conceito de *mocks* com repositórios em memória para isolar os testes do banco de dados real, tornando-os mais rápidos e determinísticos.

### **1.2. Exemplo de Implementação: `CreatePetUseCase`**

A seguir, um exemplo prático de como testar o caso de uso de criação de um novo pet.

```javascript
// Arquivo: src/use-cases/tests/create-pet.spec.ts

import { it, describe, expect, beforeEach } from 'vitest';
import { CreatePetUseCase } from '../create-pet-use-case';
import { InMemoryPetsRepository } from '@/repositories/in-memory/in-memory-pets-repository';

let petsRepository: InMemoryPetsRepository;
let sut: CreatePetUseCase; // sut = System Under Test

describe('Create Pet Use Case', () => {
  beforeEach(() => {
    // Usamos um repositório em memória para não tocar no banco de dados real
    petsRepository = new InMemoryPetsRepository(); 
    sut = new CreatePetUseCase(petsRepository);
  });

  it('should be able to create a new pet', async () => {
    // Act (Agir)
    const { pet } = await sut.execute({
      name: 'Caramelinho',
      about: 'Um doguinho muito amigável',
      age: 'filhote',
      size: 'médio',
      energy_level: 'alta',
      org_id: 'org-01',
    });

    // Assert (Afirmar)
    expect(pet.id).toEqual(expect.any(String)); // Esperamos que o pet tenha um ID
    expect(pet.name).toEqual('Caramelinho');
  });
});
```

---

## **2. Testes de Aceitação (E2E) com Cypress**

Estes testes simulam a interação de um usuário real com a interface gráfica do sistema. Os cenários e códigos a seguir foram criados assumindo a existência de um frontend conectado à API do backend.

### **2.1. Cenário Principal: Cadastro de Pet com Sucesso**

* **Descrição:**
    * **Dado** que um representante de ONG está logado no sistema e navega para a página de "Cadastro de Pets".
    * **Quando** ele preenche todos os campos obrigatórios do formulário e clica em "Cadastrar".
    * **Então** o sistema deve exibir uma mensagem de "Pet cadastrado com sucesso!" e redirecioná-lo para a página de perfil do novo pet.
* **Cobertura:** Valida o fluxo principal e funcional da funcionalidade de cadastro.
* **Código Cypress:**
    ```javascript
    it('should register a new pet successfully when all data is correct', () => {
      cy.login('ong@example.com', 'strongpassword');
      cy.visit('/pets/register');
      cy.get('[data-cy=pet-name-input]').type('Frajola');
      cy.get('[data-cy=pet-about-textarea]').type('Gato preto e branco muito esperto.');
      cy.get('[data-cy=pet-age-select]').select('adulto');
      cy.get('[data-cy=register-pet-button]').click();
      cy.contains('Pet cadastrado com sucesso!').should('be.visible');
      cy.url().should('include', '/pets/');
    });
    ```

### **2.2. Cenário Alternativo 1: Falha por Campo Obrigatório**

* **Descrição:**
    * **Dado** que o representante da ONG está na página de cadastro.
    * **Quando** ele tenta submeter o formulário sem preencher o campo "Nome".
    * **Então** o sistema deve exibir uma mensagem de erro de validação e permanecer na mesma página.
* **Cobertura:** Garante que as validações de formulário estão ativas, prevenindo o envio de dados inválidos.
* **Código Cypress:**
    ```javascript
    it('should show an error message if the name field is left blank', () => {
      cy.login('ong@example.com', 'strongpassword');
      cy.visit('/pets/register');
      cy.get('[data-cy=pet-about-textarea]').type('Gato preto e branco muito esperto.');
      cy.get('[data-cy=register-pet-button]').click();
      cy.contains('O nome é obrigatório').should('be.visible');
      cy.url().should('not.include', '/pets/');
    });
    ```

### **2.3. Cenário Alternativo 2: Falha por Falta de Autenticação**

* **Descrição:**
    * **Dado** um visitante anônimo (não logado).
    * **Quando** ele tenta acessar a URL de cadastro de pets diretamente.
    * **Então** o sistema deve redirecioná-lo para a página de login.
* **Cobertura:** Valida a camada de segurança da aplicação, protegendo rotas restritas.
* **Código Cypress:**
    ```javascript
    it('should redirect unauthenticated users to the login page', () => {
      cy.visit('/pets/register');
      cy.url().should('include', '/login');
      cy.contains('Você precisa estar logado para acessar esta página.').should('be.visible');
    });
    ```

---

## **3. Instruções de Execução dos Testes**

Este guia descreve como executar os testes automatizados do projeto.

### **3.1. Testes Unitários (Backend)**

* **Pré-requisitos:** Node.js e dependências (`npm install`) instaladas no diretório do backend.
* **Comandos:**
    ```bash
    # Rodar todos os testes unitários uma vez
    npm test

    # Rodar os testes em modo "watch"
    npm test -- --watch

    # Gerar um relatório de cobertura de testes
    npm test -- --coverage
    ```

### **3.2. Testes de Aceitação / E2E (Frontend)**

* **Pré-requisitos:** Node.js e dependências (`npm install`) instaladas no diretório do frontend. Ambos os servidores (backend e frontend) devem estar rodando.
* **Comandos:**
    ```bash
    # Abrir o Test Runner do Cypress em modo interativo
    npx cypress open

    # Rodar todos os testes em modo "headless" (linha de comando)
    npx cypress run
    ```
