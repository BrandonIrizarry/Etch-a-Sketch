const createCell = () => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    return cell;
};

const cellGridDimension = 16;
const cellGridArea = cellGridDimension * cellGridDimension;
const cells = Array.from({length: cellGridArea}, createCell);
const cellGrid = document.querySelector("main.cell-grid");
cellGrid.style.gridTemplateColumns = `repeat(${cellGridDimension}, 1fr`;
cells.forEach(cell => cellGrid.appendChild(cell));

const gridDimensionButton = document.querySelector("button.prompt-dimension");

gridDimensionButton.addEventListener("click", setGridDimensions);

function setGridDimensions () {

}
