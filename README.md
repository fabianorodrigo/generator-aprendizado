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

# Composibilidade


Yeoman oferece múltiplas formas para os *generators* construírem sobre uma base comum. Não faz sentido em reescrever a mesma funcionalidade, assim uma API é provida para utilizar *generators* dentro de outros.

No Yeoman, a composibilidde pode ser inicializada de duas formas:

- um *generator* pode decidir compor ele mesmo com outro *generator*. Por exemplo, generator-backbone utiliza generator-mocha.
- um usuário final pode também iniciar a composição. Por exemplo, Simon quer gerar um projeto Backbone com SASS e Rails. (composição iniciada por usuário final é uma feature planejada e não está atualmente disponível).

## this.composeWith()


O método `composeWith` permite que o *generator* execute lado a lado com outro *generator* (ou *sub-generator*). Desta forma ele pode utilizar funcionalidades do outro *generator* ao invés de ele mesmo ter que fazer tudo ele mesmo.

Ao fazer composição, não se esqueça do que foi falado acima sobre contexto de execução o loop de execução. Em um determinado grupo de *priority* de execução, todos os *generators* compostos irão executar funções naquele grupo. Depois, isso se repetirá para o próximo grupo. A execução entre os *generators* fica na mesma ordem que o  `composeWith` foi chamado.

O método `composeWith` tem 2 parâmetro:

1. `generatorPath`: caminho completo que aponta para o *generator* que você quer compor com (geralmente utilizando `require.resolve()`).
2. `options`: um objeto contendo opções para passar para o *generator* quando ele executar.

Quando compor com um *generator* `peerDependencies`:

```javascript
this.composeWith(require.resolve('generator-bootstrap/generators/app'), {preprocessor: 'sass'});
```

`require.resolve` retorna o caminho de onde o Node.js carregaria o módulo provido.

Tenha em mente que é possível compor com outros *generators* públicos disponíveis no repositório NPM.

Para um exemplo mais complexo, verifique o [generator-generator](https://github.com/yeoman/generator-generator/blob/master/app/index.js) que é composto de [generator-node](https://github.com/yeoman/generator-node). 

## dependencies ou peerDependencies

O npm permite três tipos de dependências:

- dependencies: são instalados localmente no *generator*. É a melhor opção para controlar a versão da dependência utilizada, é a opção preferida.
- peerDependencies: são instaladas ao longo do *generator*, como um irmão. Por exemplo, se o generator-backbone declara generator-gruntfile como um peerDependency, a árvore de diretórios ficará assim:
```
 ├───generator-backbone/
 └───generator-gruntfile/
```
- devDependencies: para funcionalidades de teste e desenvolvimento. Esta não é necessária aqui.

Quando utilizar peerDependencies, esteja ciente de que outros módulos podem também precisar do módulo requisitado. Tome cuidado de não criar versões conflitantes ao requisitar uma versão específica (ou um range estreito de versões). A recomendação do Yeoman com peerDependencies é sempre requisitar uma versão maior ou igual a (>=) or qualquer versão (*) disponível:

```json
{
  "peerDependencies": {
    "generator-gruntfile": "*",
    "generator-bootstrap": ">=1.0.0"
  }
}
```

**Nota:** a partir do npm@3, peerDependencies não são mais instaladas automaticamente. Para instalá-las, elas devem ser instaladas manualmente.

# Gerência de Dependências

Uma vez que você executou seus *generators*, você frequentemente vai querer executar npm, pnpm, yarn ou bower para instalar dependências adicionais que seu *generator* requer.

Como essas ações são muito frequentes, o Yeoman já as abstrai. Note que a funcionalidade de instalação provida é automaticamente agendada para executar como parte da fila de *priorities* `install`. Se você precisar realizar algo após a instalação, utilize a fila `end`.

## npm

Você precisa apenas chamar `this.npmInstall()` para rodar a instalação npm. O Yeoman assegurará que seja executada apenas uma vez mesmo que seja chamada múltiplas vezes por diferentes *generators*.

```javascript
class extends Generator {
  installingLodash() {
    this.npmInstall(['lodash'], { 'save-dev': true });
  }
}
```

Você pode criar ou extender seu `package.json` programaticamente se você não quiser utilizar um template. As ferramentas de file system do Yeoman pode ajudar nisto.

Exemplo em que se define `eslint` como dependência de desenvolvimento e `react` como dependência:

```javascript
lass extends Generator {
  writing() {
    const pkgJson = {
      devDependencies: {
        eslint: '^3.15.0'
      },
      dependencies: {
        react: '^16.2.0'
      }
    };

    // Extend or create package.json file in destination path
    this.fs.extendJSON(this.destinationPath('package.json'), pkgJson);
  }

  install() {
    this.npmInstall();
  }
};
```

# Interação com o Sistema de Arquivos

As funcionalidades de arquivo do Yeoman são baseadas na ideia de que você tem dois contexto de localização no disco. Esses contextos são diretórios que seu *generator* mais provavelmente lerá e escreverá.

## Contextos e Caminhos de Localização

### Contexto de destino

O primeiro contexto é o **contexto de destino**. O destino é um diretório no qual o Yeoman irá gerar uma nova aplicação. É o diretório do projeto do desenvolvedor, é onde serão gerados a maioria dos arquivos da aplicação gerada.

O contexto de destino é definido como o diretório corrente ou o diretório pais mais próximo contendo um arquivo `.yo-rc.json`. O arquivo `.yo.rc-json` define a raiz do projeto Yeoman. Esse arquivo permite que o desenvolvedor execute comandos nos subdiretórios e os faça trabalhar juntos no projeto. Isso garante um comportamento consistente para o desenvolvedor.

Pode-se obter o caminho de destino utilizando `this.destinationRoot()` ou juntando o caminho usando `this.destinationPath('sub/path')`.

```javascript
// Given destination root is ~/projects
class extends Generator {
  paths() {
    this.destinationRoot();
    // returns '~/projects'

    this.destinationPath('index.js');
    // returns '~/projects/index.js'
  }
}
```

Também é possível mudá-lo manualmente usando `this.destinationRoot('new/path')`. Mas por uma questão de consistência, você provavelmente não deveria mudar o default.

Se você quer saber de onde o desenvolvedor está executando `yo`, então você pode obter o path com `this.contextRoot`. Este é o caminho de onde `yo` foi invocado.

### Contexto de templates

O contexto de template é o diretório no qual seus arquivos de template estão armazenados. Normalmente é o diretório de onde você lê e copia.

O contexto de template é definido como `./templates` por padrão. Você pode sobreescrever este padrão usando `this.sourceRoot('new/template/path')`.

Você pode obter o valor do caminho utilizando `this.sourceRoot()` ou juntando um path com `this.templatePath('app/index.js')`.

```javascript
class extends Generator {
  paths() {
    this.sourceRoot();
    // returns './templates'

    this.templatePath('index.js');
    // returns './templates/index.js'
  }
};
```

## Sistema de arquivos em memória

O Yeoman é muito cuidadoso quando se trata de sobrescrever arquivos de usuários. Basicamente, toda escrita em um arquivo pré-existente passará por um processo de resolução de conflito. Este processo requer que o usuário valide cada escrita que sobrescreve conteúdo de um arquivo.

Esse comportamento previne surpresas ruins e limita o risco de erros. Por outro lado, isso significa que todo arquivo é escrito de forma assíncrona no disco.

Como APIs assíncronas são mais difíceis de usar, o Yeoman provê uma API síncrona de sistema de arquivos onde todos os arquivos são escritos em um [sistema de arquivos em memória](https://github.com/sboudrias/mem-fs) e são somente escritos no disco quando o Yeoman conclui sua execução.

Este sistema de arquivos em memória é compartihado entre todos os *generators*.

## Utilitários de Arquivo

Os *generators* expõem todos os métodos de arquivo através de `this.fs`, que é uma instância de [mem-fs editor](https://github.com/sboudrias/mem-fs-editor).

Vale a pena notar que apesar de  `this.fs` expor o método `commit`, você não deveria chamá-lo no seu *generator*. O Yeoman chama este método internamente depois que o estágio de confitos do loop de execução.

### Exemplo: Cópia de um arquivo de template

Dado o template `./templates/index.html`:


```html
<html>
  <head>
    <title><%= title %></title>
  </head>
</html>
```

Usaremos o método `copyTpl` para copiar o arquivo enquanto processamos o seu conteúdo como um template pela sintaxe [EJS](http://ejs.co/).

```javascript
class extends Generator {
  writing() {
    this.fs.copyTpl(
      this.templatePath('index.html'),
      this.destinationPath('public/index.html'),
      { title: 'Templating with Yeoman' }
    );
  }
}
```

Quando o *generator* finalizar sua execução, o arquivo `public/index.html` terá o seguinte conteúdo:

```html
<html>
  <head>
    <title>Templating with Yeoman</title>
  </head>
</html>
```

Um cenário muito comum é armazenar as respostas do usuário no [estágio de prompting](https://yeoman.io/authoring/user-interactions.html) e usá-las para template:

```javascript
class extends Generator {
  async prompting() {
    this.answers = await this.prompt([{
      type    : 'input',
      name    : 'title',
      message : 'Your project title',
    }]);
  }

  writing() {
    this.fs.copyTpl(
      this.templatePath('index.html'),
      this.destinationPath('public/index.html'),
      { title: this.answers.title } // user answer `title` used
    );
  }
}
```

## Transformação de arquivos de saída através de streams

O sistema de *generator* permite que você aplique filtros customizados em toda escrita de arquivo. Embelezar arquivos automaticamente, normalizar espaços em branco, etc., é totalmente possível.

Uma vez por processo, escreveremos todos os arquivos modificados no disco. Esse processo é passado através de um objeto de stream [vinyl](https://github.com/wearefractal/vinyl) (exatamente como o [gulp](http://gulpjs.com/)). Qualquer *generator* pode registrar um `transformStream` para modificar o caminho do arquivo e/ou seu conteúdo.

O registro de um modificador é feito através do método `registerTransformStream()`. Por exemplo:

```javascript
var beautify = require("gulp-beautify");
this.registerTransformStream(beautify({ indent_size: 2 }));
```
Perceba que **todo arquivo de qualquer tipo passará por este stream**. Certifique-se de que qualquer fluxo de transformação passará pelos arquivos incompatíveis. Ferramentas como [gulp-if](https://github.com/robrich/gulp-if) ou [gulp-filter](https://github.com/sindresorhus/gulp-filter) ajudarão a filtrar tipos inválidos e passá-los.

Basicamente, você pode usar qualquer plug-in gulp com o fluxo de transformação Yeoman para processar arquivos gerados durante a fase de gravação.

## Atualização de conteúdo de arquivos existentes

A atualização de arquivos pré-existentes nem sempre é uma tarefa simples. A forma mais confiável de fazê-lo é parsear a AST (abstract syntax tree) do arquivo e editá-la. O principal problema com esta solução é que editar uma AST pode ser verboso e um pouco difícil de compreender.

Alguns parsers de AST populares são:

- [Cheerio](https://github.com/cheeriojs/cheerio) para HTML
- [Esprima](https://github.com/ariya/esprima) para Javascript
- Para arquivos JSON, pode-se utilizar os métodos nativos do objeto JSON

Parsear um arquivo de código com RegEx é um caminho perigoso e, antes de fazê-lo, você deveria ler essas [respostas antropológicas](http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags#answer-1732454) e entender as falhas de parse com RegEx. Se você optar por editar os arquivos existentes usando o RegEx em vez da árvore AST, tenha cuidado e forneça testes de unidade completos.