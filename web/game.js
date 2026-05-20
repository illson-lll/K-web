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
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        antialias: false,
        premultipliedAlpha: false
    }
};

var UP = 0;
var DOWN = 1;
var LEFT = 2;
var RIGHT = 3;


var running = false;
var total = 0;
const score_text = document.getElementById('score-total');


const game = new Phaser.Game(config);

function drawGrid(scene) {
    let graphics = scene.add.graphics();
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
}

function preload() {
    this.load.image('apple', 'assets/apple.png');
    this.load.image('body', 'assets/body.png');
}

class Apple extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'apple');
        this.setOrigin(0);
        scene.add.existing(this);

        total = 0;
    }
    eat() {
        total++;
        let x, y;
        let isShake;
        do {
            isShake = false;
            x = Phaser.Math.Between(0, 19) * 21;
            y = Phaser.Math.Between(0, 19) * 21;

            for (let el of snake.body) {
                if (el.x === x && el.y === y) {
                    isShake = true;
                    console.log("body");
                    break;
                }
            }
        } while (isShake);
        this.setPosition(x, y);
    }
}

class Snake {
    constructor(scene) {
        this.scene = scene;
        this.body = [];
        this.grid_size = 21;

        this.direction = RIGHT;
        this.next_direction = RIGHT;

        this.move_time = 0;
        this.speed = 150;

        this.head = scene.add.sprite(this.grid_size * 10, this.grid_size * 10, 'body')
        this.head.setOrigin(0);
        this.body.push(this.head);
        this.grow();
        this.grow();
    }

    setDirection(new_dir) {
        if (this.direction === UP && new_dir === DOWN) return;
        if (this.direction === DOWN && new_dir === UP) return;
        if (this.direction === LEFT && new_dir === RIGHT) return;
        if (this.direction === RIGHT && new_dir === LEFT) return;
        this.next_direction = new_dir;
    }
    update(time) {
        if (time >= this.move_time) {
            return this.move(time);
        }
    }

    move(time) {
        this.direction = this.next_direction;

        let x = this.head.x;
        let y = this.head.y;

        if (this.direction === UP) y -= this.grid_size;
        else if (this.direction === DOWN) y += this.grid_size;
        else if (this.direction === LEFT) x -= this.grid_size;
        else if (this.direction === RIGHT) x += this.grid_size;


        const world_size = 420;

        if (x < 0) {
            x = world_size - this.grid_size;
        } else if (x >= world_size) {
            x = 0;
        }

        if (y < 0) {
            y = world_size - this.grid_size;
        } else if (y >= world_size) {
            y = 0;
        }
        let tail = this.body.pop();
        tail.x = this.head.x;
        tail.y = this.head.y;
        this.body.splice(1, 0, tail);

        this.head.x = x;
        this.head.y = y;

        this.move_time = time + this.speed;

        return true;
    }
    grow() {
        let last_segment = this.body[this.body.length - 1];
        let new_segment = this.scene.add.sprite(last_segment.x, last_segment.y, 'body');
        new_segment.setOrigin(0);
        this.body.push(new_segment);
    }

    checkCollision() {
        for (let i = 1; i < this.body.length; i++) {
            if (this.head.x === this.body[i].x && this.head.y === this.body[i].y) {
                return true;
            }
        }
        return false;
    }
}

function update_text_score() {
    score_text.innerText = total;
}



function create() {
    drawGrid(this);

    food = new Apple(this, 21 * 5, 21 * 5);
    snake = new Snake(this);
    cursors = this.input.keyboard.createCursorKeys();
    total = 0;

    let downX, upX, downY, upY, threshold = 40;

    this.input.on('pointerdown', function (pointer) {
        downX = pointer.x;
        downY = pointer.y;
    });


    this.input.on('pointerup', function (pointer) {
        upX = pointer.x;
        upY = pointer.y;

        let diffX = Math.abs(downX - upX);
        let diffY = Math.abs(downY - upY);

        if (diffX > diffY) {
            if (upX < downX - threshold) {
                snake.setDirection(LEFT);
            } else if (upX > downX + threshold) {
                snake.setDirection(RIGHT);
            }
        } else {
            if (upY < downY - threshold) {
                snake.setDirection(UP);
            } else if (upY > downY + threshold) {
                snake.setDirection(DOWN);
            }
        }
        //https://www.html5gamedevs.com/topic/39661-creating-swiping-mechanism/
    });

    update_text_score()
}

function checkEat() {
    if (snake.head.x === food.x && snake.head.y === food.y) {
        food.eat();
        snake.grow();
        update_text_score()
    }
}

function GameOver(scene) {
    console.log("Game over!");
    running = false;
    gameoverMenu(total);
    scene.scene.restart();
}

function RestartGame(scene) {
    running = true;
    scene.scene.restart();
}


function update(time) {
    if (!running) return;
    if (cursors.up.isDown) snake.setDirection(UP);
    else if (cursors.down.isDown) snake.setDirection(DOWN);
    else if (cursors.left.isDown) snake.setDirection(LEFT);
    else if (cursors.right.isDown) snake.setDirection(RIGHT);
    snake.update(time);
    checkEat();
    if (snake.checkCollision()) {
        GameOver(this);
    };
}