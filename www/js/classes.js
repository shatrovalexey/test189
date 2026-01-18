/**
* Класс вспомогательных методов
*/
class Helper
{
    /**
    * Генерирует случайное булево значение с заданной вероятностью
    *
    * @static
    * @param {number} [prob=0.5] - Вероятность получения true (от 0 до 1)
    * @returns {boolean} Случайное булево значение
    */
    static getRand(prob = 0.5) {
        return Math.random() > prob;
    }

    /**
    * Создает массив с диапазоном чисел
    *
    * @static
    * @param {number} size - Размер диапазона
    * @returns {number[]} Массив с числами от 0 до size-1
    */
    static getRange(size) {
        return [... this.getRangeX(size)];
    }

    /**
    * Создает итератор с диапазоном чисел
    *
    * @static
    * @param {number} size - Размер диапазона
    * @returns {IterableIterator<number>} Итератор с числами
    */
    static getRangeX(size) {
        return Array(size).keys();
    }
}

/**
* Базовый класс для игровых элементов, взаимодействующих с лабиринтом
*/
class GameElement {
    /**
    * Конструктор класса GameElement
    *
    * @param {Object} scene - Объект сцены
    * @param {Maze} maze - Объект лабиринта
    */
    constructor(scene, maze) {
        this.set({"scene": scene, "maze": maze})._prepare().refresh();
    }

    /**
    * Обновляет позицию элемента в случайной ячейке лабиринта
    *
    * @returns {GameElement} Текущий экземпляр для цепочки вызовов
    */
    refresh() {
        return this._place(this.maze.getHallRandom());
    }

    /**
    * Подготавливает элемент к использованию
    *
    * @returns {GameElement} Текущий экземпляр для цепочки вызовов
    */
    _prepare() {
        return this;
    }

    /**
    * Размещает элемент в указанной ячейке
    *
    * @param {Cell} cell - Ячейка лабиринта
    * @returns {GameElement} Текущий экземпляр для цепочки вызовов
    */
    _place(cell) {
        return this
            ._setCell(this.cell, false)
            ._setCell(this.cell = cell, true);
    }

    /**
    * Перемещает элемент в указанную позицию
    *
    * @param {number} y - Координата Y
    * @param {number} x - Координата X
    * @returns {boolean} true если перемещение успешно, false если нет
    */
    _move(y, x) {
        const cell = this.maze.getCell(y, x);

        if (!cell || cell.wall) return false;

        return cell && !cell.wall && this._place(cell);
    }

    /**
    * Публичный метод для перемещения в указанную позицию
    *
    * @param {number} y - Координата Y
    * @param {number} x - Координата X
    * @returns {boolean} Результат перемещения
    */
    moveTo(y, x) {
        return this._move(y, x);
    }

    /**
    * Перемещает элемент относительно текущей позиции
    *
    * @param {number} y - Смещение по Y
    * @param {number} x - Смещение по X
    * @returns {boolean} Результат перемещения
    */
    moveBy(y, x) {
        return this._move(this.cell.y + y, this.cell.x + x);
    }

    /**
    * Устанавливает атрибут для ячейки
    *
    * @param {Cell} cell - Ячейка лабиринта
    * @param {boolean} [bool=true] - Значение атрибута
    * @param {string} [attr=null] - Имя атрибута
    * @param {string[]} [except=[]] - Массив исключаемых ключей
    * @returns {GameElement} Текущий экземпляр для цепочки вызовов
    */
    _setCell(cell, bool = true, attr = null, except = []) {
        if (attr && cell && except.every(key => !cell[key])) {
            cell[attr] = bool;
        }
        return this;
    }
}

/**
* Класс Gift представляет собой игровой элемент-подарок, наследующий функциональность от GameElement
*/
class Gift extends GameElement {
    /**
    * Переопределяет метод установки ячейки для подарка
    *
    * @param {Cell} cell - Ячейка лабиринта
    * @param {boolean} [bool=true] - Значение атрибута
    * @param {string} [attr="gift"] - Имя атрибута (по умолчанию "gift")
    * @param {string[]} [except=["wall", "player"]] - Массив исключаемых ключей
    * @returns {Gift} Текущий экземпляр для цепочки вызовов
    */
    _setCell(cell, bool = true, attr = "gift", except = ["wall", "player"]) {
        return super._setCell(cell, bool, attr, except);
    }

    /**
    * Обновляет позицию подарка, избегая совпадения с позицией игрока
    *
    * @returns {Gift} Текущий экземпляр
    */
    refresh() {
        do {
            super.refresh();
        } while (this.cell?.equals(this.scene.player?.cell));

        return this;
    }
}

/**
* Класс Player представляет собой игрового персонажа, наследующий функциональность от GameElement
*/
class Player extends GameElement {
    /**
    * Переопределяет метод установки ячейки для игрока
    *
    * @param {Cell} cell - Ячейка лабиринта
    * @param {boolean} [bool=true] - Значение атрибута
    * @param {string} [attr="player"] - Имя атрибута (по умолчанию "player")
    * @param {string[]} [except=["wall"]] - Массив исключаемых ключей
    * @returns {Player} Текущий экземпляр для цепочки вызовов
    */
    _setCell(cell, bool = true, attr = "player", except = ["wall"]) {
        if (this.scene.gift?.cell?.equals(cell)) {
            // Если игрок попал на ячейку с подарком
            this.scene.crashed ++;
            this.scene.scores += this.scene.prize;
            this.scene.gift.refresh();
        } else if (this.scene.scores <= 0) {
            // Если очки закончились
            this.scene.finish();
        } else if (this.scene.scores > 0) {
            // Уменьшаем счетчик очков
            --this.scene.scores;
        }

        return super._setCell(cell, bool, attr, except);
    }
}

/**
* Класс, представляющий игровую сцену/поле
* Управляет отрисовкой игрового поля, обработкой событий и игровой логикой
* @class
*/
class Scene
{
    /**
    * Создает экземпляр игровой сцены
    * @constructor
    * @param {HTMLElement} el - DOM-элемент, представляющий игровое поле
    * @param {number} sizeY - Высота игрового поля в клетках
    * @param {number} sizeX - Ширина игрового поля в клетках
    */
    constructor(el, sizeY, sizeX) {
        const square = sizeY * sizeX;

        this.set({
            "el": el
            , "sizeY": sizeY
            , "sizeX": sizeX
            , "scores": square
            , "crashed": 0
            , "prize": Math.floor(Math.sqrt(square))
            ,
        })._prepare();
    }

    /**
    * Получает документ, связанный с указанным или текущим элементом
    * @protected
    * @param {HTMLElement|null} [el=null] - Элемент, для которого нужно получить документ
    * @returns {Document} Объект документа
    */
    _getDocument(el = null) {
        return (el || this.el).ownerDocument;
    }

    /**
    * Получает объект окна, связанный с документом
    * @protected
    * @param {HTMLElement|null} [el=null] - Элемент для получения документа
    * @param {Array<string>} [where=["parentWindow", "defaultView"]] - Атрибуты для поиска окна
    * @returns {Window} Объект окна
    */
    _getWindow(el = null, where = ["parentWindow", "defaultView",]) {
        const doc = this._getDocument(el);

        return where.map(attr => doc[attr]).find(win => win);
    }

    /**
    * Обрабатывает нажатия клавиш для управления игроком
    * @protected
    * @param {KeyboardEvent} evt - Событие клавиатуры
    * @param {Object} [keys={
    *   "arrowup": [-1, 0],
    *   "arrowdown": [1, 0],
    *   "arrowleft": [0, -1],
    *   "arrowright": [0, 1]
    * }] - Соответствие клавиш изменениям координат [deltaY, deltaX]
    * @returns {Scene} Возвращает this для цепочки вызовов
    */
    _handleKeys(evt, keys = {
        "arrowup": [-1, 0,]
        , "arrowdown": [1, 0,]
        , "arrowleft": [0, -1,]
        , "arrowright": [0, 1,]
        ,
    }) {
        const key = evt.key.toLowerCase();

        if (!(key in keys)) return;

        evt.preventDefault();

        this.player.moveBy(... keys[key]);

        return this;
    }

    /**
    * Подготавливает игровое поле: настраивает сетку и создает клетки
    * @protected
    * @returns {Scene} Возвращает this для цепочки вызовов
    */
    _prepareDesk() {
        this.el.style.set({
            "gridTemplateColumns": `repeat(${this.sizeX}, max-content)`
            , "gridTemplateRows": `repeat(${this.sizeY}, 1fr)`
            ,
        });
        this.el.removeChildrenCloned();
        this.nodes = [];

        const cellTpl = this.el.querySelector("& > template");

        Helper.getRangeX(this.sizeY * this.sizeX).forEach(() => {
            const cell = cellTpl.content.cloneNode(true).firstElementChild;

            cell.classList.add("clone");
            cellTpl.before(cell);

            this.nodes.push(cell);
        });

        return this;
    }

    /**
    * Настраивает обработчики событий для сцены
    * @protected
    * @returns {Scene} Возвращает this для цепочки вызовов
    */
    _prepareEvents() {
        this._getWindow()
            .addEventListener("keydown", evt => this._handleKeys(evt));

        return this;
    }

    /**
    * Выполняет начальную подготовку сцены
    * @protected
    * @returns {Scene} Возвращает this для цепочки вызовов
    */
    _prepare() {
        return this._prepareDesk()._prepareEvents();
    }

    /**
    * Перерисовывает игровое поле на основе текущего состояния
    * @protected
    * @returns {Scene} Возвращает this для цепочки вызовов
    */
    _redraw() {
        const cells = this.maze.getCells();
        const doc = this._getDocument();

        this.nodes.forEach(node => node.dataset.set(cells.shift()));
        ["scores", "crashed",]
            .forEach(key => doc.querySelector(this.el.dataset[key]).textContent = this[key]);

        return this;
    }

    /**
    * Запускает выполнение игры с периодической перерисовкой
    * @param {Object} data - Данные для инициализации игры
    * @param {number} [intv=100] - Интервал перерисовки в миллисекундах
    * @returns {number} Идентификатор интервала (interval ID)
    */
    execute(data, intv = 100) {
        return this._int = this
            .set(data)
            ._getWindow()
            .setInterval(() => this._redraw(), intv);
    }

    /**
    * Завершает игру, показывая диалог завершения
    */
    finish() {
        setTimeout(() => {
            this.done();

            this._getDocument().querySelector(this.el.dataset.finish)?.showModal();
        }, 100);
    }

    /**
    * Останавливает выполнение игры (очищает интервал)
    */
    done() {
        this._getWindow().clearInterval(this._int);
    }
}

/**
* Класс, представляющий лабиринт
* Генерирует и управляет структурой лабиринта, включая стены, проходы и специальные клетки.
* @class
*/
class Maze
{
    /**
    * Создает экземпляр лабиринта
    * @constructor
    * @param {Scene} scene - Связанная сцена, для которой создается лабиринт
    */
    constructor(scene) {
        this.scene = scene;
        this._generate();
    }

    /**
    * Получает данные лабиринта
    * @returns {Array<Array<Object>>} Двумерный массив объектов клеток лабиринта
    */
    getData() {
        return this.data;
    }

    /**
    * Получает случайную свободную клетку (не стену) из лабиринта
    * Использует вероятностный алгоритм для выбора случайной клетки
    * @param {number} prob - вероятность выбора
    * @returns {Object} Объект случайной свободной клетки
    */
    getHallRandom(prob = 0.998) {
        const hall = this.getHall();

        while (true)
            for (let i = 0; i < hall.length; i ++)
                if (Helper.getRand(prob))
                    return hall[i];
    }

    /**
    * Генерирует исходные данные для лабиринта
    * Создает двумерный массив клеток со случайными стенами
    * @protected
    * @returns {Array<Array<Object>>} Двумерный массив начальных данных лабиринта
    */
    _generateData() {
        return Helper.getRange(this.scene.sizeY).map(
            y => Helper.getRange(this.scene.sizeX).map(
                x => ({
                    "y": y
                    , "x": x
                    , "wall": Helper.getRand()
                    , "player": false
                    , "gift": false
                })
            )
        );
    }

    /**
    * Генерирует лабиринт на основе начальных данных
    * Создает проходы, удаляя некоторые стены между компонентами связности.
    * @protected
    */
    _generate() {
        this.data = this._generateData();

        const cells = this.data;
        const hall = this.getHall();
        const shift = this._getShift();
        const chunks = this.getHallChunks(hall, shift);
        const borders = this._getBorders(hall, shift, cells);

        return this._getRemoveWall(chunks);
    }

    /**
    * Получает конкретную клетку лабиринта по координатам
    * @param {number} y - Y-координата клетки
    * @param {number} x - X-координата клетки
    * @returns {Object|null} Объект клетки или null, если не найдена
    */
    getCell(y, x) {
        return this._getCell(this.getCells(), y, x);
    }

    /**
    * Получает все клетки лабиринта в виде одномерного массива
    * @returns {Array<Object>} Одномерный массив всех клеток лабиринта
    */
    getCells() {
        return this.getData().flat();
    }

    /**
    * Вспомогательный метод для поиска клетки по координатам
    * @protected
    * @param {Array<Object>} cells - Массив клеток для поиска
    * @param {number} y - Y-координата
    * @param {number} x - X-координата
    * @returns {Object|null} Найденная клетка или null
    */
    _getCell(cells, y, x) {
        return cells.flat().find(cell => (cell.y == y) && (cell.x == x));
    }

    /**
    * Получает все свободные клетки (не стены) лабиринта
    * @returns {Array<Object>} Массив свободных клеток
    */
    getHall() {
        return this.getCells().filter(cell => !cell.wall);
    }

    /**
    * Генерирует массив смещений для поиска соседних клеток
    * Создает все возможные смещения в квадрате размера size × size, исключая диагонали
    * @protected
    * @param {number} [size=3] - Размер области смещений (по умолчанию 3×3)
    * @returns {Array<Array<number>>} Массив смещений [dy, dx]
    */
    _getShift(size = 3) {
        const _shift = size => [... Array(size).keys()].map(i => i - 1)

        return _shift(size)
            .map(y => _shift(size).map(x => [y, x,]))
            .flat().filter(cell => cell[0] != -cell[1]);
    }

    /**
    * Разделяет свободные клетки на связные компоненты (chunks)
    * Находит группы связанных свободных клеток с помощью обхода в ширину/глубину
    * @param {Array<Object>} hall - Массив свободных клеток
    * @param {Array<Array<number>>} shift - Массив смещений для поиска соседей
    * @returns {Array<Array<Object>>} Массив связных компонентов (массивов клеток)
    */
    getHallChunks(hall, shift) {
        const self = this;
        const findAround = (y, x) => {
            const cell = self._getCell(hall, y, x);

            if (!cell || cell.seen) return [];

            cell.seen = true;

            return [cell, ... shift.map(([y, x,]) => findAround(cell.y + y, cell.x + x)).flat(),];
        };
        const chunks = hall
            .map(cell => findAround(cell.y, cell.x).flat())
            .filter(row => row.length);

        this.getCells().forEach(cell => delete cell.seen);

        return chunks;
    }

    /**
    * Находит граничные стены вокруг свободных клеток
    * Определяет, какие стены граничат со свободными клетками
    * @protected
    * @param {Array<Object>} hall - Массив свободных клеток
    * @param {Array<Array<number>>} shift - Массив смещений для поиска соседей
    * @param {Array<Array<Object>>} cells - Все клетки лабиринта
    * @returns {Array<Object>} Массив граничных стен
    */
    _getBorders(hall, shift, cells) {
        const self = this;
        const borders = [];

        hall.forEach(cell => {
            cell.border = [];

            shift.forEach(([y, x,]) => {
                const cellCurrent = self._getCell(cells, cell.y + y, cell.x + x);

                if (!cellCurrent || !cellCurrent.wall || cellCurrent.border) return;

                cellCurrent.border = true;
                cell.border.push(cellCurrent);
                borders.push(cellCurrent);
            });
        });

        return borders;
    }

    /**
    * Удаляет некоторые стены между связными компонентами, соединяя лабиринт
    * Случайным образом выбирает граничные стены для удаления
    * @protected
    * @param {Array<Array<Object>>} chunks - Связные компоненты свободных клеток
    * @returns {Array} Результат удаления стен
    */
    _getRemoveWall(chunks) {
        const self = this;
        const result = chunks.map(chunk => {
            return chunk
                .filter(cell => cell.border.length)
                .map(cell => {
                    return cell.border
                        .filter(() => Helper.getRand())
                        .map(border => border.wall = false);
                });
        });

        result.flat().forEach(cell => delete cell.border);

        return result;
    }
}