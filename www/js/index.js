(({"document": doc,}) => doc.addEventListener("DOMContentLoaded", ({"target": el,}) => {
	const mazeEl = el.querySelector(".maze");
	const formEl = el.querySelector(".controls");
	let scene;

	const playGame = evt => {
		const {"target": formEl,} = evt;
		const formData = new FormData(formEl);

		/**
		if (evt?.preventDefault) {
			evt.preventDefault();
		}
		*/

		scene?.done();
		scene = new Scene(mazeEl, ... ["height", "width",].map(attr => parseInt(formData.get(attr))));

		const maze = new Maze(scene);

		scene.set({
			"maze": maze
			, "player": new Player(scene, maze)
			, "gift": new Gift(scene, maze)
			,
		}).execute();
	};

	formEl.addEventListener("submit", playGame);
	// playGame({"target": formEl,});
}))(window);