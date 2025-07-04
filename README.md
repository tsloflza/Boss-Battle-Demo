# 🎮 Boss Battle Demo

This is a turn-based boss battle demo built with **p5.js**, featuring animated characters, damage calculation, sound effects, and background music. The project showcases character animation control, dynamic damage calculation, and stage transitions in a fantasy battle theme.

## 🚀 Features

* **Start Screen** with a flickering "Start" button
* **Animated Allies and Boss** with idle, attack, hurt, and death states
* **Damage Calculation** based on encoded input strings
* **Boss Attack Animation** with scale change and looping ghost frames
* **Sound Effects** for both friend attacks and boss attacks
* **Epic Background Music** (looping)
* **Summary Screen** showing final damage rankings after the boss is defeated

## 🎨 Assets

All visual assets are  [CraftPix.net](https://craftpix.net), including:

* Backgrounds
* Pixel-art character sprites
* Ghost boss frames

Background music is from [Chosic.com](https://www.chosic.com), including:

* An Epic Story

Sound effects are from [mixkit.co](https://mixkit.co/), including:

* Sword Blade Attack
* Martial Arts Punch

## 🧮 Damage Input Format

The battle data is encoded in a string like this:

```js
let input = `
A 123 230 780
B 821 468 267 627
C 374 593 273
D 375 924
E 274
`;
```

Each line corresponds to one character. Each 3-digit number is decoded as:

```text
dmg = digit1 × digit2 × digit3
```

Values are sorted per character and assigned per round.

## 📂 Folder Structure

```
BossBattleDemo/
├── index.html
├── sketch.js
├── p5.js
├── p5.sound.js
├── style.css
├── assets/
└── README.md
```

## ▶️ How to Run

1. Setup Damage Input in `sketch.js`.
2. Open `index.html` in a browser.
3. Click the **Start** button to enter battle.
4. Watch the battle unfold round by round.
5. A summary will display at the end showing the total damage dealt by each team.