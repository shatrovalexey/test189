(({"document": doc}) => {
    /**
    * загрузка содержимого
    *
    * @listens DOMContentLoaded
    * @param {Event} event
    * @param {Document} event.target
    */
    doc.addEventListener("DOMContentLoaded", ({"target": el}) => {
        /**
        * @type {[HTMLElement, HTMLFormElement]}
        * @property {HTMLElement} mazeEl - DOM-элемент лабиринта
        * @property {HTMLFormElement} formEl - DOM-элемент формы управления игрой
        */
        const [mazeEl, formEl] = el.querySelectors(".maze", ".controls");

        /**
        * @type {Scene|null}
        */
        let scene;

        /**
        * @callback playGameCallback
        * @param {SubmitEvent|CustomEvent} evt
        * @returns {void}
        */
        const playGame = evt => {
            // if (evt?.preventDefault) evt.preventDefault();

            /**
            * @type {HTMLFormElement}
            */
            const {"target": formEl} = evt;

            /**
            * @type {FormData}
            */
            const formData = new FormData(formEl);

            // завершаем предыдущую игру, если она была
            scene?.done();
            scene = new Scene(
                mazeEl, 
                ...["height", "width"].map(attr => parseInt(formData.get(attr)))
            );

            /**
            * @type {Maze}
            */
            const maze = new Maze(scene);

            scene.set({
                "maze": maze,
                "player": new Player(scene, maze),
                "gift": new Gift(scene, maze),
            }).execute();
        };

        /**
        * @listens submit
        */
        formEl.addEventListener("submit", playGame);

        playGame({"target": formEl});
    });
})(window);