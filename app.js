const createCell = () => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    return cell;
};

const cellGridDimension = 4;
const cellGridArea = cellGridDimension * cellGridDimension;
const cells = Array.from({length: cellGridArea}, createCell);
const cellGrid = document.querySelector("main.cell-grid");

cells.forEach(cell => cellGrid.appendChild(cell));
