const grid = document.querySelector(".grid");
const TOTAL_CELLS = 400;

// Generate grid
for (let i = 1; i <= TOTAL_CELLS; i++) {
  const cell = document.createElement("div");
  cell.className = "cell free";
  cell.textContent = i;

  cell.addEventListener("click", () => claimCell(cell));
  grid.appendChild(cell);
}

// Claim logic
function claimCell(cell) {
  if (cell.classList.contains("owned")) return;

  cell.classList.remove("free");
  cell.classList.add("owned");
  cell.textContent = "Owned";
}

// Smooth scroll
function scrollToGrid() {
  document.getElementById("grid").scrollIntoView({
    behavior: "smooth"
  });
}
