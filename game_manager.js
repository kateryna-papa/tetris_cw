function GameManager() {
  var gridCanvas = document.getElementById("grid-canvas");
  var nextCanvas = document.getElementById("next-canvas");
  var scoreContainer = document.getElementById("score-container");
  var resetButton = document.getElementById("reset-button");
  var aiButton = document.getElementById("ai-button");
  var gridContext = gridCanvas.getContext("2d");
  var nextContext = nextCanvas.getContext("2d");
  document.addEventListener("keydown", onKeyDown);

  var grid = new Grid(22, 10);
  var rpg = new RandomPieceGenerator();
  var ai = new AI({
    heightWeight: 0.510066,
    linesWeight: 0.760666,
    holesWeight: 0.35663,
    bumpinessWeight: 0.184483,
  });
  var workingPieces = [null, rpg.nextPiece()];
  var workingPiece = null;
  var isAiActive = true;
  var isKeyEnabled = false;
  var gravityTimer = new Timer(onGravityTimerTick, 500);
  var score = 0;

  function intToRGBHexString(v) {
    return (
      "rgb(" +
      ((v >> 16) & 0xff) +
      "," +
      ((v >> 8) & 0xff) +
      "," +
      (v & 0xff) +
      ")"
    );
  }

  function redrawGridCanvas(workingPieceVerticalOffset = 0) {
    gridContext.save();
    gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    for (var r = 2; r < grid.rows; r++) {
      for (var c = 0; c < grid.columns; c++) {
        if (grid.cells[r][c] != 0) {
          gridContext.fillStyle = intToRGBHexString(grid.cells[r][c]);
          gridContext.fillRect(20 * c, 20 * (r - 2), 20, 20);
          gridContext.strokeStyle = "#FFFFFF";
          gridContext.strokeRect(20 * c, 20 * (r - 2), 20, 20);
        }
      }
    }

    for (var r = 0; r < workingPiece.dimension; r++) {
      for (var c = 0; c < workingPiece.dimension; c++) {
        if (workingPiece.cells[r][c] != 0) {
          gridContext.fillStyle = intToRGBHexString(workingPiece.cells[r][c]);
          gridContext.fillRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
          gridContext.strokeStyle = "#FFFFFF";
          gridContext.strokeRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
        }
      }
    }

    gridContext.restore();
  }

  function redrawNextCanvas() {
    nextContext.save();

    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    var next = workingPieces[1];
    var xOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 10
        : next.dimension == 4
        ? 0
        : null;
    var yOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 20
        : next.dimension == 4
        ? 10
        : null;
    for (var r = 0; r < next.dimension; r++) {
      for (var c = 0; c < next.dimension; c++) {
        if (next.cells[r][c] != 0) {
          nextContext.fillStyle = intToRGBHexString(next.cells[r][c]);

          nextContext.fillRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);

          nextContext.strokeStyle = "#FFFFFF";
          nextContext.strokeRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
        }
      }
    }

    nextContext.restore();
  }

  function updateScoreContainer() {
    scoreContainer.innerHTML = score.toString();
  }

  var workingPieceDropAnimationStopwatch = null;

  function startWorkingPieceDropAnimation(callback = function () {}) {
    animationHeight = 0;
    _workingPiece = workingPiece.clone();
    while (_workingPiece.moveDown(grid)) {
      animationHeight++;
    }

    var stopwatch = new Stopwatch(function (elapsed) {
      if (elapsed >= animationHeight * 20) {
        stopwatch.stop();
        redrawGridCanvas(20 * animationHeight);
        callback();
        return;
      }

      redrawGridCanvas((20 * elapsed) / 20);
    });

    workingPieceDropAnimationStopwatch = stopwatch;
  }

  function cancelWorkingPieceDropAnimation() {
    if (workingPieceDropAnimationStopwatch === null) {
      return;
    }
    workingPieceDropAnimationStopwatch.stop();

    workingPieceDropAnimationStopwatch = null;
  }

  function startTurn() {
    for (var i = 0; i < workingPieces.length - 1; i++) {
      workingPieces[i] = workingPieces[i + 1];
    }
    workingPieces[workingPieces.length - 1] = rpg.nextPiece();
    workingPiece = workingPieces[0];

    redrawGridCanvas();
    redrawNextCanvas();

    if (isAiActive) {
      isKeyEnabled = false;
      workingPiece = ai.best(grid, workingPieces);
      startWorkingPieceDropAnimation(function () {
        while (workingPiece.moveDown(grid));
        if (!endTurn()) {
          alert("Game Over!");
          return;
        }
        startTurn();
      });
    } else {
      isKeyEnabled = true;
      gravityTimer.resetForward(500);
    }
  }

  function endTurn() {
    grid.addPiece(workingPiece);

    score += grid.clearLines();

    redrawGridCanvas();
    updateScoreContainer();

    return !grid.exceeded();
  }

  function onGravityTimerTick() {
    if (workingPiece.canMoveDown(grid)) {
      workingPiece.moveDown(grid);

      redrawGridCanvas();
      return;
    }

    gravityTimer.stop();

    if (!endTurn()) {
      isKeyEnabled = false;
      alert("Game Over!");
      return;
    }

    startTurn();
  }

function onKeyDown(event) {
    if (!isKeyEnabled) {
      return;
    }

    switch (event.which) {
      case 32: // Spacebar - швидке падіння
        isKeyEnabled = false;
        gravityTimer.stop();
        startWorkingPieceDropAnimation(function () {
          while (workingPiece.moveDown(grid));
          if (!endTurn()) {
            alert("Game Over!");
            return;
          }
          startTurn();
        });
        break;

      case 37: // Стрілка вліво
        if (workingPiece.canMoveLeft(grid)) {
          workingPiece.moveLeft(grid);
          redrawGridCanvas();
        }
        break;

      case 39: // Стрілка вправо
        if (workingPiece.canMoveRight(grid)) {
          workingPiece.moveRight(grid);
          redrawGridCanvas();
        }
        break;

      case 40: // Стрілка вниз
        if (workingPiece.canMoveDown(grid)) {
          workingPiece.moveDown(grid);
          redrawGridCanvas();
        }
        break;

      case 38: // Стрілка вгору - ротація
        workingPiece.rotate(grid);
        redrawGridCanvas();
        break;
    }
  }

  aiButton.onclick = function () {
    if (isAiActive) {
      isAiActive = false;
      aiButton.style.backgroundColor = "#f9f9f9";
    } else {
      isAiActive = true;
      aiButton.style.backgroundColor = "#e9e9ff";

      isKeyEnabled = false;
      gravityTimer.stop();
      startWorkingPieceDropAnimation(function () {
        while (workingPiece.moveDown(grid));
        if (!endTurn()) {
          alert("Game Over!");
          return;
        }
        startTurn();
      });
    }
  };

  resetButton.onclick = function () {
    gravityTimer.stop();
    cancelWorkingPieceDropAnimation();
    grid = new Grid(22, 10);
    rpg = new RandomPieceGenerator();
    workingPieces = [null, rpg.nextPiece()];
    workingPiece = null;
    score = 0;
    isKeyEnabled = true;
    updateScoreContainer();
    startTurn();
  };

  aiButton.style.backgroundColor = "#e9e9ff";
  startTurn();
}

GameManager();
