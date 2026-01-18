Node.prototype.removeChildrenByCSSSelector = function(cssSelector) {
	this.querySelectorAll(cssSelector).forEach(subNode => subNode.remove());
};
Node.prototype.removeChildrenCloned = function() {
	this.removeChildrenByCSSSelector("& > .clone");
};
Node.prototype.removeChildrenClean = function() {
	this.removeChildrenByCSSSelector("& > :not(template)");
};
Object.prototype.set = function(data) {
	return Object.assign(this, data);
};
Object.prototype.equals = function(obj, cmp = null) {
	return obj && Object.entries(cmp || obj).every(([key, value,]) => value === this[key]);
};
Array.prototype.shuffle = function() {
	return this.sort(() => Helper.getRand());
};
Array.prototype.sample = function(size = 1, wantarray = false) {
	if (size < 1) return null;

	wantarray = size == 1;

	const values = this.shuffle();

	return wantarray ? values.shift() : values.splice(0, size);
};