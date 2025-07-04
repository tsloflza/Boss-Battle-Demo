let input = `
A 123 230 780
B 821 468 267 627
C 374 593 273
D 375 924
E 274
`;

let teamNames = [];
let friendDamages = input.trim().split('\n').map((line, i) => {
  let [team, ...nums] = line.trim().split(' ');
  teamNames.push("Team " + team);
  return nums.map(str => {
    if (str.length !== 3) return 0;
    return parseInt(str[0]) * parseInt(str[1]) * parseInt(str[2]);
  }).sort((a, b) => a - b);
});

let totalDamage = friendDamages.flat().reduce((a, b) => a + b, 0);
let bossHP = totalDamage;
let bossMaxHP = totalDamage;

let friendStates = friendDamages.map(d => ({
  damageGiven: 0,
  alive: true
}));

let turn = 0; // from 0 to 5 (0~4 are friends, 5 is boss)
let round = 1;
let showSummary = false;
let animState = {
  friendAttacking: -1,
  bossAttacking: false,
  bossHurt: false
};
let damageText = null;

let bossFrame = 0;
let bossScale = 5;
let bossAttackFrame = 0;

let gameState = 'start'; // 'start' 或 'battle'
let startBlinkAlpha = 255;
let startBlinkDir = -3;

let bg;
let bgMusic;
let friendHitSound;
let bossHitSound;
let bossImages = [];
let friendSprites = [];

function preload() {
  // 背景
  bg = loadImage("assets/craftpix-671123-free-halloween-2d-game-backgrounds/PNG/1_game_background/1_game_background.png");
  bgMusic = loadSound("assets/music/An-Epic-Story(chosic.com).mp3");

  // boss圖片（Ghost1~5）
  for (let i = 1; i <= 5; i++) {
    bossImages.push(loadImage(`assets/craftpix-net-734199-free-halloween-decorations-characters-and-items-pixel-art/1 Objects/Ghost${i}.png`));
  }

  // 角色
  friendHitSound = loadSound("assets/sound_effect/mixkit-sword-blade-attack-in-medieval-battle-2762.wav");
  bossHitSound = loadSound("assets/sound_effect/mixkit-martial-arts-punch-2052.wav");
  const spritePaths = [
    "assets/craftpix-net-211148-free-fantasy-chibi-female-sprites-pixel-art/Enchantress",
    "assets/craftpix-net-211148-free-fantasy-chibi-female-sprites-pixel-art/Knight",
    "assets/craftpix-net-211148-free-fantasy-chibi-female-sprites-pixel-art/Musketeer",
    "assets/craftpix-net-439247-free-fantasy-chibi-male-sprites-pixel-art/Swordsman",
    "assets/craftpix-net-439247-free-fantasy-chibi-male-sprites-pixel-art/Wizard"
  ];

  for (let path of spritePaths) {
    friendSprites.push({
      idle: loadImage(`${path}/Idle.png`),
      attack: loadImage(`${path}/Attack_1.png`),
      hurt: loadImage(`${path}/Hurt.png`),
      dead: loadImage(`${path}/Dead.png`),
      frame: 0,
      state: 'idle',         // 'idle' | 'attack' | 'hurt' | 'dead'
      locked: false,         // 鎖住動畫直到播放完一次
      justPlayed: false      // true 表示該角色剛剛被設定為一次性動畫
    });
  }
}

function setup() {
  createCanvas(800, 500);
  frameRate(30);
}

function draw() {
  if (gameState === 'start') {
    drawStartScreen();
    return;
  }

  if (bg) image(bg, 0, 0, width, height);

  drawBossBar();
  drawFriendStatus();
  drawCharacters();

  if (frameCount % 50 === 0) {
    stepBattle();
  }

  if (damageText && damageText.frame > 0) { // 紅色傷害數字
    fill(255, 0, 0);
    textSize(25);
    textAlign(CENTER);
    text(`-${damageText.value}`, damageText.x, damageText.y);
    damageText.frame--;
  }

  if (showSummary) {
    drawSummary();
    return;
  }
}

function drawStartScreen() {
  if (bg) image(bg, 0, 0, width, height);

  textAlign(CENTER);
  textSize(40);
  fill(255, startBlinkAlpha);
  text("Start", width / 2, height - 100);

  startBlinkAlpha += startBlinkDir;
  if (startBlinkAlpha <= 100 || startBlinkAlpha >= 255) {
    startBlinkDir *= -1;
  }
}

function mousePressed() {
  if (gameState === 'start') {
    gameState = 'battle';

    bgMusic.setLoop(true);
    bgMusic.play();
  }
}

function drawBossBar() {
  let barWidth = 600;
  let hpRatio = bossHP / bossMaxHP;
  fill(255);
  textSize(20);
  textAlign(CENTER);
  text('Boss HP: ' + bossHP + ' / ' + bossMaxHP, width/2, 40);

  fill(100);
  rect(100, 50, barWidth, 20);
  fill(animState.bossHurt ? 'red' : 'lime');
  rect(100, 50, barWidth * hpRatio, 20);
}

function drawFriendStatus() {
  textAlign(LEFT);
  textSize(20);
  for (let i = 0; i < 5; i++) {
    let y = 100 + i * 80;
    fill(255);
    text(`${teamNames[i]}: ${friendStates[i].damageGiven}`, 20, y);
    if (!friendStates[i].alive) {
      fill('red');
      text('DEAD', 150, y);
    }
  }
}

function drawCharacters() {
  for (let i = 0; i < 5; i++) {
    let x = 300;
    let y = 140 + i * 80;
    let s = friendSprites[i];

    // 如果角色剛死亡，就設定播放死亡動畫
    if (!friendStates[i].alive && s.state !== 'dead') {
      s.state = 'dead';
      s.frame = 0;
      s.locked = false;
      s.justPlayed = true;
    }

    let spriteImg = s[s.state];
    let totalFrames = floor(spriteImg.width / 128);
    let frameIndex = floor(s.frame);
    let sx = frameIndex * 128;

    image(spriteImg.get(sx, 0, 128, 128), x - 128, y - 128, 128, 128);

    // 控制動畫更新
    if (!s.locked) {
      s.frame += 0.25;

      if (s.frame >= totalFrames) {
        if (s.justPlayed) {
          s.justPlayed = false;
          if (s.state === 'attack' || s.state === 'hurt') {
            s.state = 'idle';
            s.frame = 0;
          } else if (s.state === 'dead') {
            s.frame = totalFrames - 1; // 停在死亡最後一幀
            s.locked = true;
          }
        } else {
          // idle 等循環動畫
          s.frame = 0;
        }
      }
    }
  }

  // boss
  let bx = 550, by = 250;
  if (bossHP <= 0) return; // 死亡後不顯示

  let img = bossImages[floor(bossFrame) % bossImages.length];
  let scale = bossScale;
  if (animState.bossAttacking) {
    bossAttackFrame++;
    if (bossAttackFrame < 10) {
      scale = map(bossAttackFrame, 0, 10, 5, 10);
    } else if (bossAttackFrame < 20) {
      scale = map(bossAttackFrame, 10, 20, 10, 5);
    } else {
      animState.bossAttacking = false;
      bossAttackFrame = 0;
    }
  }
  imageMode(CENTER);
  image(img, bx, by, img.width * scale, img.height * scale);
  imageMode(CORNER);
  bossFrame += 0.2;

}

function drawSummary() {
  fill(0, 200);
  rect(200, 100, 400, 220, 20);

  fill(255);
  textSize(24);
  textAlign(CENTER);
  text("Damage List", 400, 140);

  let ranking = friendStates.map((f, i) => ({
    name: teamNames[i],
    dmg: f.damageGiven
  })).sort((a, b) => b.dmg - a.dmg);

  textSize(18);
  for (let i = 0; i < ranking.length; i++) {
    text(`${ranking[i].name}: ${ranking[i].dmg}`, 400, 180 + i * 30);
  }
}

function stepBattle() {
  if (bossHP <= 0) {
    showSummary = true;
    return;
  }

  animState.friendAttacking = -1;
  animState.bossAttacking = false;
  animState.bossHurt = false;

  for (let i = 0; i < 5; i++) {
    friendSprites[i].state = friendStates[i].alive ? 'idle' : 'dead';
  }

  if (turn < 5) {
    if (friendStates[turn].alive) {
      let damageArray = friendDamages[turn];
      if (round - 1 < damageArray.length) {
        let dmg = damageArray[round - 1];
        bossHP -= dmg;
        friendStates[turn].damageGiven += dmg;
        animState.friendAttacking = turn;
        animState.bossHurt = true;

        friendSprites[turn].state = 'attack';
        friendSprites[turn].frame = 0;
        friendSprites[turn].locked = false;
        friendSprites[turn].justPlayed = true;
        friendHitSound.play();

        damageText = {
          value: dmg,
          x: 400,
          y: 160 + turn * 40,
          frame: 30
        };
      }
    }
    turn++;
  } else {
    for (let i = 0; i < 5; i++) {
      if (round >= friendDamages[i].length) {
        friendStates[i].alive = false;
      } else if (friendStates[i].alive) {
        friendSprites[i].state = 'hurt';
        friendSprites[i].frame = 0;
        friendSprites[i].locked = false;
        friendSprites[i].justPlayed = true;
      }
    }

    if (bossHP > 0) {
      animState.bossAttacking = true;
      bossHitSound.play();
      turn = 0;
      round++;
    }
  }

  while (turn < 5 && !friendStates[turn].alive) {
    turn++;
  }
}
