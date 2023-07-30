Aplicação Aprendizado Yeoman
===

# Configuração

Um *generator* é, em essência, um módulo Node.js. 

## Módulo NPM / package.json

Para criar um *generator*, algumas condições devem ser observadas:

- criá-lo em um diretório com o prefixo `generator-` pois o Yeoman utiliza o file system para encontrar *generators* disponíveis;
- como se trata de um módulo Node.js, criar um arquivo `package.json`, executando um `pnpm init` por exemplo;
- o `package.json` gerado deve atender a algumas condições:
  - a propriedade `keywords` dentro do package.json deve conter `yeoman-generator`;
  - a propriedade `files` deve ser um array de arquivos e diretórios utilizados pelo *generator*;
  - possuir como dependência a última versão do módulo `yeoman-generator`.

```json
{
  "name": "generator-aprendizado",
  "version": "1.0.0",
  "description": "Generator Yeoman apenas para fins de fixação de aprendizado sobre a ferramenta de scafolding",
  "keywords": [
    "yeoman-generator"
  ],
  "files": [ "generators" ],  
  "author": "Fabiano Nascimento",
  "license": "ISC",
  "dependencies": {
    "yeoman-generator": "^5.9.0"
  }
}
```
*Exemplo de package.json de um generator*

## Árvore de Diretórios

O funcionamento do Yeoman é dependente de como está estruturada a árvore de diretórios. Casa *sub-generator* está contido dentro do seu próprio diretório.

O *generator* default utilizado quando se executa `yo <nome>` é o *generator* `app`, que deve estar contigo dentro do diretório `app/`.

*Sub-generators*, usados quando se exeucuta `yo <nome>:<sub comando>`, são armazenados em diretórios com o mesmo nome do sub comando. Por exemplo, na estrutura de um *generator* com esta abaixo, poderão ser executados os comandos `yo xpto` e `yo xpto:router`.

```
└───generator-xpto
    ├───package.json
    └───generators/
        ├───app/
        │   └───index.js
        └───router/
            └───index.js
```

O Yeoman permite dois tipos de estruturação de diretórios. Além da estrutura acima onde os *sub-generator* estão dentro de `generators`, também é possível que os *sub-generators* estejam na raiz:

```
└───generator-xpto
    ├───package.json
    ├───app/
    │   └───index.js
    └───router/
        └───index.js
```

Neste segundo cenário, a propriedade `files` do `package.json` deve listar cada um dos diretórios dos *sub-generators*:

```json
{
  "name": "generator-aprendizado",
  "version": "1.0.0",
  "description": "Generator Yeoman apenas para fins de fixação de aprendizado sobre a ferramenta de scafolding",
  "keywords": [
    "yeoman-generator"
  ],
  "files": [ "app", "router" ],  
  "author": "Fabiano Nascimento",
  "license": "ISC",
  "dependencies": {
    "yeoman-generator": "^5.9.0"
  }
}
```

# Desenvolvimento

O Yeoman oferece uma classe base chamada `Generator` com funcionalidades básicas para facilitar o desenvolvimento de um novo *generator*. Assim, o primeiro passo é extender essa classe:

```javascript
var Generator = require('yeoman-generator');

module.exports = class extends Generator {};
```

## Construtor

Alguns métodos podem ser chamados apenas dentro da função `constructor`. Esses métodos especiais pode fazer coisas como setar estados de controle e podem não funcionar fora do construtor. Para sobreescrever o construtor do *generator*:

```javascript
module.exports = class extends Generator {
  // The name `constructor` is important here
  constructor(args, opts) {
    // Calling the super constructor is important so our generator is correctly set up
    super(args, opts);

    // Next, add your custom code
    this.option('babel'); // This method adds support for a `--babel` flag
  }
};
```
## Implementação de funcionalidade customizada

Todo método adicionado ao prototype é executado quando o *generator* é invocado e, geralmente, em sequência. Mas como será mostrado nas próximas seções, alguns nomes de métodos especiais são disparados em uma ordem específica.

```javascript
module.exports = class extends Generator {
  method1() {
    this.log('método 1 acabou de rodar');
  }

  method2() {
    this.log('método 2 também');
  }
};
```
Ao executar o *generator* acima, será posssível ver as linhas logadas no console.

## Execução do generator

Para executar um *generator*, ele precisa ser registrado como um módulo NPM global. Enquanto o *generator* ainda está em desenvolvimento, isso pode ser feito criando um link para o diretório do projeto. O comado abaixo deve ser executado passando-se como parâmetro o caminho do diretório raiz do seu projeto (ex. `generator-aprendizado/`):

```shell
pnpm link --dir ~/Projetos/generator-aprendizado/ --global
```

Ou, se estiver utilizando a ferramenta NPM, executar o comando abaixo na própria raiz do projeto:

```shell
npm link
```

Após o procedimento de configuração acima, basta executar o *generator*:

```shell
yo <nome generator sem o prefixo>
```
## Contexto de Execução

Cada método adicionado diretamente ao prototype Generator é considerado uma *Task*. Cada *task* é executada em sequência pelo ambiente de loop de execução do Yeoman. Em outras palavras, cada função retornada por `Object.getPrototypeOf(Generator)` irá ser executada automaticamente.

### Métodos auxiliares e privados

Para definir métodos auxiliares, de forma que não sejam considerados *Tasks* e executados de forma automática, pode ser feito de 3 formas diferentes:

1. Colocar um underscore como prefixo:
   ```javascript
    class extends Generator {
        method1() {
            console.log('hey 1');
        }

        _metodo_privado() {
            console.log('private hey');
        }
    }
   ```
2. Usar métodos de instância:
    ```javascript
    class extends Generator {
        constructor(args, opts) {
            // Calling the super constructor is important so our generator is correctly set up
            super(args, opts)

            this.helperMethod = function () {
                console.log('won\'t be called automatically');
            };
        }
    }
   ```
3. Extender um *generator* pai:
    ```javascript
    class MyBase extends Generator {
        helper() {
            console.log('methods on the parent generator won\'t be called automatically');
        }
    }

    module.exports = class extends MyBase {
        exec() {
            this.helper();
        }
   };
   ```

## Loop de Execução

A execução de *tasks* sequencialmente é trivial se existe apenas um *generator*. Mas não é suficiente se você começar a compor *generators* em conjunto. Por isso, o Yeoman utiliza um Loop de Execução (run loop).

O loop de execução é um sistema de filas com suporte a prioridade. Yeoman utiliza o módulo [Grouped-queue](https://github.com/SBoudrias/grouped-queue) para gerenciar o loop de execução.

As *priorities* são definidas no seu código como nomes de métodos especiais. Quando o nome de um método é o mesmo que o nome de uma *priority*, o loop de execução coloca o método em uma fila especial. Se o nome do método não coincide com o de uma *priority*, ele é colocado em um grupo default.

As *priorities* disponíveis em ordem de execução são:

1. `initializing`: métodos de inicialização como checagem do estado do projeto, obtenção de configurações etc;
2. `prompting`: onde solicita-se que o usuário faça escolhas entre as opções disponíveis;
3. `configuring`: salva configurações e configura o projeto como, por exemplo, criar arquivo `.editorconfig` e outros arquivos com metadados;
4. `default`: Se o nome do método não coincide com uma *priority*, entrará neste grupo;
5. `writing`: onde são efetivamente escritos os arquivos do *generator* (classes, controllers, rotas etc);
6. `conflicts`: onde conflitos são tratados (utilizado internamente);
7. `install`: onde as instalações são executadas (npm, bower);
8. `end`: chamada final, limpeza, dizer adeus, etc.


## Tasks assíncronas

Há várias formas de pausar o loop de execução até que uma *task* complete através de trabalho assíncrono.
O caminho mais fácil é retornar uma Promise. O loop continuará quando a Promise for resolvida, ou levantará uma exceção a parar se a Promise falhar.

## Interações com Usuário

### Prompts

Prompts são a forma principal que um *generator* interage com um usuário. O módulo prompt é provido pelo [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) e você deve utilizar como referência sua API para uma lista de opções de prompt disponíveis.

O método `prompt` é assíncrono e retorna uma Promise. Você precisará retornar a Promise da sua *task* a fim de esperar pela conclusão antes de seguir para a próxima.

```javascript
module.exports = class extends Generator {
  async prompting() {
    const answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname // Default to current folder name
      },
      {
        type: "confirm",
        name: "cool",
        message: "Would you like to enable the Cool feature?"
      }
    ]);

    this.log("app name", answers.name);
    this.log("cool feature", answers.cool);
  }
};
```

Um cenário muito comum é usar as respostas do usuário em um estágio posterior, por exemplo, durante a execução da *priority* `writing`. Isso pode ser feito facilmente adicionando-as ao contexto `this`:

```javascript
module.exports = class extends Generator {
  async prompting() {
    this.answers = await this.prompt([
      {
        type: "confirm",
        name: "cool",
        message: "Would you like to enable the Cool feature?"
      }
    ]);
  }

  writing() {
    this.log("cool feature", this.answers.cool); // user answer `cool` used
  }
};
```

O usuário pode dar a mesma resposta a certas questões toda vez que ele executar seu *generator*. Para essas questões, você provavelmente quer lembrar a resposta dada anteriormente como o nome valor default.

Para isso, marque a propriedade `store` como true.

```javascript
this.prompt({
  type: "input",
  name: "username",
  message: "What's your GitHub username",
  store: true
});
```


### Arguments

Arguments são passados diretamente na linha de comando. No exemplo a seguir, "jujuba" seria o primeiro Argument do generator-aprendizado:

```shell
yo aprendizado jujuba
```

Para notificar o sistema que é esperado um Argument, utiliza-se o método `this.argument()`. Esse método aceita uma string com o nome do Argument além de um conjunto de opções.

O Argument "nome" estará então disponível como: `this.options["nome"]`.

As configurações do Argument aceitam múltiplos pares de chaves/valor:

- desc: descrição do Argument
- required: booleano indicando obrigatoriedade do Argument
- type: String, Number, Array (pode também ser uma função customizada para receber uma string e parseá-la)
- default: valor default

Este método deve ser chamado dentro do construtor. Do contrário, Yeoman não conseguirá exibir informação relevante quando o usuário utilizar o help `yo aprendizado --help`.

```javascript
module.exports = class extends Generator {
  // note: arguments and options should be defined in the constructor.
  constructor(args, opts) {
    super(args, opts);

    // This makes `appname` a required argument.
    this.argument("appname", { type: String, required: true });

    // And you can then access it later; e.g.
    this.log(this.options.appname);
  }
};
```

### Options

Options se parecem muito com Arguments, mas elas são escritas como *flags* de linha de comando.

```shell
yo aprendizado --cafe
```

Para notificar o sistema que é esperado um Option, utiliza-se o método `this.option()`. Esse método aceita uma string com o nome do Option além de um conjunto de opções.

O Option "nome" estará então disponível como: `this.options["nome"]`.

As configurações do Optoin aceitam múltiplos pares de chaves/valor:

- desc: descrição do Option
- alias: nome curto para o Option
- type: String, Number, Array (pode também ser uma função customizada para receber uma string e parseá-la)
- default: valor default
- hide: booleano que indica se deve ocultá-lo no help


```javascript
module.exports = class extends Generator {
  // note: arguments and options should be defined in the constructor.
  constructor(args, opts) {
    super(args, opts);

    // This method adds support for a `--coffee` flag
    this.option("cafe");

    // And you can then access it later; e.g.
    this.scriptSuffix = this.options.coffee ? ".cafe" : ".js";
  }
};
```