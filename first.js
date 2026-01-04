window.onload = function () {

  const GAME_WIDTH = 1280;
  const GAME_HEIGHT = 720;

  const canvas = document.querySelector("canvas");
  const c = canvas.getContext("2d");

  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  function scaleCanvas() {
    const scale = Math.min(
      window.innerWidth / GAME_WIDTH,
      window.innerHeight / GAME_HEIGHT
    );
    canvas.style.width = GAME_WIDTH * scale + "px";
    canvas.style.height = GAME_HEIGHT * scale + "px";
  }
  window.addEventListener("resize", scaleCanvas);
  scaleCanvas();



  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * GAME_WIDTH,
    y: Math.random() * GAME_HEIGHT,
    speed: 0.5 + Math.random() * 1.5
  }));

  function drawParallax() {
    c.fillStyle = "black";
    c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    c.fillStyle = "white";
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > GAME_HEIGHT) s.y = 0;
      c.fillRect(s.x, s.y, 2, 2);
    });
  }

  

  const keys = {};
  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  let mouse = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };
  let touchActive = false;
  let touchPos = { ...mouse };

  canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (GAME_WIDTH / r.width);
    mouse.y = (e.clientY - r.top) * (GAME_HEIGHT / r.height);
  });

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    touchActive = true;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    touchPos.x = (t.clientX - r.left) * (GAME_WIDTH / r.width);
    touchPos.y = (t.clientY - r.top) * (GAME_HEIGHT / r.height);
  }, { passive: false });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!touchActive) return;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    touchPos.x = (t.clientX - r.left) * (GAME_WIDTH / r.width);
    touchPos.y = (t.clientY - r.top) * (GAME_HEIGHT / r.height);
  }, { passive: false });

  canvas.addEventListener("touchend", () => touchActive = false);

  

  const shipImg = new Image();
  shipImg.src = "https://image.ibb.co/dfbD1U/heroShip.png";

  const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 90,
    speed: 52,
    update() {
      let dx = 0, dy = 0;

      if (keys.a || keys.arrowleft) dx--;
      if (keys.d || keys.arrowright) dx++;
      if (keys.w || keys.arrowup) dy--;
      if (keys.s || keys.arrowdown) dy++;

      if (!dx && !dy) {
        const t = touchActive ? touchPos : mouse;
        const mx = t.x - this.x;
        const my = t.y - this.y;
        const d = Math.hypot(mx, my);
        if (d) { dx = mx / d; dy = my / d; }
      }

      this.x += dx * this.speed;
      this.y += dy * this.speed;

      this.x = Math.max(16, Math.min(GAME_WIDTH - 16, this.x));
      this.y = Math.max(16, Math.min(GAME_HEIGHT - 16, this.y));
    },
    draw() {
      c.drawImage(shipImg, this.x - 16, this.y - 16, 32, 32);
    }
  };



  let bullets = [];
  let enemies = [];
  let bosses = [];
  let bossBullets = [];
  let particles = [];

  let score = 0;
  let level = 1;
  let health = 100;
  const MAX_HEALTH = 100;
  let gameOver = false;

  function difficulty() {
    if (level < 3) return "Easy";
    if (level < 6) return "Medium";
    return "Hard";
  }



  setInterval(() => {
    if (!gameOver) {
      bullets.push({
        x: player.x,
        y: player.y,
        speed: 26,
        damage: 1 + Math.floor(level / 2)
      });
    }
  }, 70);

  const enemyImg = new Image();
  enemyImg.src = "https://i.ibb.co/0YgHvmx/enemy-fotor-20230927153748.png";

  setInterval(() => {
    if (gameOver) return;
    for (let i = 0; i < 4 + level; i++) {
      enemies.push({
        x: Math.random() * (GAME_WIDTH - 32),
        y: -32,
        speed: 2 + level * 0.25,
        size: 32
      });
    }
  }, 1200);

  function spawnBosses() {
    bosses.length = 0;
    const count = level >= 10 ? 3 : level >= 7 ? 2 : level >= 3 ? 1 : 0;

    for (let i = 0; i < count; i++) {
      const weak = Math.random() < 0.6;
      bosses.push({
        x: 200 + i * 300,
        y: 60,
        hp: weak ? 40 + level * 8 : 70 + level * 12,
        dir: Math.random() > 0.5 ? 1 : -1
      });
    }
  }

  function explode(x, y) {
    for (let i = 0; i < 14; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        life: 20
      });
    }
  }

  function hit(a, b) {
    return a.x > b.x && a.x < b.x + 96 &&
           a.y > b.y && a.y < b.y + 96;
  }

  

  function animate() {
    requestAnimationFrame(animate);
    drawParallax();

    if (!gameOver) {
      player.update();
      player.draw();
    }

    bullets.forEach((b, i) => {
      b.y -= b.speed;
      c.fillStyle = "cyan";
      c.fillRect(b.x - 3, b.y, 6, 18);
      if (b.y < 0) bullets.splice(i, 1);
    });

    enemies.forEach((e, ei) => {
      e.y += e.speed;
      c.drawImage(enemyImg, e.x, e.y, 32, 32);

      bullets.forEach((b, bi) => {
        if (hit(b, { x: e.x, y: e.y })) {
          enemies.splice(ei, 1);
          bullets.splice(bi, 1);
          explode(e.x + 16, e.y + 16);
          score++;
          if (score % 12 === 0 && level < 10) {
            level++;
            spawnBosses();
          }
        }
      });

      if (e.y > GAME_HEIGHT) {
        enemies.splice(ei, 1);
        health -= 3;
      }
    });

    bosses.forEach((boss, bi) => {
      boss.x += boss.dir * 2;
      if (boss.x < 0 || boss.x > GAME_WIDTH - 96) boss.dir *= -1;

      c.drawImage(enemyImg, boss.x, boss.y, 96, 96);

      bullets.forEach((b, i) => {
        if (hit(b, boss)) {
          bullets.splice(i, 1);
          boss.hp -= b.damage;
          explode(b.x, b.y);
        }
      });

      if (Math.random() < (level >= 7 ? 0.03 : 0.015)) {
        bossBullets.push({ x: boss.x + 48, y: boss.y + 96 });
      }

      if (boss.hp <= 0) {
        bosses.splice(bi, 1);
        explode(boss.x + 48, boss.y + 48);
        health = Math.min(MAX_HEALTH, health + MAX_HEALTH / 2);
      }
    });

    bossBullets.forEach((bb, i) => {
      bb.y += 7;
      c.fillStyle = "red";
      c.fillRect(bb.x - 3, bb.y, 6, 14);

      if (
        bb.x > player.x - 16 &&
        bb.x < player.x + 16 &&
        bb.y > player.y - 16 &&
        bb.y < player.y + 16
      ) {
        bossBullets.splice(i, 1);
        health -= level >= 7 ? 10 : 6;
      }
    });

    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      c.fillStyle = "orange";
      c.fillRect(p.x, p.y, 3, 3);
      if (p.life <= 0) particles.splice(i, 1);
    });

    if (health <= 0) gameOver = true;

   

    c.save();
    c.fillStyle = "rgba(0,0,0,0.75)";
    c.fillRect(12, 12, 240, 105);

    c.fillStyle = "white";
    c.font = "18px Arial";
    c.shadowColor = "black";
    c.shadowBlur = 4;

    c.fillText("Health: " + health, 22, 42);
    c.fillText("Level: " + level, 22, 66);
    c.fillText("Difficulty: " + difficulty(), 22, 90);
    c.restore();

    if (gameOver) drawGameOver();
  }

  function drawGameOver() {
    c.fillStyle = "rgba(0,0,0,0.7)";
    c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    c.fillStyle = "white";
    c.font = "48px Arial";
    const t = "GAME OVER";
    const w = c.measureText(t).width;
    c.fillText(t, GAME_WIDTH / 2 - w / 2, GAME_HEIGHT / 2 - 40);

    const bw = 260, bh = 50;
    const bx = GAME_WIDTH / 2 - bw / 2;
    const by = GAME_HEIGHT / 2 + 10;

    c.fillStyle = "#00e5ff";
    c.fillRect(bx, by, bw, bh);
    c.fillStyle = "#000";
    c.font = "22px Arial";
    c.fillText("RESTART", GAME_WIDTH / 2 - 45, by + 33);

    canvas.onpointerdown = e => {
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) * (GAME_WIDTH / r.width);
      const y = (e.clientY - r.top) * (GAME_HEIGHT / r.height);
      if (x > bx && x < bx + bw && y > by && y < by + bh) location.reload();
    };
  }

  animate();
};











