const canvas = document.querySelector("canvas");
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const SPEED = 7;
const PROJECTILE_SPEED = 8;

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
        this.radius = 3;
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
    constructor() {
        this.velocity = {
            x: 0,
            y: 0
        };

        this.text = "INVADER";
        this.fontSize = 20;
        this.width = this.fontSize;
        this.height = this.fontSize;
        this.position = {
            x: (canvas.width / 2) - (this.width / 2),
            y: canvas.height / 2
        };
    }

    draw() {
        c.font = `${this.fontSize}px Arial`;
        c.fillStyle = 'white';
        c.fillText(this.text, this.position.x, this.position.y);
    }

    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Clamp to canvas
        if (this.position.x < 0) {
            this.position.x = 0;
        } else if (this.position.x + this.width > canvas.width) {
            this.position.x = canvas.width - this.width;
        }
    }
}

class Grid {
    constructor() {
        this.position = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.invaders = [new Invader()];
    }

    update() {
        // Placeholder for future use
    }
}

const projectiles = [];

const rawData = 'Almorzar (o:ue)\tTo have lunch\n' +
    'Cerrar (e:ie)\tTo close\n' +
    'Comenzar (e:ie)\tto begin\n';

const termDefInvaders = new Map(
    rawData
        .trim()
        .split('\n')
        .map(line => {
            const [term, definition] = line.split('\t');
            return [term.trim(), definition.trim()];
        })
);

const player = new Player();

function animate() {
    window.requestAnimationFrame(animate);

    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        // Startup screen
        c.fillStyle = 'white';
        c.font = '40px Arial';
        c.textAlign = 'center';
        c.fillText('Press ENTER to Start', canvas.width / 2, canvas.height / 2);
        return;
    }

    player.update();

    // PROJECTILES
    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.radius <= 0) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        } else {
            projectile.update();
        }
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
