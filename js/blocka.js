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
    const helpButton = document.getElementById('helpButton');

    // ==============================
    // 🔹 CONFIGURACIÓN DEL JUEGO
    // ==============================
    const IMAGE_BANK = [
        'img/Blocka/foto1.jpg',
        'img/Blocka/foto2.jpg',
        'img/Blocka/foto3.jpg',
        'img/Blocka/foto4.jpg',
        'img/Blocka/foto5.jpg',
    ];

    const LEVELS = [
        { level: 1, filter:  null, rows: 2, cols: 2, maxTime: 100000 }, 
         { level: 2, filter:  'brigthness' , rows: 2, cols: 2, maxTime: 100000 }, 
          { level: 3, filter:  "grayscale", rows: 2, cols: 2, maxTime: 90 }, 
           { level: 4, filter:  'negative', rows: 2, cols: 2, maxTime: 60 }, 
    ];

    let currentLevel = 1;
    let image = null;
    let pieces = [];
    let seconds = 0;
    let timerInterval = null;
    let isGameActive = false;
    let helpUsedThisLevel = false; 




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
        helpUsedThisLevel = false; 
        helpButton.style.display = 'block'; 
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
        img.onload = () => {
            image = img; 
            preparePieces(img, config.rows, config.cols); 
            draw();
            startTimer();
        };
        img.src = imageUrl;
    }

   function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!isGameActive && image) { 
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            return;
        }

        pieces.forEach(piece => {
            ctx.save();
            ctx.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
            ctx.rotate(piece.rotation * Math.PI / 180);
            ctx.drawImage(
                image, 
                piece.sx, piece.sy, piece.sw, piece.sh,
                -piece.width / 2, -piece.height / 2, piece.width, piece.height
            );

            ctx.restore();
            applyFilter(piece.filter, piece);
        });
    }

   



function preparePieces(img, rows, cols) {
    const pieceWidth = canvas.width / cols;
    const pieceHeight = canvas.height / rows;
    pieces = [];
    const possibleFilters = ["none", "grayscale", "brightness", "negative"];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const rotation = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
            const x = col * pieceWidth;
            const y = row * pieceHeight;

            // asignar filtro
            let filter = "none";
            if (currentLevel >= 4) {
                filter = possibleFilters[Math.floor(Math.random() * possibleFilters.length)];
            } else {
                const levelConfig = LEVELS.find(l => l.level === currentLevel);
                filter = levelConfig.filter || "none";
            }

            pieces.push({
                x: x,
                y: y,
                width: pieceWidth,
                height: pieceHeight,
                sx: col * (img.width / cols),
                sy: row * (img.height / rows),
                sw: img.width / cols,
                sh: img.height / rows,
                rotation: rotation,
                filter: filter
            });
        }
    }
}

  function rotatePiece(x, y, direction) {
    if (!isGameActive) return;
    const piece = pieces.find(p => 
        x >= p.x && x < p.x + p.width &&
        y >= p.y && y < p.y + p.height
    );

    if (!piece || piece.isLocked) return;
    piece.rotation = (piece.rotation + direction + 360) % 360;
    
    draw(); 
    
    checkWin();
}

    function checkWin() {
       const allCorrect = pieces.every(p => p.rotation === 0);

        if (allCorrect) {
            isGameActive = false;
            stopTimer();
            ingameUIOverlay.style.display = 'none';
            helpButton.style.display = 'none';
            pieces.forEach(p => p.isLocked = false); // Limpia foto al final
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
                    gameMessage.textContent = `¡HAS COMPLETADO BLOCKA!`;
                       gameSubmessage.textContent = 'MUCHAS GRACIAS POR JUGAR.';
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
        helpButton.style.display = 'none';
        ingameUIOverlay.style.display = 'none';
        startButton.style.display = 'none'; 
        gameMessage.textContent = "¡Felicidades, has completado el juego!";
        gameSubmessage.textContent = "¡Gracias por jugar!";
        gameControls.classList.remove('hidden');
        postGameOptions.style.display = 'flex';
        nextLevelButton.textContent = "Jugar de Nuevo";
        currentLevel = 1;
    }

    function useHelp() {
        if (!isGameActive || helpUsedThisLevel) return; 

        const incorrectPieces = pieces.filter(p => p.rotation !== 0); // Piezas incorrectas
        if (incorrectPieces.length > 0) {
            helpUsedThisLevel = true;
            helpButton.style.display = 'none'; 
            const pieceToFix = incorrectPieces[Math.floor(Math.random() * incorrectPieces.length)]; // Elige una pieza incorrecta aleatoria
            pieceToFix.rotation = 0; // Arreglar la pieza
            pieceToFix.isLocked = true;
            seconds += 5;
            const config = LEVELS.find(l => l.level === currentLevel); 
            draw(config.filter);
            checkWin();
        }
    }

    //    FILTROS
    // ============
    function applyFilter(filterType, piece) {
    if (filterType === "none") return;
    const imageData = ctx.getImageData(piece.x, piece.y, piece.width, piece.height);
    const data = imageData.data;

    switch (filterType) {
        case "grayscale":
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
            break;

        case "brightness":
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * 1.3);
                data[i + 1] = Math.min(255, data[i + 1] * 1.3);
                data[i + 2] = Math.min(255, data[i + 2] * 1.3);
            }
            break;

        case "negative":
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            break;
    }
    ctx.putImageData(imageData, piece.x, piece.y);
}

    // ==============================
    // TEMPORIZADOR
    // ==============================
   function startTimer() {
    stopTimer();
    seconds = 0;
    timerDisplay.textContent = "00:00";

    const config = LEVELS.find(l => l.level === currentLevel);
    const maxTime = config.maxTime || 9999;

    timerInterval = setInterval(() => {
        seconds++;

        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const segsRest = (seconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${minutes}:${segsRest}`;
        if (seconds >= maxTime && isGameActive) {
            loseLevel();
        }

        if( maxTime - seconds <= 30){
            timerDisplay.style.color = 'red';
        } else {
            timerDisplay.style.color = 'white';
        }

    }, 1000);
}


function loseLevel() {
    isGameActive = false;
    stopTimer();
    ingameUIOverlay.style.display = 'none';
    helpButton.style.display = 'none';
    gameMessage.textContent = ' Has perdido';
    gameSubmessage.textContent = `No lograste completar el nivel en el tiempo solicitado.`;
    gameControls.classList.remove('hidden');
    postGameOptions.style.display = 'flex';
    postGameOptions.style.flexDirection = 'column';
    nextLevelButton.textContent = "Reintentar Nivel";
    nextLevelButton.onclick = () => {
        postGameOptions.style.display = 'none';
        helpUsedThisLevel = false;
        gameControls.classList.add('hidden');
        startGame(currentLevel);
    };
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
    helpButton.addEventListener('click', useHelp);

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