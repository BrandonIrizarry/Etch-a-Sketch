"use strict";

const makePainter = () => {
    // For lightening/darkening
    const SCALE_DELTA = 0.1;

    let penColor = "rgb(0, 0, 0)";
    let random = false;
    let backgroundColor = "rgb(255, 255, 255)";
    let customForegroundColor = "rgb(0, 0, 0)";
    let paintFn = usePen;

    function setRandom () {
	random = true;
    }

    function clearRandom () {
	random = false;
    }

    function paint(DOMelement) {
	paintFn(DOMelement);
    }

    // Default 'paint' function
    function usePen (DOMelement) {
	let randomColor = null;

	if (random) {
	    const randomColorValue = Math.floor(Math.random() * (2 ** 24 + 1)).toString(16);
	    randomColor = `#${randomColorValue}`;
	}

	DOMelement.style.backgroundColor = randomColor ?? penColor;
    }

    function makeLightnessAdjuster (darken=false) {
	// Return either a lightener or a darkener. This lets us
	// (potentially) use 'lighten' and 'darken' as functions directly in event
	// listeners without having to introduce an intermediate arrow
	// function to accomodate passing-in the 'darken' parameter.
	// They also read better this way.
	return DOMelement => {
	    let scaleDelta = SCALE_DELTA;

	    if (darken) {
		scaleDelta *= -1;
	    }

	    const currentColor = DOMelement.style.backgroundColor;

	    const rgbRegexp = /.+\((\d+), (\d+), (\d+).+/;
	    let [_, red, green, blue] = currentColor.match(rgbRegexp);

	    // A note on 'currentColor' being black: since
	    // multiplication is used to scale values upward, any
	    // lightening operation on all-zero values has to be
	    // bootstrapped with something small, but not too small
	    // that rounding should annihilate it
	    if (!darken && red == 0 && green == 0 && blue == 0) {
		red = 1 / scaleDelta;
		green = 1 / scaleDelta;
		blue = 1 / scaleDelta;
	    }

	    const newRed = Math.round(red * (1 + scaleDelta));
	    const newGreen = Math.round(green * (1 + scaleDelta));
	    const newBlue = Math.round(blue * (1 + scaleDelta));

	    const newColor = `rgb(${newRed}, ${newGreen}, ${newBlue})`;

	    DOMelement.style.backgroundColor = newColor;
	};
    }

    const lighten = makeLightnessAdjuster();
    const darken = makeLightnessAdjuster(true);

    function changePenColor (newColor = "rgb(0, 0, 0)") {
	penColor = newColor;
    }

    function changeBackgroundColor (newBackgroundColor = "rgb(255, 255, 255)") {
	backgroundColor = newBackgroundColor;
    }

    function useBackgroundColor () {
	penColor = backgroundColor;
    }

    function getBackgroundColor () {
	return backgroundColor;
    }

    function changeCustomForegroundColor (newForegroundColor = "rgb(0, 0, 0)") {
	customForegroundColor = newForegroundColor;
    }

    function useCustomForegroundColor () {
	penColor = customForegroundColor;
    }

    function getCustomForegroundColor () {
	return customForegroundColor;
    }

    function setPainter (newPaintFn) {
	paintFn = newPaintFn;
    }

    return {
	lighten,
	darken,
	usePen,
	setPainter,
	setRandom,
	clearRandom,
	paint,
	changePenColor,
	changeBackgroundColor,
	useBackgroundColor,
	getBackgroundColor,
	changeCustomForegroundColor,
	useCustomForegroundColor,
	getCustomForegroundColor,
    };
};

const painter = makePainter();

const cellGrid = document.querySelector(".cell-grid");

const constructGridInternal = dimension => {
    const cells = Array.from({length: dimension * dimension}, () => {

	// Construct a new cell as the current array element
	const cell = document.createElement("div");
	cell.classList.add("cell");
	cell.style.backgroundColor = painter.getBackgroundColor();

	return cell;
    });

    return cells;
};

// Store current grid information in a global object,
// so that image-exporting code can use it later
const makeGridInfo = () => {
    let CELL_WIDTH = null;
    let CELL_HEIGHT = null;
    let DIMENSION = null;
    let CELL_VERTICAL_OFFSET = null;

    // Discover the total height of all widgets above the grid: this
    // height is the vertical offset for determining cell indices
    function recomputeCellVerticalOffset () {
	CELL_VERTICAL_OFFSET = [...document.querySelectorAll(".y-offset")].reduce((totalHeight, element) => {
	    totalHeight += element.getClientRects()[0].height;
	    return totalHeight;
	}, 0);
    };

    function resetDimensions (cell_width, cell_height, dimension) {
	CELL_WIDTH = cell_width;
	CELL_HEIGHT = cell_height;
	DIMENSION = dimension;
    }

    function getData () {
	return {
	    CELL_WIDTH,
	    CELL_HEIGHT,
	    DIMENSION,
	    CELL_VERTICAL_OFFSET
	};
    }

    function fetchColors () {
	const cells = [...document.querySelectorAll(".cell")];

	// If a square hasn't been painted, the background color
	// attribute is the empty string: fall back to white explicitly.
	return cells.map(cell => cell.style.backgroundColor || "rgb(255, 255, 255)");
    }

    // Initialize
    recomputeCellVerticalOffset();

    return {
	recomputeCellVerticalOffset,
	resetDimensions,
	getData,
	fetchColors,
    };
};

const gridInfo = makeGridInfo();

function constructGrid (dimension) {
    // Quick fix to avoid consecutive firing of this function based on
    // user-events
    if (dimension === gridInfo.DIMENSION) return;

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
	    if (cell !== null) painter.paint(cell);
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
    gridInfo.resetDimensions(CELL_WIDTH, CELL_HEIGHT, dimension);

    function findCellUnderMove (clientX, clientY) {
	const x = Math.floor(clientX / CELL_WIDTH);
	const y = Math.floor((clientY - gridInfo.getData().CELL_VERTICAL_OFFSET) / CELL_HEIGHT);

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
    sliderButton.style.backgroundColor = "rgb(0, 0, 0)";
    previousSliderButtonIndex = sliderButton.dataset.index;

    if (activate) {
	const index = parseInt(sliderButton.dataset.index) - 1;
	constructGrid(index);
    }
}

sliderButtons.forEach(sliderButton => {
    // Mouse
    sliderButton.addEventListener("click", event => {
	doSliderButton(event.target, true);
    });

    sliderButton.addEventListener("mousedown", event => {
	event.preventDefault();

	// only works with left mouse-click (button 0)
	if (event.button === 0) {
	    const fn = event => sliderIsMoving(event.clientX);
	    window.addEventListener("mousemove", fn);

	    window.addEventListener("mouseup", () => {
		window.removeEventListener("mousemove", fn);
		doSliderButton(sliderButtons[previousSliderButtonIndex - 1], true);
	    }, { once: true });
	}
    });

    // Touch
    sliderButton.addEventListener("touchstart", event => {
	event.preventDefault();

	// Mimic mouse-click behavior
	doSliderButton(event.target, true);

	// only works with left mouse-click (button 0)
	const fn = event => sliderIsMoving(event.targetTouches[0].clientX);
	window.addEventListener("touchmove", fn);

	window.addEventListener("touchend", () => {
	    window.removeEventListener("touchmove", fn);
	    doSliderButton(sliderButtons[previousSliderButtonIndex - 1], true);
	}, { once: true });
    });

    function sliderIsMoving (clientX) {
	const lastButton = findSliderButtonUnderMove(clientX);
	doSliderButton(lastButton);
    }
});

function findSliderButtonUnderMove (clientX) {
    const SLIDER_BUTTON_WIDTH = initialButton.getClientRects()[0].width;
    const x = Math.floor(clientX / SLIDER_BUTTON_WIDTH);

    return sliderButtons[x];
};

// DETECT SCREEN ORIENTATION CHANGE
// https://dev.to/smpnjn/how-to-detect-device-orientation-with-javascript-29e5
// This is necessary because changes in screen orientation affect the
// cell dimensions, which ruins the element detection mechanism. So
// the cleanest way out is to simply reset the grid when a change in
// screen orientation takes place.
window.matchMedia("(orientation: portrait)").addEventListener("change", () => {
    resetGrid();
    gridInfo.recomputeCellVerticalOffset();
});

// CONTROL PANEL

const radioColorCustom = document.querySelector("#pen-color-custom");
const radioWhite = document.querySelector("#pen-color-white");

const labelWhite = document.querySelector(`label[for="pen-color-white"]`);
const labelColorCustom = document.querySelector(`label[for="pen-color-custom"]`);
const labelLuckyPicker = document.querySelector(`label[for="pen-color-fixed-random"]`);
const labelPsychedelic = document.querySelector(`label[for="pen-color-psychedelic"]`);

// Lightener/darkener
const labelLightenerDarkener = document.querySelector(`label[for="pen-color-lighten-darken"]`);
const radioLightenerDarkener = document.querySelector("#pen-color-lighten-darken");
const checkboxLightenerDarkener = document.querySelector(".switch > input");

// Catch all labels here, in case
const allLabels = document.querySelectorAll("label");
allLabels.forEach(label => label.addEventListener("click", resetLabelSettings));

function resetLabelSettings () {
    // reset psychedelic painting
    painter.clearRandom();

    // reset label backgrounds
    const initialLabelBackgroundColor = getComputedStyle(document.documentElement)
	  .getPropertyValue("--default-label-bg-color");

    // reset painter function to 'usePen'
    painter.setPainter(painter.usePen);

    allLabels.forEach(label => {
	label.style.background = ""; // for when "psychedelic" had been selected
	label.style.backgroundColor = initialLabelBackgroundColor;
    });

    // Make sure bg-color button keeps the same color representing the
    // current background color; ditto for the custom foreground color
    labelWhite.style.backgroundColor = painter.getBackgroundColor();
    labelColorCustom.style.backgroundColor = painter.getCustomForegroundColor();
}

labelWhite.addEventListener("click", painter.useBackgroundColor);
labelColorCustom.addEventListener("click", painter.useCustomForegroundColor);

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

// Lightener/darkener
labelLightenerDarkener.addEventListener("click", () => {
    if (checkboxLightenerDarkener.checked) {
	painter.setPainter(painter.darken);
    } else {
	painter.setPainter(painter.lighten);
    }
});

// RESETTING THE GRID

function resetGrid () {
    clearAll();
    doSliderButton(initialButton, true);
}

// AUXILIARY BUTTONS (CLEAR ALL, EXPORT, BACKGROUND COLOR, SETTING A CUSTOM FOREGROUND COLOR)
const clearAllButton = document.querySelector("#clear-all");
const exportButton = document.querySelector("#export");
const backgroundColorPicker = document.querySelector(".color-picker#background");
const foregroundColorPicker = document.querySelector(".color-picker#foreground");

foregroundColorPicker.addEventListener("change", () => {
    painter.changeCustomForegroundColor(foregroundColorPicker.value);
    labelColorCustom.style.backgroundColor = painter.getCustomForegroundColor();

    if (radioColorCustom.checked) painter.useCustomForegroundColor();
});

function clearAll () {
    document.querySelectorAll(".cell").forEach(cell => {
	cell.style.backgroundColor = painter.getBackgroundColor();
  });
}

clearAllButton.addEventListener("click", clearAll);

backgroundColorPicker.addEventListener("change", () => {
    // Leverage the DOM API to convert color-picker's value to rgb, to
    // facilitate equality check later
    // https://stackoverflow.com/a/68626811
    const tempElement = document.createElement("div");
    tempElement.style.cssText = `color: ${backgroundColorPicker.value}`;
    const newBgColor = tempElement.style.color;

    const oldBackgroundColor = painter.getBackgroundColor();

    labelWhite.style.backgroundColor = newBgColor;
    painter.changeBackgroundColor(newBgColor);

    // If the "use bg-color" radio button is checked, make sure
    // we start painting with our newly selected color
    if (radioWhite.checked) painter.useBackgroundColor();

    // Change existing background-color cells to new background color
    document.querySelectorAll(".cell").forEach(cell => {
	const cellBgColor = cell.style.backgroundColor;

	if (cellBgColor === oldBackgroundColor || cellBgColor === "") {
	    cell.style.backgroundColor = painter.getBackgroundColor();
	}
    });
});

// EXPORTING TO AN IMAGE FILE

// Define 'partition' and 'repeat', which are used to construct the
// correctly dilated image piecemeal.

// Partition: Split an array into even chunks.
// https://stackabuse.com/how-to-split-an-array-into-even-chunks-in-javascript/
function partition (arr, chunkSize) {
    const res = [];

    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }

    return res;
}

// Repeat: Repeat the contents of an array within itself
// e.g. repeat([1, 2, 3], 3) => [1, 1, 1, 2, 2, 2, 3, 3, 3]
function repeat (arr, times) {
    let result = [];

    for (let i = 0; i < times; i++) {
	result = result.concat(arr);
    }

    return result;
}

function exportCellColors () {
    let { CELL_WIDTH, CELL_HEIGHT, DIMENSION } = gridInfo.getData();
    CELL_WIDTH = Math.floor(CELL_WIDTH);
    CELL_HEIGHT = Math.floor(CELL_HEIGHT);

    const colors = gridInfo.fetchColors()
	  .map(color => {
	      const regexp = /.+\((\d+), (\d+), (\d+).+/;
	      const [_, red, green, blue] = color.match(regexp);
	      return `${red} ${green} ${blue}`;
	  });

    /*
     * Dilate the current cell grid in a series of steps, using the
     * primitive "operators", 'partition' and 'repeat', defined above.
     * I used temporary storage ('first', 'second' ...)
     * generously when I devised the solution, and that approach is retained here.
     */
    const first = partition(colors, 1);
    const second = first.map(p => repeat(p, CELL_WIDTH));
    const third = partition(second, DIMENSION);
    const fourth = third.map(p => repeat(p, CELL_HEIGHT));
    const fifth = fourth.flat().flat();

    return fifth;
}

exportButton.addEventListener("click", () => {
    const triplets = exportCellColors();
    const { DIMENSION: dimension, CELL_WIDTH: width, CELL_HEIGHT: height } = gridInfo.getData();

    const content = ["P3", `${dimension * Math.floor(width)} ${dimension * Math.floor(height)}`, "255", ...triplets]
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
document.querySelector("#pen-color-custom").checked = true;
