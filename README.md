Aplicação Aprendizado Yeoman
===

# Generator

Um *generator* é, em essência, um módulo Node.js. 

## Setup Inicial

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