const canvas = document.querySelector("canvas");
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const SPEED = 7;
const PROJECTILE_SPEED = 8;
const PLAYER_HP = 3;
const INVADER_HP = 3;

let gameStarted = false;

class Player {
    constructor() {
        this.velocity = {
            x: 0,
            y: 0
        }

        const image = new Image();
        image.src = "./assets/player.png";
        image.onload = () => {
            const scale = .03;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.hp = PLAYER_HP;
            this.position = {
                x: (canvas.width / 2) - (this.width / 2),
                y: canvas.height - this.height - 20
            }
        }
    }

    draw() {
        if (!this.image) return;
        c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
    }

    update() {
        if (this.image) {
            this.draw();
            this.position.x += this.velocity.x;

            if (this.position.x < 0) {
                this.position.x = 0;
            } else if (this.position.x + this.width > canvas.width) {
                this.position.x = canvas.width - this.width;
            }
        }
    }
}

class Projectile {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 5;
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'pink';
        c.fill();
        c.closePath();
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Invader {
    constructor({ text = "INVADER", position = { x: canvas.width / 2, y: 0 }, hp = 3 }) {
        this.velocity = {
            x: 0,
            y: 1
        };

        this.text = text;
        this.fontSize = 20;
        this.hp = hp;
        this.position = {
            x: position.x,
            y: position.y
        };

        const metrics = c.measureText(this.text);
        this.width = metrics.width;
        this.height = this.fontSize;
    }

    draw() {
        c.font = `${this.fontSize}px Arial`;
        c.fillStyle = 'white';
        c.fillText(this.text, this.position.x, this.position.y);
    }

    update() {
        this.draw();
        this.position.y += this.velocity.y;
    }

    isHit(projectile) {
        const textHeight = this.fontSize;
        const textTop = this.position.y - textHeight;

        return (
            projectile.position.x > this.position.x &&
            projectile.position.x < this.position.x + this.width &&
            projectile.position.y > textTop &&
            projectile.position.y < this.position.y
        );
    }
}


const invaders = [];
const projectiles = [];
let termDefInvaders = new Map();

// START SCREEN OPTIMIZATION
function parseInputData(text) {
    return new Map(
        text.trim().split('\n').map(line => {
            const [term, definition] = line.split('\t');
            return [term?.trim(), definition?.trim()];
        }).filter(([term, def]) => term && def)
    );
}

document.getElementById('startButton').addEventListener('click', () => {
    const textInput = document.getElementById('textInput').value.trim();

    if (textInput.length > 0) {
        termDefInvaders = parseInputData(textInput);
        startGame();
    } else {
        alert('Please paste text or upload a file.');
    }
});

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        document.getElementById('textInput').value = text; // preview in textarea
    };
    reader.readAsText(file);
});

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameStarted = true;
    const terms = Array.from(termDefInvaders.keys());

    setInterval(() => {
        if (!gameStarted || terms.length === 0) return;

        const term = terms[Math.floor(Math.random() * terms.length)];
        const x = Math.random() * (canvas.width - 150);
        invaders.push(new Invader({
            text: term,
            position: {x, y: -20}
        }));
    }, 1700); // every 1.7 seconds [temp value; later make it so if you destroy a term, new ones spawn]

}

// END OF START SCREEN

const player = new Player();

function animate() {
    window.requestAnimationFrame(animate);

    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        // Title:
        c.fillStyle = 'white';
        c.font = '60px "Pixelify Sans"';
        c.textAlign = 'center';
        c.fillText('QuizInvaders', canvas.width / 2, canvas.height / 2 - 60);

        // Subtitle: "Press ENTER to Start"
        c.font = '30px Arial';
        c.fillText('Press ENTER to Start', canvas.width / 2, canvas.height / 2 + 20);
        // c.fillStyle = 'white';
        // c.font = '40px Arial';
        // c.textAlign = 'center';
        // c.fillText('Press ENTER to Start', canvas.width / 2, canvas.height / 2);
        return;
    }

    player.update();

    // INVADERS
    invaders.forEach((invader, index) => {
        invader.update();

        // Remove if off screen
        if (invader.position.y > canvas.height) {
            invaders.splice(index, 1);
        }
    });


    // PROJECTILES
    projectiles.forEach((projectile, pIndex) => {
        projectile.update();

        if (projectile.position.y + projectile.radius <= 0) {
            projectiles.splice(pIndex, 1);
            return;
        }

        // Check collision with each invader
        invaders.forEach((invader, iIndex) => {
            if (invader.isHit(projectile)) {
                invader.hp--;

                if (invader.hp <= 0) {
                    invaders.splice(iIndex, 1);
                }

                projectiles.splice(pIndex, 1);
            }
        });
    });

}

animate();

// INPUT: KEYDOWN
window.addEventListener('keydown', ({key}) => {
    if (!gameStarted && key === 'Enter') {
        gameStarted = true;
        return;
    }

    if (!gameStarted) return;

    switch (key) {
        case 'ArrowRight':
            player.velocity.x = SPEED;
            break;
        case 'ArrowLeft':
            player.velocity.x = -SPEED;
            break;
        case 'z':
        case 'Z':
            projectiles.push(new Projectile({
                position: {
                    x: player.position.x + (player.width / 2),
                    y: player.position.y
                },
                velocity: {
                    x: 0,
                    y: -PROJECTILE_SPEED
                }
            }));
            break;
        case 'x':
        case 'X':
            console.log("X: attach");
            break;
    }
});

// INPUT: KEYUP
window.addEventListener('keyup', ({key}) => {
    if (!gameStarted) return;

    switch (key) {
        case 'ArrowRight':
        case 'ArrowLeft':
            player.velocity.x = 0;
            break;
    }
});
