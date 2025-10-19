document.addEventListener('DOMContentLoaded', () => {

    // ==============================
    // 🔹 ELEMENTOS DEL DOM
    // ==============================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const nextLevelButton = document.getElementById('nextLevelButton');
    const timerDisplay = document.getElementById('timer');
    
    const gameControls = document.getElementById('game-controls');
    const postGameOptions = document.getElementById('post-game-options');
    const gameMessage = document.getElementById('game-message');
    const gameSubmessage = document.getElementById('game-submessage');
   
    const ingameInstructionsBtn = document.getElementById('ingame-instructions-btn');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeInstructionsBtn = document.getElementById('close-instructions');

    const gamePreviewOverlay = document.getElementById('gamePreviewOverlay');
    const playGameButton = document.getElementById('playGameButton');
    const ingameUIOverlay = document.querySelector('.ingame-ui-overlay');
    const gameScreen = document.querySelector('.blocka-game-screen');

    // ==============================
    // 🔹 CONFIGURACIÓN DEL JUEGO
    // ==============================
    const IMAGE_BANK = [
        'img/Blocka/foto1.jpg',
        'img/Blocka/foto2.jpg',
        'img/Blocka/foto3.jpg',
        
    ];

    const LEVELS = [
        { level: 1, filter: 'null',  rows: 2, cols: 2 }, 
        { level: 2, filter: 'brightness',  rows: 3, cols: 3 }, 
        { level: 3, filter: 'grayscale', rows: 4, cols: 4 }, 
        { level: 4, filter: 'negative',   rows: 5, cols: 5 }
    ];

    let currentLevel = 1;
    let image = null;
    let pieces = [];
    let seconds = 0;
    let timerInterval = null;
    let isGameActive = false;

    // ==============================
    //  FUNCIONES DEL JUEGO
    // ==============================
function startGame(level) {
    const config = LEVELS.find(l => l.level === level);
    if (!config) {
        winGame();
        return;
    }

    isGameActive = true;
    gameControls.classList.add('hidden');
    postGameOptions.style.display = 'none';
    canvas.style.display = 'block';
    ingameUIOverlay.style.display = 'block';
    gameScreen.classList.add('game-active-bg');
    loadImageAndStart(config);
}

   function loadImageAndStart(config) {
    const randomIndex = Math.floor(Math.random() * IMAGE_BANK.length);
    const imageUrl = IMAGE_BANK[randomIndex];

    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    img.onload = () => {
        image = img; 
        preparePieces();
        draw(config.filter);
        startTimer();
    };

    // Es una buena práctica manejar también los errores de carga
    img.onerror = () => {
        console.error(`No se pudo cargar la imagen: ${imageUrl}`);
        alert("Hubo un error al cargar la imagen del nivel. Por favor, intenta de nuevo.");
    };
    img.src = imageUrl;
}

    function draw(filter = null) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(piece => {
            ctx.save();
            ctx.translate(piece.dx + piece.dw / 2, piece.dy + piece.dh / 2);
            ctx.rotate((piece.rotation * Math.PI) / 180);
            ctx.drawImage(
                image,
                piece.sx, piece.sy, piece.sw, piece.sh,
                -piece.dw / 2, -piece.dh / 2, piece.dw, piece.dh
            );
            ctx.restore();
        });

        if (filter && isGameActive) {
            applyFilter(filter);
        }
    }

    function preparePieces() {
        pieces = [];
        const config = LEVELS.find(l => l.level === currentLevel);
        const { rows, cols } = config;

        const pieceWidth = canvas.width / cols;
        const pieceHeight = canvas.height / rows;
        const sourcePieceWidth = image.width / cols;
        const sourcePieceHeight = image.height / rows;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const rotation = [90, 180, 270][Math.floor(Math.random() * 3)];
                
                pieces.push({
                    sx: col * sourcePieceWidth,
                    sy: row * sourcePieceHeight,
                    sw: sourcePieceWidth,
                    sh: sourcePieceHeight,
                    dx: col * pieceWidth,
                    dy: row * pieceHeight,
                    dw: pieceWidth,
                    dh: pieceHeight,
                    rotation
                });
            }
        }
    }

    function rotatePiece(x, y, direction) {
        if (!isGameActive) return;

        const piece = pieces.find(p => 
            x >= p.dx && x < p.dx + p.dw &&
            y >= p.dy && y < p.dy + p.dh
        );

        if (!piece) return;

        const config = LEVELS.find(l => l.level === currentLevel);
        piece.rotation = (piece.rotation + direction + 360) % 360;
        draw(config.filter);
        checkWin();
    }

    function checkWin() {
       const allCorrect = pieces.every(p => p.rotation === 0);

    if (allCorrect) {
        isGameActive = false;
        stopTimer();
        ingameUIOverlay.style.display = 'none';
        draw();
        
        setTimeout(() => {
            
           gameMessage.textContent = `¡Nivel ${currentLevel} Superado!`;
            gameSubmessage.textContent = `Tu tiempo: ${timerDisplay.textContent}`;

            startButton.style.display = 'none';
            gameControls.classList.remove('hidden');
            postGameOptions.style.display = 'flex';
            postGameOptions.style.flexDirection = 'column';
            currentLevel++;
            if (currentLevel > LEVELS.length) {
                nextLevelButton.textContent = "Jugar de Nuevo";
            } else {
                nextLevelButton.textContent = `Siguiente Nivel (${currentLevel})`;
            }
        }, 500);
        }
    }

   function winGame() {
    gameScreen.classList.remove('game-active-bg');
    canvas.style.display = 'none';
    ingameUIOverlay.style.display = 'none';
    startButton.style.display = 'none'; 
    gameMessage.textContent = "¡Felicidades, has completado el juego!";
    gameSubmessage.textContent = "¡Gracias por jugar!";
    gameControls.classList.remove('hidden');
    postGameOptions.style.display = 'flex';
    nextLevelButton.textContent = "Jugar de Nuevo";
    currentLevel = 1;
}
    //    FILTROS
    // ============
    function applyFilter(filterName) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            switch (filterName) {
                case 'grayscale':
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                    break;
                case 'negative':
                    data[i] = 255 - r;
                    data[i + 1] = 255 - g;
                    data[i + 2] = 255 - b;
                    break;
                case 'brightness':
                    const factor = 1.3; 
                    data[i] = Math.min(255, r * factor);
                    data[i + 1] = Math.min(255, g * factor);
                    data[i + 2] = Math.min(255, b * factor);
                    break;
                }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    // ==============================
    // TEMPORIZADOR
    // ==============================
    function startTimer() {
        stopTimer();
        seconds = 0;
        timerDisplay.textContent = "00:00";
        timerInterval = setInterval(() => {
            seconds++;
            const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
            const segsRest = (seconds % 60).toString().padStart(2, '0');
            timerDisplay.textContent = `${minutes}:${segsRest}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // ==============================
    // EVENTOS
    // ==============================
    playGameButton.addEventListener('click', () => {
        gamePreviewOverlay.classList.add('hidden');
        gameControls.classList.remove('hidden');
        gameScreen.classList.add('game-active-bg');
    });

    startButton.addEventListener('click', () => startGame(currentLevel));
    
    nextLevelButton.addEventListener('click', () => {
        if (currentLevel > LEVELS.length) {
            currentLevel = 1; 
        }
        gameControls.classList.add('hidden');
        startGame(currentLevel);
    });

    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        rotatePiece(canvasX, canvasY, -90);
    });

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;
        rotatePiece(canvasX, canvasY, 90);
    });
    
    ingameInstructionsBtn.addEventListener('click', () => { 
        instructionsModal.style.display = 'flex';
    });
    closeInstructionsBtn.addEventListener('click', () => {
        instructionsModal.style.display = 'none';
    });
    instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) { 
            instructionsModal.style.display = 'none';
        }
    });
});