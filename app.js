const constructGridInternal = dimension => {
    const cells = Array.from({length: dimension * dimension}, () => {

	// Construct a new cell as the current array element
	const cell = document.createElement("div");
	cell.classList.add("cell");
	return cell;
    });

    return cells;
};

const cellGrid = document.querySelector("main.cell-grid");

// Discover the height of the slider widget: it's our vertical offset for determining cell indices
// This constant is needed for both cells and the slider, so make it globally accessible
const CELL_VERTICAL_OFFSET = document.querySelector(".prompt-dimension").getClientRects()[0].height;

let paintOn = false;

cellGrid.addEventListener("click", event => {
    paintOn = !paintOn;

    if (paintOn) event.target.style.backgroundColor = "black";
    if (paintOn) {
	cellGrid.style.cursor = "crosshair";
    } else {
	cellGrid.style.cursor = "auto";
    }
});

function constructGrid (dimension) {
    const MAX_DIMENSION = 100;

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

	// On mobile devices, swipe to paint (see "TOUCHSCREEN EVENTS" below)
	cell.addEventListener("touchmove", event => {
	    event.preventDefault();
	    const { clientX, clientY } = event.targetTouches[0];
	    findCellUnderTouchMove(clientX, clientY).style.backgroundColor = "black";
	});
    });

    // Adjust 'grid-template-columns' CSS property to match given dimension
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;

    // TOUCHSCREEN EVENTS

    // Discover the width and height of a cell in the current grid
    // Note that we need only find and analyze the first cell returned by 'document.querySelector'
    const { width: CELL_WIDTH, height: CELL_HEIGHT } = document.querySelector(".cell").getClientRects()[0];

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

function defineGrid (sliderButton) {
    const index = parseInt(sliderButton.dataset.index) - 1;
    constructGrid(index);

    sliderButtons[previousSliderButtonIndex - 1].style.backgroundColor = "red";
    sliderButton.style.backgroundColor = "black";
    previousSliderButtonIndex = sliderButton.dataset.index;
}

sliderButtons.forEach(sliderButton => {
    sliderButton.addEventListener("mouseover", event => defineGrid(event.target));
    sliderButton.addEventListener("touchstart", defineGridTouch);
    sliderButton.addEventListener("touchmove", defineGridTouch);
});

const SLIDER_BUTTON_WIDTH = initialButton.getClientRects()[0].width;

function findSliderButtonUnderTouchMove (clientX) {
    const x = Math.floor(clientX / SLIDER_BUTTON_WIDTH);

    return sliderButtons[x];
};

// Helper function to eliminate repeated code when handling touchstart
// and touchmove
function defineGridTouch (event) {
    event.preventDefault();
    const clientX = event.targetTouches[0].clientX;
    const sliderButton = findSliderButtonUnderTouchMove(clientX);
    defineGrid(sliderButton);
}

// Define a grid right away
initialButton.dispatchEvent(new Event("mouseover"));
