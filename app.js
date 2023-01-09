"use strict";

const makePainter = () => {
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

	paint (DOMelement = document.body) {
	    let randomColor = null;

	    if (random) {
		const randomColorValue = Math.floor(Math.random() * (2 ** 24 + 1)).toString(16);
		randomColor = `#${randomColorValue}`;
	    }

	    DOMelement.style.backgroundColor = randomColor ?? penColor;
	},

	changePenColor (newColor = "black") {
	    penColor = newColor;
	}
    };
};

const painter = makePainter();

const cellGrid = document.querySelector(".cell-grid");

const constructGridInternal = dimension => {
    const cells = Array.from({length: dimension * dimension}, () => {

	// Construct a new cell as the current array element
	const cell = document.createElement("div");
	cell.classList.add("cell");
	return cell;
    });

    return cells;
};

// Store current grid information in a global object,
// so that image-exporting code can use it later
let gridInfo = {
    CELL_WIDTH: null,
    CELL_HEIGHT: null,
    DIMENSION: null,
};

function constructGrid (dimension) {
    const MAX_DIMENSION = 100;

    // First, remove the existing cells
    document.querySelectorAll(".cell").forEach(cell => cell.remove());

    // Keep the user-specified dimension at or below MAX_DIMENSION
    // (usually 100, as recommended in the project walkthough)
    dimension = Math.min(MAX_DIMENSION, dimension);

    const cells = constructGridInternal(dimension);

    function mouseIsPainting (event) {
	if (event.buttons === 0) {
	    window.removeEventListener("mousemove", mouseIsPainting);
	} else {
	    const cell = findCellUnderMove(event.clientX, event.clientY);
	    painter.paint(cell);
	}
    }

    cells.forEach(cell => {
	cellGrid.appendChild(cell);

	cell.addEventListener("click", event => {
	    event.preventDefault();
	    painter.paint(event.target);
	});

	cell.addEventListener("mousedown", event => {
	    event.preventDefault();

	    // only works with left mouse-click (button 0)
	    if (event.button === 0) {
		window.addEventListener("mousemove", mouseIsPainting);
	    }
	});

	cell.addEventListener("touchstart", event => {
	    event.preventDefault();

	    // Using painter, even swiping falls under the influence of 'paintOn',
	    // so we must set the 'forcePaint' flag here
	    painter.paint(event.target);
	});

	// On mobile devices, swipe to paint (see "TOUCHSCREEN EVENTS" below)
	cell.addEventListener("touchmove", event => {
	    event.preventDefault();
	    const { clientX, clientY } = event.targetTouches[0];
	    const cell = findCellUnderMove(clientX, clientY);

	    // paint only if within the Etch-a-Sketch board
	    if (cell !== null) painter.paint(cell);
	});
    });

    // Adjust 'grid-template-columns' CSS property to match given dimension
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;

    // TOUCHSCREEN EVENTS

    // Discover the width and height of a cell in the current grid
    // Note that we need only find and analyze the first cell returned by 'document.querySelector'
    const { width: CELL_WIDTH, height: CELL_HEIGHT } = document.querySelector(".cell").getClientRects()[0];
    gridInfo = {...gridInfo, CELL_WIDTH, CELL_HEIGHT, DIMENSION: dimension};
    console.log(gridInfo, event);

    // Discover the total height of all widgets above the grid: this
    // height is the vertical offset for determining cell indices
    const CELL_VERTICAL_OFFSET = [...document.querySelectorAll(".y-offset")].reduce((totalHeight, element) => {
	totalHeight += element.getClientRects()[0].height;
	return totalHeight;
    }, 0);

    function findCellUnderMove (clientX, clientY) {
	const x = Math.floor(clientX / CELL_WIDTH);
	const y = Math.floor((clientY - CELL_VERTICAL_OFFSET) / CELL_HEIGHT);

	// a value of 'null' indicates that painting is occurring
	// out of range of the Etch-a-Sketch board
	if (x >= dimension || y >= dimension || x < 0 || y < 0) return null;

	return cells[x + dimension * y];
    };
}

// SLIDER BUTTONS

const sliderButtons = [...document.querySelectorAll(".set-dimension")];
const START_INDEX = 16;
let previousSliderButtonIndex = START_INDEX;
const initialButton = sliderButtons[START_INDEX];

function doSliderButton (sliderButton, activate=false) {
    sliderButtons[previousSliderButtonIndex - 1].style.backgroundColor = "red";
    sliderButton.style.backgroundColor = "black";
    previousSliderButtonIndex = sliderButton.dataset.index;

    if (activate) {
	const index = parseInt(sliderButton.dataset.index) - 1;
	constructGrid(index);
    }
}

sliderButtons.forEach(sliderButton => {
    // Mouse
    sliderButton.addEventListener("click", event => {
	doSliderButton(event.target);
    });

    sliderButton.addEventListener("mousedown", event => {
	event.preventDefault();

	// only works with left mouse-click (button 0)
	if (event.button === 0) {
	    window.addEventListener("mousemove", sliderIsMoving);
	}
    });

    function sliderIsMoving (event) {
	const lastButton = findSliderButtonUnderMove(event.clientX);

	if (event.buttons === 0) {
	    window.removeEventListener("mousemove", sliderIsMoving);
	    doSliderButton(lastButton, true);
	} else {
	    doSliderButton(lastButton);
	}
    }

    // Touch
    sliderButton.addEventListener("touchstart", defineGridTouch);
    sliderButton.addEventListener("touchmove", defineGridTouch);
});

function findSliderButtonUnderMove (clientX) {
    const SLIDER_BUTTON_WIDTH = initialButton.getClientRects()[0].width;
    const x = Math.floor(clientX / SLIDER_BUTTON_WIDTH);

    return sliderButtons[x];
};

// Helper function to eliminate repeated code when handling touchstart
// and touchmove
function defineGridTouch (event) {
    event.preventDefault();
    const clientX = event.targetTouches[0].clientX;
    const sliderButton = findSliderButtonUnderMove(clientX);
    doSliderButton(sliderButton, true);
}

// DETECT SCREEN ORIENTATION CHANGE
// https://dev.to/smpnjn/how-to-detect-device-orientation-with-javascript-29e5
// This is necessary because changes in screen orientation affect the
// cell dimensions, which ruins the element detection mechanism. So
// the cleanest way out is to simply reset the grid when a change in
// screen orientation takes place.
window.matchMedia("(orientation: portrait)").addEventListener("change", resetGrid);

// CONTROL PANEL

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
	label.style.background = ""; // for when "psychedelic" had been selected
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

labelPsychedelic.addEventListener("click", () => {
    painter.setRandom();

    // use any colorful linear gradient; the particular values are of
    // no significance
    // see 'https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/linear-gradient#description'
    labelPsychedelic.style.background = "linear-gradient(135deg, red 0%, orange 25%, yellow 50%, green 75%, blue 100%)";
});

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
    doSliderButton(initialButton, true);
}

// AUXILIARY BUTTONS (CLEAR ALL, EXPORT)
const clearAllButton = document.querySelector("#clear-all");
const exportButton = document.querySelector("#export");

clearAllButton.addEventListener("click", () => {
    document.querySelectorAll(".cell").forEach(cell => {
	cell.style.backgroundColor = "white";
    });
});

exportButton.addEventListener("click", () => {
    const triplets = [
	"255 0 0", "0 255 0", "255 255 0",
	"255 255 0", "255 255 255", "0 0 0",
    ];

    const content = ["P3", "3 2", "255", ...triplets]
	  .map(chunk => chunk.concat("\n"));

    // Create blob object with file content
    const blob = new Blob(content,
	{ type: "text/plain;charset=utf-8" }
    );

    // Create and save the file using the FileWriter library
    saveAs(blob, "image_file.ppm");
});


// MAIN (IMMEDIATE ACTIONS)

// Define a grid right away
resetGrid();

// Check 'black' in the Control Panel
document.querySelector("#pen-color-black").checked = true;
