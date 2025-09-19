(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const startOverlay = document.getElementById('overlay-start');
  const btnStart = document.getElementById('btn-start');
  const gameoverOverlay = document.getElementById('overlay-gameover');
  const btnRestart = document.getElementById('btn-restart');
  const scoreEl = document.getElementById('score');
  const finalScoreEl = document.getElementById('final-score');

  // 遊戲設定
  const gridSize = 24; // 每格像素
  const cols = Math.floor(canvas.width / gridSize);
  const rows = Math.floor(canvas.height / gridSize);
  const stepMs = 120; // 每步時間（毫秒）

  /** @typedef {{x:number,y:number}} Point */

  /** @type {Point[]} */
  let snake = [];
  /** @type {Point} */
  let apple = { x: 0, y: 0 };
  /** @type {Point} */
  let dir = { x: 1, y: 0 }; // 初始向右
  /** @type {Point} */
  let nextDir = { x: 1, y: 0 };
  let pendingGrowth = 0;
  let score = 0;
  let lastStepAt = 0;
  let running = false;
  let gameOver = false;

  function initGame() {
    snake = [
      { x: Math.floor(cols / 2), y: Math.floor(rows / 2) },
      { x: Math.floor(cols / 2) - 1, y: Math.floor(rows / 2) },
      { x: Math.floor(cols / 2) - 2, y: Math.floor(rows / 2) },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    pendingGrowth = 0;
    score = 0;
    scoreEl.textContent = String(score);
    placeApple();
    gameOver = false;
    running = true;
    lastStepAt = 0;
  }

  function placeApple() {
    while (true) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      const onSnake = snake.some(seg => seg.x === x && seg.y === y);
      if (!onSnake) {
        apple = { x, y };
        return;
      }
    }
  }

  function updateDirectionFromKey(code) {
    // 方向鍵與 WASD
    if (code === 'ArrowUp' || code === 'KeyW') nextDir = { x: 0, y: -1 };
    else if (code === 'ArrowDown' || code === 'KeyS') nextDir = { x: 0, y: 1 };
    else if (code === 'ArrowLeft' || code === 'KeyA') nextDir = { x: -1, y: 0 };
    else if (code === 'ArrowRight' || code === 'KeyD') nextDir = { x: 1, y: 0 };
  }

  function step() {
    if (!running || gameOver) return;
    // 防止直接反向
    if (nextDir.x !== -dir.x || nextDir.y !== -dir.y) {
      dir = nextDir;
    }

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };

    // 撞牆
    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      return setGameOver();
    }

    // 自撞
    if (snake.some((seg, idx) => idx !== 0 && seg.x === newHead.x && seg.y === newHead.y)) {
      return setGameOver();
    }

    // 移動
    snake.unshift(newHead);
    if (pendingGrowth > 0) {
      pendingGrowth -= 1;
    } else {
      snake.pop();
    }

    // 吃蘋果
    if (newHead.x === apple.x && newHead.y === apple.y) {
      pendingGrowth += 1;
      score += 10;
      scoreEl.textContent = String(score);
      placeApple();
    }
  }

  function setGameOver() {
    gameOver = true;
    running = false;
    finalScoreEl.textContent = String(score);
    gameoverOverlay.classList.add('visible');
    gameoverOverlay.setAttribute('aria-hidden', 'false');
  }

  function drawCell(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
  }

  function render() {
    // 清空畫面
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 井字格微弱網格（可選）
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * gridSize + 0.5, 0);
      ctx.lineTo(c * gridSize + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * gridSize + 0.5);
      ctx.lineTo(canvas.width, r * gridSize + 0.5);
      ctx.stroke();
    }

    // 畫蘋果
    drawCell(apple.x, apple.y, '#ef4444');

    // 畫蛇
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const isHead = i === 0;
      drawCell(seg.x, seg.y, isHead ? '#22d3ee' : '#38bdf8');
    }
  }

  function gameLoop(timestamp) {
    if (running && !gameOver) {
      if (lastStepAt === 0) lastStepAt = timestamp;
      const elapsed = timestamp - lastStepAt;
      if (elapsed >= stepMs) {
        step();
        lastStepAt = timestamp;
      }
    }
    render();
    requestAnimationFrame(gameLoop);
  }

  // 事件
  document.addEventListener('keydown', (e) => {
    updateDirectionFromKey(e.code);
  });

  btnStart.addEventListener('click', () => {
    startOverlay.classList.remove('visible');
    initGame();
  });

  btnRestart.addEventListener('click', () => {
    gameoverOverlay.classList.remove('visible');
    gameoverOverlay.setAttribute('aria-hidden', 'true');
    initGame();
  });

  // 啟動渲染迴圈（待開始才會移動）
  requestAnimationFrame(gameLoop);
})();



