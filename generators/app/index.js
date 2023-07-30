var Generator = require('yeoman-generator');

module.exports = class extends Generator {
  method1() {
    this.log('método 1 acabou de rodar');
  }

  method2() {
    this.log('método 2 também');
  }
};
