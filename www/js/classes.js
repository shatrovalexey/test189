class Helper
{
	static getRand(prob = 0.5) {
		return Math.random() > prob;
	}
	static getRange(size) {
		return [... this.getRangeX(size)];
	}
	static getRangeX(size) {
		return Array(size).keys();
	}
}

class GameElement {
	constructor(scene, maze) {
		this.set({"scene": scene, "maze": maze,})._prepare().refresh();
	}
	refresh() {
		return this._place(this.maze.getHallRandom());
	}
	_prepare() {
		return this;
	}
	_place(cell) {
		return this
			._setCell(this.cell, false)
			._setCell(this.cell = cell, true);
	}
	_move(y, x) {
		const cell = this.maze.getCell(y, x);

		if (!cell || cell.wall) return false;

		return cell && !cell.wall && this._place(cell);

		return true;
	}
	moveTo(y, x) {
		return this._move(y, x);
	}
	moveBy(y, x) {
		return this._move(this.cell.y + y, this.cell.x + x);
	}
	_setCell(cell, bool = true, attr = null, except = []) {
		if (attr && cell && except.every(key => !cell[key])) cell[attr] = bool;

		return this;
	}
}

class Gift extends GameElement
{
	_setCell(cell, bool = true, attr = "gift", except = ["wall", "player",]) {
		return super._setCell(cell, bool, attr, except);
	}
	refresh() {
		do {
			super.refresh();
		} while (this.cell?.equals(this.scene.player?.cell));

		return this;
	}
}

class Player extends GameElement
{
	_setCell(cell, bool = true, attr = "player", except = ["wall",]) {
		if (this.scene.gift?.cell?.equals(cell)) {
			this.scene.scores += this.scene.prize;
			this.scene.gift.refresh();
		} else if (this.scene.scores <= 0)
			this.scene.finish();
		else if (this.scene.scores > 0)
			-- this.scene.scores;

		return super._setCell(cell, bool, attr, except);
	}
}

class Scene
{
	constructor(el, sizeY, sizeX) {
		const square = sizeY * sizeX;

		this.set({
			"el": el
			, "sizeY": sizeY
			, "sizeX": sizeX
			, "scores": square
			, "prize": Math.floor(Math.sqrt(square))
			,
		})._prepare();
	}
	_getDocument(el = null) {
		return (el || this.el).ownerDocument;
	}
	_getWindow(el = null, where = ["parentWindow", "defaultView",]) {
		const doc = this._getDocument(el);

		return where.map(attr => doc[attr]).find(win => win);
	}
	_handleKeys(evt, keys = {
		"arrowup": [-1, 0,]
		, "arrowdown": [1, 0,]
		, "arrowleft": [0, -1,]
		, "arrowright": [0, 1,]
		,
	}) {
		const key = evt.key.toLowerCase();

		console.log(key);

		if (!(key in keys)) return;

		evt.preventDefault();

		this.player.moveBy(... keys[key]);
	}
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
	_prepareEvents() {
		this._getWindow()
			.addEventListener("keydown", evt => this._handleKeys(evt));

		return this;
	}
	_prepare() {
		return this._prepareDesk()._prepareEvents();
	}
	_redraw() {
		const cells = this.maze.getCells();

		this.nodes.forEach(node => node.dataset.set(cells.shift()));
		this._getDocument().querySelector(this.el.dataset.scores).textContent = this.scores;

		return this;
	}
	execute(data, intv = 100) {
		return this._int = this
			.set(data)
			._getWindow()
			.setInterval(() => this._redraw(), intv);
	}
	finish() {
		setTimeout(() => {
			this.done();

			this._getDocument().querySelector(this.el.dataset.finish).showModal();
		}, 100);
	}
	done() {
		this._getWindow().clearInterval(this._int);
	}
}

class Maze
{
	constructor(scene) {
		this.scene = scene;
		this._generate();
	}
	getData() {
		return this.data;
	}
	getHallRandom() {
		const hall = this.getHall();

		while (true)
			for (let i = 0; i < hall.length; i ++)
				if (Helper.getRand(0.998))
					return hall[i];
	}
	_generateData() {
		return Helper.getRange(this.scene.sizeY).map(
			y => Helper.getRange(this.scene.sizeX).map(
				x => ({
					"y": y
					, "x": x
					, "wall": Helper.getRand(0.5)
					, "player": false
					, "gift": false
				})
			)
		);
	}
	_generate() {
		this.data = this._generateData();

		const cells = this.data;
		const hall = this.getHall();
		const shift = this._getShift();
		const chunks = this.getHallChunks(hall, shift);
		const borders = this._getBorders(hall, shift, cells);

		return this._getRemoveWall(chunks);
	}
	getCell(y, x) {
		return this._getCell(this.getCells(), y, x);
	}
	getCells() {
		return this.getData().flat();
	}
	_getCell(cells, y, x) {
		return cells.flat().find(cell => (cell.y == y) && (cell.x == x));
	}
	getHall() {
		return this.getData().flat().filter(cell => !cell.wall);
	}
	_getShift(size = 3) {
		const _shift = size => [... Array(size).keys()].map(i => i - 1)

		return _shift(size)
			.map(y => _shift(size).map(x => [y, x,]))
			.flat().filter(cell => cell[0] != -cell[1]);
	}
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