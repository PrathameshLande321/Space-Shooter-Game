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

  /* ================= INPUT ================= */

  const keys = {};
  window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
  window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

  let mouse = { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 };

  canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (GAME_WIDTH / rect.width);
    mouse.y = (e.clientY - rect.top) * (GAME_HEIGHT / rect.height);
  });

  /* ================= TOUCH SUPPORT ================= */

  let touchActive = false;
  let touchPos = { x: mouse.x, y: mouse.y };

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    touchActive = true;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    touchPos.x = (t.clientX - rect.left) * (GAME_WIDTH / rect.width);
    touchPos.y = (t.clientY - rect.top) * (GAME_HEIGHT / rect.height);
  }, { passive: false });

  canvas.addEventListener("touchmove", e => {
    e.preventDefault();
    if (!touchActive) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    touchPos.x = (t.clientX - rect.left) * (GAME_WIDTH / rect.width);
    touchPos.y = (t.clientY - rect.top) * (GAME_HEIGHT / rect.height);
  }, { passive: false });

  canvas.addEventListener("touchend", () => {
    touchActive = false;
  });

  /* ================= PLAYER ================= */

  const playerImg = new Image();
  playerImg.src = "https://image.ibb.co/dfbD1U/heroShip.png";

  const player = {
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT - 100,
    w: 32,
    h: 32,

    // 🔥 FASTER MOVEMENT
    speed: 36, // was 24

    update() {
      let dx = 0, dy = 0;

      // Keyboard
      if (keys["a"] || keys["arrowleft"]) dx -= 1;
      if (keys["d"] || keys["arrowright"]) dx += 1;
      if (keys["w"] || keys["arrowup"]) dy -= 1;
      if (keys["s"] || keys["arrowdown"]) dy += 1;

      // Mouse / Touch follow
      if (dx === 0 && dy === 0) {
        const target = touchActive ? touchPos : mouse;
        const mx = target.x - this.x;
        const my = target.y - this.y;
        const dist = Math.hypot(mx, my);

        // 🔥 SMALLER DEAD ZONE
        if (dist > 2) {
          dx = mx / dist;
          dy = my / dist;
        }
      }

      // Normalize
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }

      // 🔥 TOUCH BOOST
      const boost = touchActive ? 1.2 : 1;

      this.x += dx * this.speed * boost;
      this.y += dy * this.speed * boost;

      this.x = Math.max(this.w / 2, Math.min(GAME_WIDTH - this.w / 2, this.x));
      this.y = Math.max(this.h / 2, Math.min(GAME_HEIGHT - this.h / 2, this.y));
    },

    draw() {
      c.drawImage(
        playerImg,
        this.x - this.w / 2,
        this.y - this.h / 2,
        this.w,
        this.h
      );
    }
  };

  /* ================= EVERYTHING BELOW UNCHANGED ================= */

  let bullets = [];
  let enemies = [];
  let particles = [];
  let boss = null;
  let bossBullets = [];

  let score = 0;
  let health = 100;
  let level = 1;
  let gameOver = false;

  setInterval(() => {
    if (!gameOver) bullets.push({ x: player.x, y: player.y, speed: 22, size: 6 });
  }, 80);

  const enemyImg = new Image();
  enemyImg.src = "https://i.ibb.co/0YgHvmx/enemy-fotor-20230927153748.png";

  setInterval(() => {
    if (gameOver) return;
    for (let i = 0; i < 3 + level; i++) {
      enemies.push({
        x: Math.random() * (GAME_WIDTH - 32),
        y: -32,
        speed: 2 + level * 0.6,
        size: 32
      });
    }
  }, 1100);

  function explode(x, y) {
    for (let i = 0; i < 14; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 20
      });
    }
  }

  function hit(a, b) {
    return (
      a.x > b.x &&
      a.x < b.x + b.size &&
      a.y > b.y &&
      a.y < b.y + b.size
    );
  }

  canvas.addEventListener("click", () => {
    if (gameOver) location.reload();
  });
  canvas.addEventListener("touchstart", () => {
    if (gameOver) location.reload();
  });

  function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (!gameOver) {
      player.update();
      player.draw();
    } else {
      drawGameOver();
      return;
    }

    bullets.forEach((b, i) => {
      b.y -= b.speed;
      c.fillStyle = "white";
      c.fillRect(b.x - b.size / 2, b.y, b.size, 16);
      if (b.y < 0) bullets.splice(i, 1);
    });

    enemies.forEach((e, ei) => {
      e.y += e.speed;
      c.drawImage(enemyImg, e.x, e.y, e.size, e.size);

      bullets.forEach((b, bi) => {
        if (hit(b, e)) {
          enemies.splice(ei, 1);
          bullets.splice(bi, 1);
          explode(e.x + e.size / 2, e.y + e.size / 2);
          score++;
          if (score % 10 === 0) level++;
        }
      });

      if (e.y > GAME_HEIGHT) {
        enemies.splice(ei, 1);
        health -= 10;
      }
    });

    if (level % 3 === 0 && !boss) {
      boss = {
        x: GAME_WIDTH / 2 - 48,
        y: 60,
        size: 96,
        speed: 2,
        dir: 1,
        hp: 50
      };
    }

    if (boss) {
      boss.x += boss.speed * boss.dir;
      if (boss.x < 0 || boss.x > GAME_WIDTH - boss.size) boss.dir *= -1;

      c.drawImage(enemyImg, boss.x, boss.y, boss.size, boss.size);
      c.fillStyle = "lime";
      c.fillRect(boss.x, boss.y - 10, boss.hp * 2, 5);

      if (Math.random() < 0.03) {
        bossBullets.push({
          x: boss.x + boss.size / 2,
          y: boss.y + boss.size,
          speed: 6,
          size: 6
        });
      }

      bullets.forEach((b, bi) => {
        if (hit(b, boss)) {
          bullets.splice(bi, 1);
          boss.hp--;
          explode(b.x, b.y);
          if (boss.hp <= 0) {
            explode(boss.x + boss.size / 2, boss.y + boss.size / 2);
            boss = null;
            level++;
            score += 20;
          }
        }
      });
    }

    bossBullets.forEach((bb, i) => {
      bb.y += bb.speed;
      c.fillStyle = "red";
      c.fillRect(bb.x - bb.size / 2, bb.y, bb.size, 12);

      if (
        bb.x > player.x - player.w / 2 &&
        bb.x < player.x + player.w / 2 &&
        bb.y > player.y - player.h / 2 &&
        bb.y < player.y + player.h / 2
      ) {
        bossBullets.splice(i, 1);
        health -= 8;
      }

      if (bb.y > GAME_HEIGHT) bossBullets.splice(i, 1);
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

    c.fillStyle = "white";
    c.font = "16px Arial";
    c.fillText("Health: " + health, 20, 30);
    c.fillText("Score: " + score, 20, 50);
    c.fillText("Level: " + level, 20, 70);
  }

  function drawGameOver() {
    c.fillStyle = "rgba(0,0,0,0.6)";
    c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    c.fillStyle = "white";
    c.font = "48px Arial";
    c.fillText("GAME OVER", GAME_WIDTH / 2 - 140, GAME_HEIGHT / 2 - 20);
    c.font = "20px Arial";
    c.fillText("Tap or Click to Restart", GAME_WIDTH / 2 - 120, GAME_HEIGHT / 2 + 30);
  }

  animate();
};


