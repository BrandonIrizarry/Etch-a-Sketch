const createCell = () => {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    return cell;
};

const cells = Array.from({length: 16}, createCell);

const cellGrid = document.querySelector("main.cell-grid");

cells.forEach(cell => cellGrid.appendChild(cell));
