/**
* Вспомогательные методы
* @class
*/
class Helper
{
    /**
    * случайное булево значение с заданной вероятностью
    *
    * @static
    * @param {number} [prob=0.5] - вероятность
    * @returns {boolean} значение
    */
    static getRand(prob = 0.5) {
        return Math.random() > prob;
    }

    /**
    * массив с диапазоном чисел
    *
    * @static
    * @param {number} size - размер диапазона
    * @returns {number[]} массив с числами от 0 до size-1
    */
    static getRange(size) {
        return [... this.getRangeX(size)];
    }

    /**
    * итератор с диапазоном чисел
    *
    * @static
    * @param {number} size - размер диапазона
    * @returns {IterableIterator<number>}
    */
    static getRangeX(size) {
        return Array(size).keys();
    }
}

/**
* базовый класс для игровых элементов
*/
class GameElement {
    /**
    * конструктор
    *
    * @param {Object} scene - сцена
    * @param {Maze} maze - лабиринт
    */
    constructor(scene, maze) {
        this.set({"scene": scene, "maze": maze})._prepare().refresh();
    }

    /**
    * обновляет позицию элемента в случайной ячейке коридора лабиринта
    *
    * @returns {GameElement}
    */
    refresh() {
        return this._place(this.maze.getHallRandom());
    }

    /**
    * подготавливает элемент к использованию
    * @protected
    * @returns {GameElement}
    */
    _prepare() {
        return this;
    }

    /**
    * размещает элемент в указанной ячейке
    * @protected
    * @param {Cell} cell - ячейка лабиринта
    * @returns {GameElement}
    */
    _place(cell) {
        return this
            ._setCell(this.cell, false)
            ._setCell(this.cell = cell, true);
    }

    /**
    * перемещает элемент в указанную позицию
    * @protected
    * @param {number} y
    * @param {number} x
    * @returns {boolean}
    */
    _move(y, x) {
        const cell = this.maze.getCell(y, x);

        return cell && !cell.wall && this._place(cell);
    }

    /**
    * метод для перемещения в указанную позицию
    *
    * @param {number} y - Y
    * @param {number} x - X
    * @returns {boolean} Результат перемещения
    */
    moveTo(y, x) {
        return this._move(y, x);
    }

    /**
    * перемещает элемент относительно текущей позиции
    *
    * @param {number} y - смещение по Y
    * @param {number} x - смещение по X
    * @returns {boolean}
    */
    moveBy(y, x) {
        return this._move(this.cell.y + y, this.cell.x + x);
    }

    /**
    * устанавливает атрибут для ячейки
    *
    * @protected
    * @param {Cell} cell - ячейка лабиринта
    * @param {boolean} [bool=true] - значение атрибута
    * @param {string} [attr=null] - имя атрибута
    * @param {string[]} [except=[]] - массив исключаемых ключей
    * @returns {GameElement}
    */
    _setCell(cell, bool = true, attr = null, except = []) {
        if (attr && cell && except.every(key => !cell[key])) cell[attr] = bool;

        return this;
    }
}

/**
* элемент-подарок
*/
class Gift extends GameElement {
    /**
    * установка ячейки для подарка
    *
    * @protected
    * @param {Cell} cell - ячейка коридора лабиринта
    * @param {boolean} [bool=true] - значение атрибута
    * @param {string} [attr="gift"] - имя атрибута
    * @param {string[]} [except=["wall", "player"]] - массив исключаемых ключей
    * @returns {Gift}
    */
    _setCell(cell, bool = true, attr = "gift", except = ["wall", "player"]) {
        return super._setCell(cell, bool, attr, except);
    }

    /**
    * обновляет позицию подарка, избегая совпадения с позицией игрока
    *
    * @returns {Gift}
    */
    refresh() {
        do {
            super.refresh();
        } while (this.cell?.equals(this.scene.player?.cell));

        return this;
    }
}

/**
* игровой персонаж
*/
class Player extends GameElement {
    /**
    * метод установки ячейки для игрока
    *
    * @protected
    * @param {Cell} cell - ячейка коридора лабиринта
    * @param {boolean} [bool=true] - значение атрибута
    * @param {string} [attr="player"] - имя атрибута
    * @param {string[]} [except=["wall"]] - массив исключаемых ключей
    * @returns {Player}
    */
    _setCell(cell, bool = true, attr = "player", except = ["wall"]) {
        if (this.scene.gift?.cell?.equals(cell)) {
            // Если игрок попал на ячейку с подарком
            this.scene.crashed ++;
            this.scene.scores += this.scene.prize;
            this.scene.gift.refresh();
        }
        else if (this.scene.scores <= 0) this.scene.finish(); // Если очки закончились
        else if (this.scene.scores > 0) -- this.scene.scores; // Уменьшаем счетчик очков

        return super._setCell(cell, bool, attr, except);
    }
}

/**
* игровая сцена
* управляет отрисовкой игрового поля, обработкой событий и игровой логикой
* @class
*/
class Scene
{
    /**
    * конструктор
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
    * объект документа, связанный с указанным или текущим элементом
    *
    * @protected
    * @param {HTMLElement|null} [el=null] - элемент
    * @returns {Document} Объект документа
    */
    _getDocument(el = null) {
        return (el || this.el).ownerDocument;
    }

    /**
    * объект окна, связанный с указанным или текущим элементом
    *
    * @protected
    * @param {HTMLElement|null} [el=null] - элемент
    * @param {Array<string>} [where=["parentWindow", "defaultView"]] - атрибуты для поиска окна
    * @returns {Window} объект окна
    */
    _getWindow(el = null, where = ["parentWindow", "defaultView",]) {
        const doc = this._getDocument(el);

        return where.map(attr => doc[attr]).find(win => win);
    }

    /**
    * нажатия клавиш для управления игроком
    *
    * @protected
    * @param {KeyboardEvent} evt - Событие клавиатуры
    * @param {Object} [keys={
    *   "arrowup": [-1, 0],
    *   "arrowdown": [1, 0],
    *   "arrowleft": [0, -1],
    *   "arrowright": [0, 1]
    * }] - соответствие клавиш изменениям координат [deltaY, deltaX]
    * @returns {Scene}
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
    * подготавливает игровое поле: настраивает сетку и создает клетки
    *
    * @protected
    * @returns {Scene}
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
    * обработчики событий для сцены
    *
    * @protected
    * @returns {Scene}
    */
    _prepareEvents() {
        this._getWindow()
            .addEventListener("keydown", evt => this._handleKeys(evt));

        return this;
    }

    /**
    * начальная подготовка сцены
    * @protected
    * @returns {Scene}
    */
    _prepare() {
        return this._prepareDesk()._prepareEvents();
    }

    /**
    * перерисовывает игровое поле на основе текущего состояния
    *
    * @protected
    * @returns {Scene}
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
    * запускает выполнение игры с периодической перерисовкой
    *
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
    * завершает игру, показывая диалог завершения
    *
    * @returns {Scene}
    */
    finish() {
        setTimeout(
            () => this.done()._getDocument()
                .querySelector(this.el.dataset.finish)
                ?.showModal()
            , 100
        );

        return this;
    }

    /**
    * останавливает выполнение игры
    *
    * @returns {Scene}
    */
    done() {
        this._getWindow().clearInterval(this._int);

        return this;
    }
}

/**
* лабиринт
* @class
*/
class Maze
{
    /**
    * конструктор
    *
    * @constructor
    * @param {Scene} scene - связанная сцена
    */
    constructor(scene) {
        this.scene = scene;
        this._generate();
    }

    /**
    * данные лабиринта
    *
    * @returns {Array<Array<Object>>} массив объектов клеток лабиринта
    */
    getData() {
        return this.data;
    }

    /**
    * случайная клетка коридора (не стены) из лабиринта
    *
    * @param {number} prob - вероятность выбора
    * @returns {Object}
    */
    getHallRandom(prob = 0.998) {
        const hall = this.getHall();

        while (true)
            for (let i = 0; i < hall.length; i ++)
                if (Helper.getRand(prob))
                    return hall[i];
    }

    /**
    * исходные данные для лабиринта
    * двумерный массив клеток со случайными стенами
    *
    * @protected
    * @returns {Array<Array<Object>>}
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
    * генерирует лабиринт на основе начальных данных
    * удаляет некоторые стены между компонентами связности
    *
    * @protected
    */
    _generate() {
        this.data = this._generateData();
        const hall = this.getHall();
        const shift = this._getShift();
        const chunks = this.getHallChunks(hall, shift);
        const borders = this._getBorders(hall, shift, this.data);

        return this._getRemoveWall(chunks);
    }

    /**
    * клетка лабиринта по координатам
    *
    * @param {number} y
    * @param {number} x
    * @returns {Object|null}
    */
    getCell(y, x) {
        return this._getCell(this.getCells(), y, x);
    }

    /**
    * клетки лабиринта в виде одномерного массива
    * @returns {Array<Object>}
    */
    getCells() {
        return this.getData().flat();
    }

    /**
    * поиск клетки по координатам по даннному списку клеток
    *
    * @protected
    * @param {Array<Object>} cells - массив клеток для поиска
    * @param {number} y
    * @param {number} x
    * @returns {Object|null} клетка
    */
    _getCell(cells, y, x) {
        return cells.flat().find(cell => (cell.y == y) && (cell.x == x));
    }

    /**
    * все клетки коридора (не стены) лабиринта
    *
    * @returns {Array<Object>} Массив свободных клеток
    */
    getHall() {
        return this.getCells().filter(cell => !cell.wall);
    }

    /**
    * массив смещений для поиска соседних клеток
    * все возможные смещения в квадрате размера size × size, исключая диагонали
    *
    * @protected
    * @param {number} [size=3] - размер области смещений (по умолчанию 3×3)
    * @returns {Array<Array<number>>} массив смещений [dy, dx]
    */
    _getShift(size = 3) {
        const shift = [... Array(size).keys()].map(i => i - 1);

        return shift
            .map(y => shift.map(x => [y, x,]))
            .flat()
            .filter(cell => cell[0] != -cell[1]);
    }

    /**
    * разделяет свободные клетки на связные компоненты (chunks)
    * находит группы связанных свободных клеток с помощью обхода в ширину/глубину
    *
    * @param {Array<Object>} hall - массив свободных клеток
    * @param {Array<Array<number>>} shift - массив смещений для поиска соседей
    * @returns {Array<Array<Object>>} массив связных компонентов (массивов клеток)
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
    * находит граничные стены вокруг свободных клеток
    * определяет, какие стены граничат со свободными клетками
    *
    * @protected
    * @param {Array<Object>} hall - массив свободных клеток
    * @param {Array<Array<number>>} shift - массив смещений для поиска соседей
    * @param {Array<Array<Object>>} cells - все клетки лабиринта
    * @returns {Array<Object>} массив граничных стен
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
    * удаляет некоторые стены между связными компонентами, соединяя лабиринт
    * случайным образом выбирает граничные стены для удаления
    *
    * @protected
    * @param {Array<Array<Object>>} chunks - связные компоненты свободных клеток
    * @returns {Array} результат удаления стен
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