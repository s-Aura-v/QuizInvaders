const canvas = document.querySelector("canvas");
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const SPEED = 7;
const PROJECTILE_SPEED = 8;

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
        // c.fillStyle = 'red'
        // c.fillRect(this.position.x, this.position.y, this.width, this.height);
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
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
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

const projectiles = [];
const invader = new Invader();
const termDefInvaders = new Map();

const player = new Player();
player.update();

function animate() {
    // PLAYER
    window.requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);
    invader.update();
    player.update();

    // PROJECTILES
    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.radius <= 0) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0)
        } else {
            projectile.update();
        }
    })

    // INVADERS

}

animate();

/**
 * MOVING MECHANISMS
 */
// you can instantly access an object event's value by doing ( { method } )
// event.key = ( { key } )
window.addEventListener('keydown', ({key}) => {
    switch (key) {
        // case 'ArrowUp':
        //     console.log("up");
        //     break;
        // case 'ArrowDown':
        //     console.log("down");
        //     break;
        case 'ArrowRight':
            console.log("right");
            player.velocity.x = SPEED;
            break;
        case 'ArrowLeft':
            console.log("left");
            player.velocity.x = -SPEED;
            break;
        case 'z':
        case 'Z':
            console.log("Z: shoot");
            console.log(projectiles)
            projectiles.push(new Projectile(
                {
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
})


window.addEventListener('keyup', ({key}) => {
    switch (key) {
        case 'ArrowRight':
        case 'ArrowLeft':
            player.velocity.x = 0;
            break;
    }
});

// END OF MOVING MECHANICS



