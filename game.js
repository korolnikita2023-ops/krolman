console.log('game.js loaded successfully!');

class PacManGame {
    constructor() {
        console.log('Pac-Man Game v4.0 - Starting...');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.gameRunning = true;
        this.lastTime = 0;
        
        // Размеры игрового поля (как в оригинале)
        this.gridSize = 16;
        this.cols = 28;
        this.rows = 31;
        this.canvas.width = this.cols * this.gridSize;
        this.canvas.height = this.rows * this.gridSize;
        
        // Загрузка изображений
        this.loadImages();
        
        // Инициализация игровых объектов
        this.initGame();
        this.setupControls();
        this.setupEventListeners();
        
        // Запуск игрового цикла
        this.gameLoop();
    }
    
    loadImages() {
        this.images = {};
        const imageFiles = {
            pacman: '../png/packman.png',
            ghost1: '../png/ghost 1.png',
            ghost2: '../png/ghost 2.png',
            ghost3: '../png/ghost 3.png',
            ghost4: '../png/ghost 4.png'
        };
        
        let loadedImages = 0;
        const totalImages = Object.keys(imageFiles).length;
        
        Object.keys(imageFiles).forEach(key => {
            const img = new Image();
            img.onload = () => {
                loadedImages++;
                console.log(`Loaded image: ${key}`);
                if (loadedImages === totalImages) {
                    this.imagesLoaded = true;
                    console.log('All images loaded successfully!');
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${key}`);
            };
            img.src = imageFiles[key];
            this.images[key] = img;
        });
    }
    
    initGame() {
        // Создание классического лабиринта Pac-Man
        this.maze = this.createClassicMaze();
        
        // Создание точек
        this.dots = this.createDots();
        
        // Создание Pac-Man - перемещаем в безопасное место
        this.pacman = {
            x: 14,
            y: 29,
            direction: { x: 0, y: 0 },
            nextDirection: { x: 0, y: 0 },
            mouthAngle: 0,
            mouthDirection: 1,
            speed: 0.15,
            lastMoveTime: 0
        };
        
        // Создание призраков в разных местах лабиринта
        this.ghosts = [
            { x: 13, y: 8, color: '#ff0000', behavior: 'direct', speed: 0.075, lastMoveTime: 0 }, // Blinky - верх
            { x: 5, y: 15, color: '#ffb8ff', behavior: 'ambush', speed: 0.075, lastMoveTime: 0 }, // Pinky - левый бок
            { x: 22, y: 15, color: '#00ffff', behavior: 'complex', speed: 0.075, lastMoveTime: 0 }, // Inky - правый бок
            { x: 14, y: 25, color: '#ffb852', behavior: 'random', speed: 0.075, lastMoveTime: 0 }  // Clyde - низ
        ];
        
        // Настройка призраков с начальными направлениями
        this.ghosts.forEach((ghost, index) => {
            if (index === 0) ghost.direction = { x: 1, y: 0 }; // Вправо
            else if (index === 1) ghost.direction = { x: -1, y: 0 }; // Влево
            else if (index === 2) ghost.direction = { x: 0, y: 1 }; // Вниз
            else ghost.direction = { x: 0, y: -1 }; // Вверх
            ghost.mode = 'chase';
        });
    }
    
    createClassicMaze() {
        // Оригинальная карта Pac-Man из pacman-master проекта
        const mazeData = [
            "____________________________",
            "____________________________",
            "____________________________",
            "||||||||||||||||||||||||||||",
            "|............||............|",
            "|.||||.|||||.||.|||||.||||.|",
            "|o||||.|||||.||.|||||.||||o|",
            "|.||||.|||||.||.|||||.||||.|",
            "|..........................|",
            "|.||||.||.||||||||.||.||||.|",
            "|.||||.||.||||||||.||.||||.|",
            "|......||....||....||......|",
            "||||||.||||| || |||||.||||||",
            "_____|.||||| || |||||.|_____",
            "_____|.||          ||.|_____",
            "_____|.|| |||--||| ||.|_____",
            "||||||.|| |______| ||.||||||",
            "      .   |______|   .      ",
            "||||||.|| |______| ||.||||||",
            "_____|.|| |||||||| ||.|_____",
            "_____|.||          ||.|_____",
            "_____|.|| |||||||| ||.|_____",
            "||||||.|| |||||||| ||.||||||",
            "|............||............|",
            "|.||||.|||||.||.|||||.||||.|",
            "|.||||.|||||.||.|||||.||||.|",
            "|o..||.......  .......||..o|",
            "|||.||.||.||||||||.||.||.|||",
            "|||.||.||.||||||||.||.||.|||",
            "|......||....||....||......|",
            "|.||||||||||.||.||||||||||.|",
            "|.||||||||||.||.||||||||||.|",
            "|..........................|",
            "||||||||||||||||||||||||||||",
            "____________________________",
            "____________________________"
        ];
        
        const maze = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        // Заполняем лабиринт согласно карте
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (y < mazeData.length && x < mazeData[y].length) {
                    const char = mazeData[y][x];
                    if (char === '|' || char === '_') {
                        maze[y][x] = 1; // Стена
                    } else {
                        maze[y][x] = 0; // Проход
                    }
                }
            }
        }
        
        return maze;
    }
    
    createDots() {
        const dots = [];
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 0) {
                    // Размещаем точки везде, кроме стен
                    dots.push({ x, y, eaten: false });
                }
            }
        }
        return dots;
    }
    
    setupControls() {
        this.controls = {
            up: document.getElementById('upBtn'),
            down: document.getElementById('downBtn'),
            left: document.getElementById('leftBtn'),
            right: document.getElementById('rightBtn')
        };
    }
    
    setupEventListeners() {
        // Обработчики кнопок
        this.controls.up.addEventListener('click', () => this.setDirection(0, -1));
        this.controls.down.addEventListener('click', () => this.setDirection(0, 1));
        this.controls.left.addEventListener('click', () => this.setDirection(-1, 0));
        this.controls.right.addEventListener('click', () => this.setDirection(1, 0));
        
        // Обработчики клавиатуры
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp': this.setDirection(0, -1); break;
                case 'ArrowDown': this.setDirection(0, 1); break;
                case 'ArrowLeft': this.setDirection(-1, 0); break;
                case 'ArrowRight': this.setDirection(1, 0); break;
            }
        });
        
        // Кнопка перезапуска
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    setDirection(x, y) {
        this.pacman.nextDirection = { x, y };
    }
    
    updatePacman(currentTime) {
        // Движение с контролируемой скоростью
        if (currentTime - this.pacman.lastMoveTime > 100) {
            // Проверка возможности движения в новом направлении
            const newX = this.pacman.x + this.pacman.nextDirection.x;
            const newY = this.pacman.y + this.pacman.nextDirection.y;
            
            if (this.isValidPosition(newX, newY)) {
                this.pacman.direction = { ...this.pacman.nextDirection };
            }
            
            // Движение в текущем направлении
            const nextX = this.pacman.x + this.pacman.direction.x;
            const nextY = this.pacman.y + this.pacman.direction.y;
            
            if (this.isValidPosition(nextX, nextY)) {
                this.pacman.x = nextX;
                this.pacman.y = nextY;
            }
            
            this.pacman.lastMoveTime = currentTime;
        }
        
        // Анимация рта
        this.pacman.mouthAngle += this.pacman.mouthDirection * 0.2;
        if (this.pacman.mouthAngle > 0.4 || this.pacman.mouthAngle < 0) {
            this.pacman.mouthDirection *= -1;
        }
        
        // Проверка съедания точек
        this.checkDotCollision();
        
        // Проверка туннелей
        this.checkTunnels();
    }
    
    updateGhosts(currentTime) {
        // Призраки начинают двигаться сразу
        this.ghosts.forEach((ghost, index) => {
            if (currentTime - ghost.lastMoveTime > 150) {
                this.updateGhostBehavior(ghost, index);
                ghost.lastMoveTime = currentTime;
            }
        });
    }
    
    updateGhostBehavior(ghost, index) {
        let targetX, targetY;
        
        switch(ghost.behavior) {
            case 'direct':
                // Ghost 1 (Blinky): всегда целится прямо в текущую позицию пакмана
                targetX = this.pacman.x;
                targetY = this.pacman.y;
                break;
                
            case 'ambush':
                // Ghost 2 (Pinky): засада - целится на 4 клетки впереди пакмана
                targetX = this.pacman.x + this.pacman.direction.x * 4;
                targetY = this.pacman.y + this.pacman.direction.y * 4;
                break;
                
            case 'complex':
                // Ghost 3 (Inky): сложная логика - использует позицию пакмана и ghost 1
                const ghost1 = this.ghosts[0];
                const offsetX = this.pacman.x - ghost1.x;
                const offsetY = this.pacman.y - ghost1.y;
                targetX = this.pacman.x + offsetX;
                targetY = this.pacman.y + offsetY;
                break;
                
            case 'random':
                // Ghost 4 (Clyde): убегает в угол если близко, преследует если далеко
                const distance = Math.sqrt(
                    Math.pow(ghost.x - this.pacman.x, 2) + 
                    Math.pow(ghost.y - this.pacman.y, 2)
                );
                
                if (distance < 8) {
                    // Убегает в левый нижний угол если близко
                    targetX = 1;
                    targetY = this.rows - 2;
                } else {
                    // Преследует если далеко
                    targetX = this.pacman.x;
                    targetY = this.pacman.y;
                }
                break;
        }
        
        // Улучшенный алгоритм поиска пути
        const possibleDirections = [
            { x: 0, y: -1 }, { x: 0, y: 1 },
            { x: -1, y: 0 }, { x: 1, y: 0 }
        ];
        
        let bestDirection = null;
        let bestScore = -Infinity;
        
        // Проверяем все возможные направления
        possibleDirections.forEach(dir => {
            const newX = ghost.x + dir.x;
            const newY = ghost.y + dir.y;
            
            if (this.isValidPosition(newX, newY)) {
                // Вычисляем расстояние до цели через эту позицию
                const distanceToTarget = Math.abs(newX - targetX) + Math.abs(newY - targetY);
                const score = -distanceToTarget;
                
                // Предпочитаем движение к цели, а не от неё
                if (score > bestScore) {
                    bestScore = score;
                    bestDirection = dir;
                }
            }
        });
        
        // Если не нашли хорошего направления, используем текущее или случайное
        if (!bestDirection) {
            const validDirections = possibleDirections.filter(dir => {
                const newX = ghost.x + dir.x;
                const newY = ghost.y + dir.y;
                return this.isValidPosition(newX, newY);
            });
            if (validDirections.length > 0) {
                bestDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
            } else {
                bestDirection = ghost.direction;
            }
        }
        
        ghost.direction = bestDirection;
        
        // Движение призрака
        const nextX = ghost.x + ghost.direction.x;
        const nextY = ghost.y + ghost.direction.y;
        
        if (this.isValidPosition(nextX, nextY)) {
            ghost.x = nextX;
            ghost.y = nextY;
            console.log(`Ghost ${index + 1} moved to (${ghost.x}, ${ghost.y})`);
        }
        
        // Проверка туннелей для призраков
        this.checkGhostTunnels(ghost);
    }
    
    isValidPosition(x, y) {
        // Проверка туннелей
        if (y === 14 && (x < 0 || x >= this.cols)) {
            return true;
        }
        return x >= 0 && x < this.cols && y >= 0 && y < this.rows && this.maze[y][x] === 0;
    }
    
    checkTunnels() {
        // Левая сторона
        if (this.pacman.y === 14 && this.pacman.x < 0) {
            this.pacman.x = this.cols - 1;
        }
        // Правая сторона
        else if (this.pacman.y === 14 && this.pacman.x >= this.cols) {
            this.pacman.x = 0;
        }
    }
    
    checkGhostTunnels(ghost) {
        // Левая сторона
        if (ghost.y === 14 && ghost.x < 0) {
            ghost.x = this.cols - 1;
        }
        // Правая сторона
        else if (ghost.y === 14 && ghost.x >= this.cols) {
            ghost.x = 0;
        }
    }
    
    checkDotCollision() {
        this.dots.forEach(dot => {
            if (!dot.eaten && Math.abs(dot.x - this.pacman.x) < 0.5 && Math.abs(dot.y - this.pacman.y) < 0.5) {
                dot.eaten = true;
                this.score += 10;
                document.getElementById('score').textContent = this.score;
            }
        });
    }
    
    checkGhostCollision() {
        return this.ghosts.some(ghost => {
            const distance = Math.sqrt(
                Math.pow(ghost.x - this.pacman.x, 2) + 
                Math.pow(ghost.y - this.pacman.y, 2)
            );
            return distance < 0.8;
        });
    }
    
    drawMaze() {
        this.ctx.fillStyle = '#0066ff';
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 1) {
                    this.ctx.fillRect(
                        x * this.gridSize, 
                        y * this.gridSize, 
                        this.gridSize, 
                        this.gridSize
                    );
                }
            }
        }
    }
    
    drawDots() {
        this.ctx.fillStyle = '#ffffff';
        this.dots.forEach(dot => {
            if (!dot.eaten) {
                this.ctx.beginPath();
                this.ctx.arc(
                    (dot.x + 0.5) * this.gridSize,
                    (dot.y + 0.5) * this.gridSize,
                    2,
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
            }
        });
    }
    
    drawPacman() {
        if (this.imagesLoaded && this.images.pacman) {
            // Используем PNG изображение
            const centerX = (this.pacman.x + 0.5) * this.gridSize;
            const centerY = (this.pacman.y + 0.5) * this.gridSize;
            const size = this.gridSize * 1.2;
            
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            
            // Поворот в зависимости от направления
            if (this.pacman.direction.x === 1) this.ctx.rotate(0);
            else if (this.pacman.direction.x === -1) this.ctx.rotate(Math.PI);
            else if (this.pacman.direction.y === -1) this.ctx.rotate(-Math.PI / 2);
            else if (this.pacman.direction.y === 1) this.ctx.rotate(Math.PI / 2);
            
            this.ctx.drawImage(this.images.pacman, -size/2, -size/2, size, size);
            this.ctx.restore();
        } else {
            // Fallback - рисуем желтый круг
            this.ctx.fillStyle = '#ffff00';
            this.ctx.beginPath();
            
            const centerX = (this.pacman.x + 0.5) * this.gridSize;
            const centerY = (this.pacman.y + 0.5) * this.gridSize;
            const radius = this.gridSize * 0.4;
            
            let mouthAngle = this.pacman.mouthAngle;
            if (this.pacman.direction.x === 1) mouthAngle = 0;
            else if (this.pacman.direction.x === -1) mouthAngle = Math.PI;
            else if (this.pacman.direction.y === -1) mouthAngle = -Math.PI / 2;
            else if (this.pacman.direction.y === 1) mouthAngle = Math.PI / 2;
            
            this.ctx.arc(centerX, centerY, radius, mouthAngle, 2 * Math.PI - mouthAngle);
            this.ctx.lineTo(centerX, centerY);
            this.ctx.fill();
        }
    }
    
    drawGhosts() {
        const ghostImages = ['ghost1', 'ghost2', 'ghost3', 'ghost4'];
        
        this.ghosts.forEach((ghost, index) => {
            if (this.imagesLoaded && this.images[ghostImages[index]]) {
                // Используем PNG изображения призраков
                const centerX = (ghost.x + 0.5) * this.gridSize;
                const centerY = (ghost.y + 0.5) * this.gridSize;
                const size = this.gridSize * 1.2;
                
                this.ctx.drawImage(
                    this.images[ghostImages[index]], 
                    centerX - size/2, 
                    centerY - size/2, 
                    size, 
                    size
                );
            } else {
                // Fallback - рисуем цветные призраки
                this.ctx.fillStyle = ghost.color;
                
                const centerX = (ghost.x + 0.5) * this.gridSize;
                const centerY = (ghost.y + 0.5) * this.gridSize;
                const radius = this.gridSize * 0.4;
                
                // Рисуем тело призрака
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY - radius * 0.3, radius * 0.7, 0, Math.PI, true);
                this.ctx.rect(centerX - radius, centerY - radius * 0.3, radius * 2, radius * 0.8);
                this.ctx.fill();
                
                // Рисуем волнистый низ
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - radius, centerY + radius * 0.5);
                for (let i = 0; i < 4; i++) {
                    const x = centerX - radius + (i * radius * 0.5);
                    this.ctx.quadraticCurveTo(
                        x + radius * 0.25, centerY + radius * 0.8,
                        x + radius * 0.5, centerY + radius * 0.5
                    );
                }
                this.ctx.fill();
                
                // Глаза
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.2, 0, 2 * Math.PI);
                this.ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, radius * 0.2, 0, 2 * Math.PI);
                this.ctx.fill();
                
                // Зрачки
                this.ctx.fillStyle = '#000000';
                this.ctx.beginPath();
                this.ctx.arc(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.1, 0, 2 * Math.PI);
                this.ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, radius * 0.1, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });
    }
    
    draw() {
        // Очистка canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовка игровых объектов
        this.drawMaze();
        this.drawDots();
        this.drawPacman();
        this.drawGhosts();
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning) return;
        
        // Обновление игрового состояния
        this.updatePacman(currentTime);
        this.updateGhosts(currentTime);
        
        // Проверка столкновений
        if (this.checkGhostCollision()) {
            this.gameOver();
            return;
        }
        
        // Отрисовка
        this.draw();
        
        // Следующий кадр
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('gameOverModal').style.display = 'block';
    }
    
    restartGame() {
        this.score = 0;
        document.getElementById('score').textContent = '0';
        document.getElementById('gameOverModal').style.display = 'none';
        this.gameRunning = true;
        this.initGame();
        this.gameLoop();
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM loaded, creating game...');
        new PacManGame();
    } catch (error) {
        console.error('Error creating game:', error);
    }
});
