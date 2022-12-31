const makePainter = () => {
    let paintOn = false;

    return {
	// I suspect the 'forcePaint' flag is mainly useful for
	// testing, when I switch from desktop view to responsive view
	// in the same development session, and 'paintOn' remains
	// cleared from when I was in desktop view, which is of course
	// undesirable
	paint (DOMelement, forcePaint = false) {
	    if (paintOn || forcePaint) DOMelement.style.backgroundColor = "black";
	},

	togglePainting () {
	    paintOn = !paintOn;
	},

	adaptCursor (DOMelement) {
	    if (paintOn) {
		DOMelement.style.cursor = "crosshair";
	    } else {
		DOMelement.style.cursor = "auto";
	    }
	}
    };
};

const painter = makePainter();

const cellGrid = document.querySelector(".cell-grid");

cellGrid.addEventListener("click", event => {
    painter.togglePainting();
    painter.paint(event.target);
    painter.adaptCursor(event.target);
});

const constructGridInternal = dimension => {
    const cells = Array.from({length: dimension * dimension}, () => {

	// Construct a new cell as the current array element
	const cell = document.createElement("div");
	cell.classList.add("cell");
	return cell;
    });

    return cells;
};

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
	    painter.paint(event.target);
	});

	cell.addEventListener("touchstart", event => {
	    event.preventDefault();

	    // Using painter, even swiping falls under the influence of 'paintOn',
	    // so we must set the 'forcePaint' flag here
	    painter.paint(event.target, true);
	});

	// On mobile devices, swipe to paint (see "TOUCHSCREEN EVENTS" below)
	cell.addEventListener("touchmove", event => {
	    event.preventDefault();
	    const { clientX, clientY } = event.targetTouches[0];
	    const cell = findCellUnderTouchMove(clientX, clientY);

	    painter.paint(cell, true);
	});
    });

    // Adjust 'grid-template-columns' CSS property to match given dimension
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;

    // TOUCHSCREEN EVENTS

    // Discover the width and height of a cell in the current grid
    // Note that we need only find and analyze the first cell returned by 'document.querySelector'
    const { width: CELL_WIDTH, height: CELL_HEIGHT } = document.querySelector(".cell").getClientRects()[0];

    // Discover the height of the slider widget: it's our vertical offset for determining cell indices
    const CELL_VERTICAL_OFFSET = document.querySelector(".slider").getClientRects()[0].height;

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

const MAGIC_EVENT = "mouseover";

sliderButtons.forEach(sliderButton => {
    sliderButton.addEventListener(MAGIC_EVENT, event => defineGrid(event.target));
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
initialButton.dispatchEvent(new Event(MAGIC_EVENT));
