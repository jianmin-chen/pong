const FPS = 1000 / 60;
let canvas, ctx;
let a,
    b,
    ball,
    aScore = 0,
    bScore = 0;
let lastTime,
    keysPressed = {},
    state = {
        state: "menu",
        info: { menuSelection: "player", mode: "normal" }
    };

// Other constants that might be useful
const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const randomSpeed = (minMin, maxMin, minMax, maxMax) => {
    // Set random speed
    let minSpeed = random(minMin, maxMin);
    let maxSpeed = random(minMax, maxMax);
    if (Math.abs(minSpeed) > maxSpeed) return minSpeed;
    return maxSpeed;
};

const collide = (a, b) => {
    if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    )
        return true;
    return false;
};

const WIN_SCORE = 10;
const BACKGROUND = "black",
    FOREGROUND = "white";
const BALL_WIDTH = 25,
    BALL_HEIGHT = 25;
const PADDLE_WIDTH = 15,
    PADDLE_HEIGHT = 140;
const PLAYER_DY = 400;
const BALL_DX = randomSpeed(-500, -400, 400, 500),
    BALL_DY = randomSpeed(-500, -400, 400, 500);

class Player {
    constructor(x, y, [width, height]) {
        this.color = FOREGROUND;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dy = PLAYER_DY;
    }

    moveUp(delta) {
        if (this.y != 0) {
            let movement = this.dy * delta;
            if (this.y - movement <= 0) this.y = 0;
            else this.y -= movement;
        }
    }

    moveDown(delta) {
        if (this.y != canvas.height - this.height) {
            let movement = this.dy * delta;
            if (this.y + movement >= canvas.height - this.height)
                this.y = canvas.height - this.height;
            else this.y += movement;
        }
    }

    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class AI extends Player {
    constructor(x, y, size) {
        super(x, y, size);
    }

    addBall(ball) {
        // Add ball to keep track of
        this.ball = ball;
        this.dy = Math.abs(ball.dy);
    }

    render(delta) {
        this.dy = Math.abs(ball.dy);
        // Move in direction of ball
        if (this.ball.y < this.y) this.moveUp(delta);
        else if (this.ball.y > this.y) this.moveDown(delta);
        super.render();
    }
}

class Ball {
    constructor(x, y, [width, height], collisionSprites) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dx = BALL_DX;
        this.dy = BALL_DY;
        this.collisionSprites = collisionSprites;
    }

    resetPos() {
        // Reset position
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.dx = -(this.dx * 1.02); // Winning player's direction
        this.dy *= 1.02;
        for (let sprite of this.collisionSprites) {
            if (sprite instanceof AI) {
                // Update dy of AI
                sprite.dy = this.dy;
            }
        }
    }

    move(delta) {
        /*
        let edge = false;
        if (this.x >= canvas.width - this.width) {
            aScore++;
            edge = true;
        } else if (this.x < 0) {
            bScore++;
            edge = true;
        }
        if (edge) {
            this.x = canvas.width / 2;
            this.y = random(this.height, canvas.height - this.height);
            this.dx = -this.dx; // In the direction of the winning player
        }

        if (this.y >= canvas.height - this.height || this.y <= 0)
            this.dy = -this.dy;
        else this.y += delta * this.dy;
        */

        this.x += this.dx * delta;
        this.y += this.dy * delta;

        for (let sprite of this.collisionSprites) {
            if (collide(sprite, this)) {
                // Collided, so reflect off
                if (sprite.x <= this.x) this.x = sprite.x + sprite.width;
                else if (sprite.x >= this.x) this.x = sprite.x - this.width;
                this.dx = -this.dx;
                if (random(0, 1)) this.dy = -this.dy;
            }
        }

        if (this.x >= canvas.width) {
            aScore++;
            this.resetPos();
        } else if (this.x <= 0) {
            bScore++;
            this.resetPos();
        }

        if (this.y <= 0) {
            this.y = 0;
            this.dy = -this.dy;
        } else if (this.y >= canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.dy = -this.dy;
        }
    }

    render() {
        ctx.fillStyle = FOREGROUND;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

const writeText = (text, x, y, fontSize = "100px") => {
    ctx.fillStyle = FOREGROUND;
    ctx.font = `${fontSize} Pong`;
    ctx.fillText(text, x, y);
};

const showScores = () => {
    writeText(aScore.toString(), canvas.width * 0.25, 120);
    writeText(bScore.toString(), canvas.width * 0.75, 120);
};

const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

const clearCanvas = () => {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawMenu = () => {
    writeText("PONG", canvas.width / 2 - 250, 240, "200px");

    // Buttons
    if (state.info.menuSelection === "player") {
        writeText("> vs. player", canvas.width / 2 - 300, 440);
        writeText("vs. AI", canvas.width / 2 - 150, 560);
    } else {
        writeText("vs. player", canvas.width / 2 - 250, 440);
        writeText("> vs. AI", canvas.width / 2 - 200, 560);
    }
};

const initGame = menuSelection => {
    ball = new Ball(
        canvas.width / 2,
        canvas.height / 2,
        [BALL_WIDTH, BALL_HEIGHT],
        []
    );

    a = new Player(50, (canvas.height - PADDLE_HEIGHT) / 2, [
        PADDLE_WIDTH,
        PADDLE_HEIGHT
    ]);

    if (state.info.menuSelection === "player")
        b = new Player(canvas.width - 50, (canvas.height - PADDLE_HEIGHT) / 2, [
            PADDLE_WIDTH,
            PADDLE_HEIGHT
        ]);
    else {
        b = new AI(canvas.width - 50, (canvas.height - PADDLE_HEIGHT) / 2, [
            PADDLE_WIDTH,
            PADDLE_HEIGHT
        ]);
        b.addBall(ball);
    }

    ball.collisionSprites = [a, b];
};

const gameloop = now => {
    // Main game loop
    if (!lastTime) lastTime = now;

    const elapsed = now - lastTime;
    if (elapsed > FPS) {
        let seconds = elapsed / 1000; // Convert ms -> sec

        clearCanvas();
        switch (state.state) {
            case "menu":
                drawMenu();
                if (keysPressed["ArrowUp"]) state.info.menuSelection = "player";
                else if (keysPressed["ArrowDown"])
                    state.info.menuSelection = "ai";
                else if (keysPressed["Enter"]) {
                    // Begin game
                    initGame(state.info.menuSelection);
                    state.state = "game";
                }

                break;
            case "game":
                // Determine if anybody has won
                if (aScore === WIN_SCORE) {
                    writeText(
                        "Player A wins!",
                        (canvas.width - 700) / 2,
                        canvas.height / 2
                    );
                    state.state = "over";
                    break;
                } else if (bScore === WIN_SCORE) {
                    writeText(
                        "Player B wins!",
                        (canvas.width - 700) / 2,
                        canvas.height / 2
                    );
                    state.state = "over";
                    break;
                }
                showScores();

                // Render sprites
                ball.render();
                a.render(seconds);
                b.render(seconds);

                // Movement of sprites
                ball.move(seconds);
                if (state.info.mode === "normal") {
                    if (keysPressed["w"]) a.moveUp(seconds);
                    else if (keysPressed["s"]) a.moveDown(seconds);
                    else if (keysPressed["Shift"] && keysPressed["Q"]) {
                        // Mwhahaha - UNLOCKS GOD MODE!
                        a = new AI(a.x, a.y, [PADDLE_WIDTH, PADDLE_HEIGHT]);
                        a.addBall(ball);
                        a.color = "yellow";
                        state.info.mode = "god";
                        ball.collisionSprites = [a, b];
                    }
                }
                if (state.info.menuSelection === "player") {
                    // Let player B move keys
                    if (keysPressed["ArrowUp"]) b.moveUp(seconds);
                    else if (keysPressed["ArrowDown"]) b.moveDown(seconds);
                }
                break;
        }

        lastTime = now;
    }

    if (state.state != "over") requestAnimationFrame(gameloop);
};

window.onload = () => {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    resizeCanvas();
    requestAnimationFrame(gameloop);

    document.body.addEventListener(
        "keydown",
        event => (keysPressed[event.key] = true)
    );

    document.body.addEventListener(
        "keyup",
        event => delete keysPressed[event.key]
    );
};
