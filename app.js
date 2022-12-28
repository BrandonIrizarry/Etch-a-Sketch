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

const gridDimensionButton = document.querySelector("button.prompt-dimension");
gridDimensionButton.addEventListener("click", constructGrid);

const cellGrid = document.querySelector("main.cell-grid");
const MAX_DIMENSION = 100;

function constructGrid () {
    let dimension = parseInt(prompt("Grid dimension:"));

    if (isNaN(dimension)) {
	dimension = 16;
    }

    // Keep the user-specified dimension at or below MAX_DIMENSION
    // (usually 100, as recommended in the project walkthough)
    dimension = Math.min(MAX_DIMENSION, dimension);

    const cells = constructGridInternal(dimension);
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;
    [...document.querySelectorAll(".cell")].map(cell => cell.remove());
    cells.forEach(cell => cellGrid.appendChild(cell));
}
