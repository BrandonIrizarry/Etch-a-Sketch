const createCell = () => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    return cell;
};

const constructGridInternal = dimension => {
    const cellGridArea = dimension * dimension;
    const cells = Array.from({length: cellGridArea}, createCell);
    const cellGrid = document.querySelector("main.cell-grid");
    cellGrid.style.gridTemplateColumns = `repeat(${dimension}, 1fr`;
    cells.forEach(cell => cellGrid.appendChild(cell));
};

constructGridInternal(16);

const gridDimensionButton = document.querySelector("button.prompt-dimension");
gridDimensionButton.addEventListener("click", constructGrid);

function constructGrid () {

}
