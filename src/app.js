const $circle = document.querySelector('#circle');
const $score = document.querySelector('#score');
const $boost = document.querySelector('#boost');
const $boostScore = document.querySelector('#boost-score');
const $energyScore = document.querySelector('#energy-score');

let boostActive = false;
let boostTimer;
let attempts = 3; // Изначально 3 попытки
let lastAttemptTime = Date.now(); // Время последней попытки
let energy = 1000; // Начальная энергия
const MAX_ENERGY = 1000;

const ENERGY_RESTORE_INTERVAL = 10 * 60 * 1000; // 10 минут в миллисекундах
const RESTORE_AMOUNT = 1;
const INTERVAL = ENERGY_RESTORE_INTERVAL / MAX_ENERGY; // Время восстановления одной единицы энергии в миллисекундах

// Начальная функция
function start() {
    if (!localStorage.getItem('attempts')) {
        attempts = 3;
        lastAttemptTime = Date.now();
        energy = MAX_ENERGY;
        saveAttemptsToStorage();
    } else {
        loadAttemptsFromStorage();
    }

    updateBoostScore();
    updateEnergyScore();
    setScore(getScore());
    setImage();
    restoreAttempts();
    restoreEnergy();
}

// Установка счёта
function setScore(score) {
    localStorage.setItem('score', score);
    $score.textContent = score;
}

// Установка изображения в зависимости от очков
function setImage() {
    if (getScore() >= 200) {
        $circle.setAttribute('src', './assets/rabbit.png');
    }
    if (getScore() >= 500) {
        $circle.setAttribute('src', './assets/cat.png');
    }
    if (getScore() >= 1000) {
        $circle.setAttribute('src', './assets/dog.png');
    }
    if (getScore() >= 2000) {
        $circle.setAttribute('src', './assets/fox.png');
    }
    if (getScore() >= 3000) {
        $circle.setAttribute('src', './assets/panda.png');
    }
}

// Получение текущего счёта
function getScore() {
    return Number(localStorage.getItem('score')) || 0;
}

// Добавление очков
function addScore(amount) {
    setScore(getScore() + amount);
    setImage();
}

// Обновление счётчика попыток буста
function updateBoostScore() {
    $boostScore.textContent = `${attempts}/3`;
}

// Обновление счётчика энергии
function updateEnergyScore() {
    $energyScore.textContent = `${energy}/${MAX_ENERGY}`;
    $circle.style.pointerEvents = energy >= 2 ? 'auto' : 'none'; // Деактивировать кнопку при недостатке энергии
    localStorage.setItem('energy', energy);
    localStorage.setItem('lastEnergyUpdate', Date.now()); // Сохраняем время последнего обновления энергии
}

// Сохранение данных в локальное хранилище
function saveAttemptsToStorage() {
    localStorage.setItem('attempts', attempts);
    localStorage.setItem('lastAttemptTime', lastAttemptTime);
    localStorage.setItem('energy', energy);
    localStorage.setItem('lastEnergyUpdate', Date.now()); // Сохраняем текущее время
}

// Загрузка данных из локального хранилища
function loadAttemptsFromStorage() {
    const savedAttempts = Number(localStorage.getItem('attempts'));
    const savedLastAttemptTime = Number(localStorage.getItem('lastAttemptTime'));
    const savedEnergy = Number(localStorage.getItem('energy'));
    const savedLastEnergyUpdate = Number(localStorage.getItem('lastEnergyUpdate'));

    if (!isNaN(savedAttempts)) {
        attempts = savedAttempts;
    }

    if (!isNaN(savedLastAttemptTime)) {
        lastAttemptTime = savedLastAttemptTime;
    }

    if (!isNaN(savedEnergy)) {
        energy = savedEnergy;
    }

    // Восстановление энергии на основе времени
    if (!isNaN(savedLastEnergyUpdate)) {
        const timeSinceLastUpdate = Date.now() - savedLastEnergyUpdate;
        const energyRestored = Math.floor(timeSinceLastUpdate / INTERVAL); // Рассчитываем, сколько энергии должно было восстановиться
        energy = Math.min(MAX_ENERGY, energy + energyRestored); // Восстанавливаем энергию, но не больше MAX_ENERGY
    }
}

// Проверка и восстановление одной попытки каждые 5 минут
function restoreAttempts() {
    const FIVE_MINUTES = 5 * 60 * 1000; // 5 минут в миллисекундах

    if (attempts < 3 && Date.now() - lastAttemptTime >= FIVE_MINUTES) {
        attempts++;
        lastAttemptTime = Date.now();
        saveAttemptsToStorage();
        updateBoostScore();
    }

    setTimeout(restoreAttempts, 60000); // Проверка каждую минуту
}

// Восстановление энергии
function restoreEnergy() {
    function increaseEnergy() {
        if (energy < MAX_ENERGY) {
            energy = Math.min(energy + RESTORE_AMOUNT, MAX_ENERGY);
            updateEnergyScore();
        }
        setTimeout(increaseEnergy, INTERVAL); // Восстановление энергии каждые INTERVAL миллисекунд
    }

    increaseEnergy();
}

// Обработчик нажатия на круг
$circle.addEventListener('click', (event) => {
    if (energy >= 2) {  // Блокируем, если энергии меньше 2
        if (boostActive) {
            addScore(5); // Если буст активен — добавить 5 очков
            energy = Math.max(0, energy - 5); // Уменьшаем энергию на 5, минимальное значение — 0
        } else {
            addScore(1); // Иначе добавить 1 очко
            energy = Math.max(0, energy - 1); // Уменьшаем энергию на 1, минимальное значение — 0
        }

        updateEnergyScore();

        // Tilt-анимация (наклон)
        const rect = $circle.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        const DEG = 40;

        const tiltX = (offsetY / rect.height) * DEG;
        const tiltY = (offsetX / rect.width) * -DEG;

        $circle.style.setProperty('--tiltX', `${tiltX}deg`);
        $circle.style.setProperty('--tiltY', `${tiltY}deg`);

        setTimeout(() => {
            $circle.style.setProperty('--tiltX', '0deg');
            $circle.style.setProperty('--tiltY', '0deg');
        }, 300);

        // Анимация увеличения счета
        const plusOne = document.createElement('div');
        plusOne.classList.add('plus-one');
        plusOne.textContent = boostActive ? '+5' : '+1'; // Если буст активен, показать +5
        plusOne.style.left = `${event.clientX - rect.left}px`;
        plusOne.style.top = `${event.clientY - rect.top}px`;

        $circle.parentElement.appendChild(plusOne);

        setTimeout(() => {
            plusOne.remove();
        }, 2000);
    }
});

// Обработчик нажатия на сюрикен
$boost.addEventListener('click', () => {
    if (attempts > 0 && !boostActive && energy >= 5) { // Сюрикен срабатывает только при энергии >= 5
        boostActive = true;
        $boost.classList.add('rotate'); // Добавляем вращение сюрикена
        attempts--;
        lastAttemptTime = Date.now();
        saveAttemptsToStorage();
        updateBoostScore();

        boostTimer = setTimeout(() => {
            boostActive = false;
            $boost.classList.remove('rotate');
        }, 5000); // Делаем буст активным на 5 секунд
    }
});

// Инициализация игры
start();
