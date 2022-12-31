const createCell = () => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    return cell;
};

const constructGridInternal = dimension => {
    const cellGridArea = dimension * dimension;
    const cells = Array.from({length: cellGridArea}, createCell);

    return cells;
};

const cellGrid = document.querySelector("main.cell-grid");
let paintOn = true;
cellGrid.addEventListener("click", event => {
    paintOn = !paintOn;
    if (paintOn) event.target.style.backgroundColor = "black";
});
const MAX_DIMENSION = 100;

function constructGrid (dimension) {
    // First, remove the existing cells
    [...document.querySelectorAll(".cell")].forEach(cell => cell.remove());

    // Keep the user-specified dimension at or below MAX_DIMENSION
    // (usually 100, as recommended in the project walkthough)
    dimension = Math.min(MAX_DIMENSION, dimension);

    const cells = constructGridInternal(dimension);
    cells.forEach(cell => {
	cellGrid.appendChild(cell);
	cell.addEventListener("mouseover", event => {
	    if (paintOn) event.target.style.backgroundColor = "black";
	});

	cell.addEventListener("touchstart", event => {
	    event.preventDefault();
	    console.log(event);
	});

	cell.addEventListener("touchmove", event => {
	    event.preventDefault();
	    const { clientX, clientY } = event.targetTouches[0];
	    console.log(findCellUnderTouchMove(clientX, clientY));
	});
    });

    // Adjust 'grid-template-columns' CSS property to match given dimension
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;

    // TOUCHSCREEN EVENTS

    // Discover the width and height of a cell in the current grid
    // Note that we need only find and analyze the first cell returned by 'document.querySelector'
    const { width: CELL_WIDTH, height: CELL_HEIGHT } = document.querySelector(".cell").getClientRects()[0];

    // Discover the height of the slider widget: it's our vertical offset for determining cell indices
    const CELL_VERTICAL_OFFSET = document.querySelector(".prompt-dimension").getClientRects()[0].height;

    function findCellUnderTouchMove (clientX, clientY) {
	const x = Math.floor(clientX / CELL_WIDTH);
	const y = Math.floor((clientY - CELL_VERTICAL_OFFSET) / CELL_HEIGHT);

	return cells[x + dimension * y];
    };
}

const sliderButtons = [...document.querySelectorAll(".set-dimension")];
const START_INDEX = 16;
let previousSliderButtonIndex = START_INDEX;
const initialButton = sliderButtons[START_INDEX];

function defineGrid (event) {
    const sliderButton = event.target;
    const index = parseInt(sliderButton.dataset.index) - 1;
    constructGrid(index);

    sliderButtons[previousSliderButtonIndex - 1].style.backgroundColor = "red";
    sliderButton.style.backgroundColor = "black";
    previousSliderButtonIndex = sliderButton.dataset.index;
}

sliderButtons.forEach(sliderButton => sliderButton.addEventListener("mouseover", defineGrid));

// Define a grid right away
initialButton.dispatchEvent(new Event("mouseover"));
