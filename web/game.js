const config = {
    type: Phaser.AUTO,
    width: 420,
    height: 420,
    parent: 'phaser-game',
    backgroundColor: '#1a1a1a',
    scene: {
        create: create,
        preload: preload,
        update: update
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH, // Phaser сам вирахує центр
    },
};

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;

const game = new Phaser.Game(config);

function create() {
    let graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.8);

    
    for (let x = 0; x <= 420; x += 21) {
        graphics.moveTo(x, 0);
        graphics.lineTo(x, 420);
    }    
    for (let y = 0; y <= 420; y += 21) {
        graphics.moveTo(0, y);
        graphics.lineTo(420, y);
    }
    graphics.strokePath();

    //Лінії розмежування

    food = this.add.sprite(21 * 5, 21 * 5, 'apple').setOrigin(0);
}

let food;
function preload() {
    this.load.image('apple', 'assets/apple.png');
}

function update() {

}