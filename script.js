let currentGame = 1;
let drawnNumbers = [];
let maxGames = 10;
let tvWindow = null;

function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  if (username === "admin" && password === "password") {
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("game-page").classList.remove("hidden");
    initializeBoard();
	fetchCurrentGame();
  } else {
    document.getElementById("login-error").classList.remove("hidden");
  }
}

function formatNumber(num) {
  if (num <= 15) return `B${num}`;
  if (num <= 30) return `I${num}`;
  if (num <= 45) return `N${num}`;
  if (num <= 60) return `G${num}`;
  return `O${num}`;
}

function drawNumber() {
  if (drawnNumbers.length >= 75) return;

  let num;
  do {
    num = Math.floor(Math.random() * 75) + 1;
  } while (drawnNumbers.includes(num));

  drawnNumbers.push(num);

  // ✅ Sync to backend
  fetch("https://bingo-backend-v0gd.onrender.com/api/draws", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number: Number(num) })
  }).catch(err => console.error("Draw sync error:", err));

  const displayNum = formatNumber(num);
  document.getElementById("current-number").textContent = displayNum;
  document.getElementById("draw-count").textContent = `${drawnNumbers.length} / 75`;
  localStorage.setItem("bingoDrawnNumbers", JSON.stringify(drawnNumbers));

  updateBoard(num);
  broadcastToTV(num);

  if (drawnNumbers.length >= 75) {
    const drawBtn = document.querySelector("button[onclick='drawNumber()']");
    drawBtn.disabled = true;
    drawBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

function broadcastToTV(num) {
  if (tvWindow && !tvWindow.closed) {
    tvWindow.postMessage({
      type: "BINGO_DRAW",
      value: formatNumber(num),
      count: drawnNumbers.length
    }, "*");
  }
}

function clearTV() {
  if (tvWindow && !tvWindow.closed) {
    tvWindow.postMessage({ type: "BINGO_DRAW", value: "", count: 0 }, "*");
  }
}

function fetchCurrentGame() {
  fetch("https://bingo-backend-v0gd.onrender.com/api/game")
	.then(res => res.json())
	.then(data => {
	currentGame = data.currentGame;
	document.getElementById("game-counter").textContent = `Game ${currentGame} of 10`;
  })
  .catch(err => console.error("Failed to fetch current game:", err));
}

function resetToGameOne() {
  currentGame = 1;
  syncGameToBackend(currentGame);
  resetGame();
  document.getElementById("game-counter").textContent = `Game 1 of 10`;
}


function initializeBoard() {
  const board = document.getElementById("bingo-board");
  board.innerHTML = "";

  const columns = [
    { start: 1, end: 15 },
    { start: 16, end: 30 },
    { start: 31, end: 45 },
    { start: 46, end: 60 },
    { start: 61, end: 75 }
  ];

  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 5; col++) {
      const num = columns[col].start + row;
      const cell = document.createElement("div");
      cell.id = `cell-${num}`;
      cell.textContent = num;
      cell.className = "p-2 border rounded bg-white";
      board.appendChild(cell);
    }
  }
}

function updateBoard(num) {
  const cell = document.getElementById(`cell-${num}`);
  if (cell) cell.classList.add("bg-blue-300");
}

function resetGame() {
  drawnNumbers = [];
  localStorage.removeItem("bingoDrawnNumbers");
  document.getElementById("current-number").textContent = "";
  document.getElementById("draw-count").textContent = "0 / 75";
  initializeBoard();
  clearTV();
  fetch("https://bingo-backend-v0gd.onrender.com/api/draws", {
    method: "DELETE"
  }).catch(err => console.error("Failed to clear backend draws", err));

  const drawBtn = document.querySelector("button[onclick='drawNumber()']");
  drawBtn.disabled = false;
  drawBtn.classList.remove("opacity-50", "cursor-not-allowed");
}

function nextGame() {
  if (currentGame >= maxGames) {
    alert("All 10 games have been played!");
    return;
  }
  currentGame++;
  syncGameToBackend(currentGame);
  resetGame();
  document.getElementById("game-counter").textContent = `Game ${currentGame} of ${maxGames}`;
}

function syncGameToBackend(gameNumber) {
  fetch("https://bingo-backend-v0gd.onrender.com/api/game", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game: gameNumber })
  }).catch(err => console.error("Game sync failed:", err));
}


function openTVView() {
  tvWindow = window.open("https://martineznj21.github.io/bingo-frontend/tv.html", "_blank", "width=800,height=600");
}
