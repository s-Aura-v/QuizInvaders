const canvas = document.querySelector("canvas");
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const SPEED = 7;
const PROJECTILE_SPEED = 8;
const PLAYER_HP = 3;
const INVADER_HP = 3;

let gameStarted = false;
let gameOver = false;

const invaders = [];
const projectiles = [];
const markProjectiles = [];
const markedTargets = [];
const permanentlyRemoved = new Set();
let termDefInvaders = new Map();

class Player {
    constructor() {
        this.velocity = {x: 0, y: 0};
        const image = new Image();
        image.src = "./assets/player.png";
        image.onload = () => {
            const scale = 0.03;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.hp = PLAYER_HP;
            this.position = {
                x: (canvas.width / 2) - (this.width / 2),
                y: canvas.height - this.height - 20
            };
        };
    }

    draw() {
        if (this.image) {
            c.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
        }
    }

    update() {
        if (this.image) {
            this.draw();
            this.position.x += this.velocity.x;

            if (this.position.x < 0) this.position.x = 0;
            else if (this.position.x + this.width > canvas.width)
                this.position.x = canvas.width - this.width;
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

class MarkProjectile {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 7;
        this.color = 'lime';
    }

    draw() {
        c.beginPath();
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
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
    constructor({text = "INVADER", position = {x: canvas.width / 2, y: 0}, hp = INVADER_HP, isDefinition = false}) {
        this.velocity = {x: 0, y: 1};
        this.text = text;
        this.hp = hp;
        this.isDefinition = isDefinition;
        this.fontSize = 20;
        this.position = position;
        this.isMarked = false;
        this.markColor = null;

        c.font = `${this.fontSize}px Arial`;
        c.textAlign = 'left';
        const metrics = c.measureText(this.text);
        this.width = metrics.width;
        this.height = this.fontSize;
    }

    draw() {
        c.font = `${this.fontSize}px Arial`;
        c.fillStyle = this.isMarked ? this.markColor : 'white';
        c.fillText(this.text, this.position.x, this.position.y);

        if (this.hp < INVADER_HP) {
            c.font = `${this.fontSize}px Arial`;
            c.textAlign = 'left';
            c.fillStyle = this.isMarked ? this.markColor : 'white';
            c.fillText(this.text, this.position.x, this.position.y);
        }

        if (this.isMarked) {
            c.strokeStyle = this.markColor;
            c.lineWidth = 2;
            c.strokeRect(
                this.position.x - 5,
                this.position.y - this.height - 5,
                this.width + 10,
                this.height + 25
            );
        }
    }

    update() {
        this.draw();
        this.position.y += this.velocity.y;
    }

    isHit(projectile) {
        const textTop = this.position.y - this.height;
        return (
            projectile.position.x > this.position.x &&
            projectile.position.x < this.position.x + this.width &&
            projectile.position.y > textTop &&
            projectile.position.y < this.position.y
        );
    }
}

// --- Startup Setup ---
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
        document.getElementById('textInput').value = text;
    };
    reader.readAsText(file);
});

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    gameStarted = true;

    const terms = Array.from(termDefInvaders.keys());
    let currentTermIndex = 0;
    let showTermNext = true;

    setInterval(() => {
        if (!gameStarted || terms.length === 0) return;

        // Cycle through terms in order
        const term = terms[currentTermIndex];
        if (permanentlyRemoved.has(term)) {
            currentTermIndex = (currentTermIndex + 1) % terms.length;
            return;
        }

        const text = showTermNext ? term : termDefInvaders.get(term);
        const isDefinition = !showTermNext;

        if (!text || permanentlyRemoved.has(text)) {
            currentTermIndex = (currentTermIndex + 1) % terms.length;
            showTermNext = true;
            return;
        }

        const x = Math.random() * (canvas.width - 150);

        invaders.push(new Invader({
            text,
            isDefinition,
            position: {x, y: -20}
        }));

        // Alternate between term and definition for the next spawn
        showTermNext = !showTermNext;

        // Only move to next term after showing both term and definition
        if (showTermNext) {
            currentTermIndex = (currentTermIndex + 1) % terms.length;
        }
    }, 1700);
}

// --- Game Setup ---
const player = new Player();

function animate() {
    window.requestAnimationFrame(animate);

    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameStarted) {
        c.fillStyle = 'white';
        c.font = '60px "Pixelify Sans"';
        c.textAlign = 'center';
        c.fillText('QuizInvaders', canvas.width / 2, canvas.height / 2 - 60);

        c.font = '30px Arial';
        c.fillText('Press ENTER to Start', canvas.width / 2, canvas.height / 2 + 20);
        return;
    }

    const allTermsMatched = Array.from(termDefInvaders.keys()).every(term =>
        permanentlyRemoved.has(term) && permanentlyRemoved.has(termDefInvaders.get(term))
    );

    if (allTermsMatched) {
        c.fillStyle = 'white';
        c.font = '60px "Pixelify Sans"';
        c.textAlign = 'center';
        c.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 60);

        c.font = '30px Arial';
        c.fillText('All pairs matched!', canvas.width / 2, canvas.height / 2 + 20);
        c.fillText('Refresh to play again', canvas.width / 2, canvas.height / 2 + 60);
        return;
    }


    player.update();

    // Invaders
    invaders.forEach((invader, index) => {
        invader.update();
        if (invader.position.y > canvas.height) invaders.splice(index, 1);
    });

    // Projectiles (damage)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        projectile.update();

        if (projectile.position.y + projectile.radius <= 0) {
            projectiles.splice(i, 1);
            continue;
        }

        for (let j = invaders.length - 1; j >= 0; j--) {
            const invader = invaders[j];
            if (invader.isHit(projectile)) {
                invader.hp--;
                if (invader.hp <= 0) {
                    invaders.splice(j, 1);
                }
                projectiles.splice(i, 1);
                break;
            }
        }
    }

    // Mark projectiles
    for (let i = markProjectiles.length - 1; i >= 0; i--) {
        const mark = markProjectiles[i];
        mark.update();

        if (mark.position.y + mark.radius <= 0) {
            markProjectiles.splice(i, 1);
            continue;
        }

        for (let j = invaders.length - 1; j >= 0; j--) {
            const invader = invaders[j];
            if (invader.isHit(mark)) {
                invader.isMarked = true;
                invader.markColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
                markedTargets.push(invader);

                if (markedTargets.length === 2) {
                    const [a, b] = markedTargets;
                    const isMatch = (
                        termDefInvaders.get(a.text) === b.text ||
                        termDefInvaders.get(b.text) === a.text
                    );

                    if (isMatch) {
                        permanentlyRemoved.add(a.text);
                        permanentlyRemoved.add(b.text);
                        const indexA = invaders.indexOf(a);
                        if (indexA > -1) invaders.splice(indexA, 1);
                        const indexB = invaders.indexOf(b);
                        if (indexB > -1) invaders.splice(indexB, 1);


                    } else {
                        a.markColor = 'red';
                        b.markColor = 'red';
                        setTimeout(() => {
                            a.isMarked = false;
                            b.isMarked = false;
                        }, 500);
                    }

                    markedTargets.length = 0;

                }

                markProjectiles.splice(i, 1);
                break;
            }
        }
    }
}

// --- Controls ---
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
                velocity: {x: 0, y: -PROJECTILE_SPEED}
            }));
            break;
        case 'x':
        case 'X':
            if (markProjectiles.length < 2) {
                markProjectiles.push(new MarkProjectile({
                    position: {
                        x: player.position.x + (player.width / 2),
                        y: player.position.y
                    },
                    velocity: {x: 0, y: -PROJECTILE_SPEED}
                }));
            }
            break;
    }
});

window.addEventListener('keyup', ({key}) => {
    if (!gameStarted) return;
    if (key === 'ArrowRight' || key === 'ArrowLeft') player.velocity.x = 0;
});

animate();
