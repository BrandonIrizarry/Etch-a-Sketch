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

function constructGrid () {
    let dimension = parseInt(prompt("Grid dimension:"));

    if (isNaN(dimension)) {
	dimension = 16;
    }

    const cells = constructGridInternal(dimension);
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;
    [...document.querySelectorAll(".cell")].map(cell => cell.remove());
    cells.forEach(cell => cellGrid.appendChild(cell));
}
