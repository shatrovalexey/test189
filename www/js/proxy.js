/**
* удаляет все дочерние элементы с псевдоклассом 'clone'
*
* @function
* @name Node.prototype.removeChildrenCloned
* @returns {undefined}
*/
Node.prototype.removeChildrenCloned = function() {
    this.querySelectorAll("& > .clone").forEach(subNode => subNode.remove());
};

/**
* несколько поисков через querySelector и возвращает массив результатов
*
* @function
* @name Node.prototype.querySelectors
* @param {...string} cssSelectors - CSS-селекторы для поиска элементов
* @returns {Array<Element|null>} найденные элементы
*/
Node.prototype.querySelectors = function(...cssSelectors) {
    return cssSelectors.map(cssSelector => this.querySelector(cssSelector));
};

/**
* последовательное копирование свойств из списка объектов
*
* @function
* @name Object.prototype.set
* @param {...Object} datas - один или несколько объектов, свойства которых будут скопированы
* @returns {Object}
*/
Object.prototype.set = function(... datas) {
    Object.assign(this, ... datas);

    return this;
};

/**
* сравнение объектов по атрибутам
*
* @function
* @name Object.prototype.equals
* @param {Object} obj - объект для сравнения
* @returns {boolean} true, если все соответствующие свойства равны по значению (===)
*/
Object.prototype.equals = function(obj) {
    return obj && Object.entries(obj).every(([key, value,]) => value === this[key]);
};