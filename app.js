"use strict";

const makePainter = () => {
    let paintOn = false;
    let penColor = "black";
    let random = false;

    return {
	// I suspect the 'forcePaint' flag is mainly useful for
	// testing, when I switch from desktop view to responsive view
	// in the same development session, and 'paintOn' remains
	// cleared from when I was in desktop view, which is of course
	// undesirable
	setRandom () {
	    random = true;
	},

	clearRandom () {
	    random = false;
	},

	paint (DOMelement = document.body, forcePaint = false) {
	    let randomColor = null;

	    if (random) {
		const randomColorValue = Math.floor(Math.random() * (2 ** 24 + 1)).toString(16);
		randomColor = `#${randomColorValue}`;
	    }

	    if (paintOn || forcePaint) DOMelement.style.backgroundColor = randomColor ?? penColor;
	},

	togglePainting () {
	    paintOn = !paintOn;
	},

	adaptCursor (DOMelement = document.body) {
	    if (paintOn) {
		DOMelement.style.cursor = "crosshair";
	    } else {
		DOMelement.style.cursor = "auto";
	    }
	},

	changePenColor (newColor = "black") {
	    penColor = newColor;
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

	    // paint only if within the Etch-a-Sketch board
	    if (cell !== null) painter.paint(cell, true);
	});
    });

    // Adjust 'grid-template-columns' CSS property to match given dimension
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;

    // TOUCHSCREEN EVENTS

    // Discover the width and height of a cell in the current grid
    // Note that we need only find and analyze the first cell returned by 'document.querySelector'
    const { width: CELL_WIDTH, height: CELL_HEIGHT } = document.querySelector(".cell").getClientRects()[0];

    // Discover the total height of all widgets above the grid: this
    // height is the vertical offset for determining cell indices
    // const CELL_VERTICAL_OFFSET = document.querySelector(".slider").getClientRects()[0].height;

    const CELL_VERTICAL_OFFSET = [...document.querySelectorAll(".y-offset")].reduce((totalHeight, element) => {
	totalHeight += element.getClientRects()[0].height;
	return totalHeight;
    }, 0);

    function findCellUnderTouchMove (clientX, clientY) {
	const x = Math.floor(clientX / CELL_WIDTH);
	const y = Math.floor((clientY - CELL_VERTICAL_OFFSET) / CELL_HEIGHT);

	// a value of 'null' indicates that painting is occurring
	// out of range of the Etch-a-Sketch board
	if (x >= dimension || y >= dimension || x < 0 || y < 0) return null;

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

// DETECT SCREEN ORIENTATION CHANGE
// https://dev.to/smpnjn/how-to-detect-device-orientation-with-javascript-29e5
// This is necessary because changes in screen orientation affect the
// cell dimensions, which ruins the element detection mechanism. So
// the cleanest way out is to simply reset the grid when a change in
// screen orientation takes place.
window.matchMedia("(orientation: portrait)").addEventListener("change", resetGrid);

// CONTROL PANEL

const radioButtons = [...document.querySelectorAll(`input[type="radio"]`)];
const radioLabels = [...document.querySelectorAll(".control-panel > label")];

const colorPicker = document.querySelector("#color-picker");
const radioColorCustom = document.querySelector("#pen-color-custom");

const labelBlack = document.querySelector(`label[for="pen-color-black"]`);
const labelWhite = document.querySelector(`label[for="pen-color-white"]`);
const labelColorCustom = document.querySelector(`label[for="pen-color-custom"]`);
const labelLuckyPicker = document.querySelector(`label[for="pen-color-fixed-random"]`);
const labelPsychedelic = document.querySelector(`label[for="pen-color-psychedelic"]`);

// Catch all labels here, in case
const allLabels = document.querySelectorAll("label");
allLabels.forEach(label => label.addEventListener("click", resetLabelSettings));

function resetLabelSettings () {
    // reset psychedelic painting
    painter.clearRandom();

    // reset background
    const initialLabelBackgroundColor = getComputedStyle(labelBlack).backgroundColor;

    allLabels.forEach(label => {
	label.style.backgroundColor = initialLabelBackgroundColor;
    });
}

labelBlack.addEventListener("click", () => painter.changePenColor("black"));
labelWhite.addEventListener("click", () => painter.changePenColor("white"));

labelLuckyPicker.addEventListener("click", () => {
    // https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-11.php
    const randomColorValue = Math.floor(Math.random() * (2 ** 24 + 1)).toString(16);
    const randomColor = `#${randomColorValue}`;
    painter.changePenColor(randomColor);

    labelLuckyPicker.style.backgroundColor = randomColor;
});

labelPsychedelic.addEventListener("click", painter.setRandom);

// COLOR PICKER

colorPicker.addEventListener("click", () => {
    radioColorCustom.checked = true;
});

colorPicker.addEventListener("change", () => {
    labelColorCustom.style.backgroundColor = colorPicker.value;
    painter.changePenColor(colorPicker.value);
});

// RESETTING THE GRID

function resetGrid () {
    initialButton.dispatchEvent(new Event(MAGIC_EVENT));
}

// MAIN (IMMEDIATE ACTIONS)

// Define a grid right away
resetGrid();

// Check 'black' in the Control Panel
document.querySelector("#pen-color-black").checked = true;
