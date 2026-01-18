/**
* Расширяет прототип Node для удаления клонированных дочерних элементов
* Удаляет все дочерние элементы с псевдоклассом 'clone'
*
* @function
* @name Node.prototype.removeChildrenCloned
* @returns {undefined}
*/
Node.prototype.removeChildrenCloned = function() {
    this.querySelectorAll("& > .clone").forEach(subNode => subNode.remove());
};

/**
* Расширяет прототип Node для одновременного поиска нескольких элементов
* Выполняет несколько поисков через querySelector и возвращает массив результатов
*
* @function
* @name Node.prototype.querySelectors
* @param {...string} cssSelectors - Один или несколько CSS-селекторов для поиска элементов
* @returns {Array<Element|null>} Массив найденных элементов (null для не найденных)
*/
Node.prototype.querySelectors = function(...cssSelectors) {
    return cssSelectors.map(cssSelector => this.querySelector(cssSelector));
};

/**
* Расширяет прототип Object для массового установки свойств
* Позволяет передавать несколько объектов для последовательного копирования свойств
* Копирует все перечислимые собственные свойства из каждого объекта в текущий объект
*
* @function
* @name Object.prototype.set
* @param {...Object} datas - один или несколько объектов, свойства которых будут скопированы
* @returns {Object} текущий объект (для цепочки вызовов)
*/
Object.prototype.set = function(... datas) {
    Object.assign(this, datas);

    return this;
};

/**
* Расширяет прототип Object для сравнения объектов
* Сравнивает свойства текущего объекта с объектом obj
*
* @function
* @name Object.prototype.equals
* @param {Object} obj - Объект для сравнения
* @returns {boolean} true, если все соответствующие свойства равны по значению (===)
*/
Object.prototype.equals = function(obj) {
    return obj && Object.entries(obj).every(([key, value,]) => value === this[key]);
};