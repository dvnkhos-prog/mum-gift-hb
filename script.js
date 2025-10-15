document.addEventListener('DOMContentLoaded', () => {
  const quizData = [
    { question: "Кто произнёс фразу: «Я подумаю об этом завтра»?", answers: ["Скарлетт","Мелани","Ретт","Эшли"], correct:0 },
    { question: "Кто сказал: «Честно говоря, моя дорогая, мне наплевать»?", answers:["Эшли","Ретт","Скарлетт","Мелани"], correct:1 },
    { question: "Имение, где выросла Скарлетт, называлось…", answers:["Тара","Белый дуб","Саванна","Атланта"], correct:0 },
    { question: "Кто был второй женой Ретта Батлера?", answers:["Скарлетт","Белль Уотлинг","Мелани","Он не женился повторно"], correct:3 },
    { question: "В каком городе происходила значительная часть событий романа?", answers:["Чарльстон","Саванна","Атланта","Ричмонд"], correct:2 }
  ];

  // Элементы DOM
  const startScreen = document.getElementById('start-screen');
  const startBtn = document.getElementById('start-btn');
  const quizBlock = document.getElementById('quiz-block');
  const quizContainer = document.getElementById('quiz-container');
  const resultEl = document.getElementById('result');
  const finalBlock = document.getElementById('final-block');
  const envelope = document.getElementById('envelope');
  const letter = document.getElementById('letter');
  const continueBtn = document.getElementById('continue-btn');
  const personalScreen = document.getElementById('personal-screen');
  const galleryBtn = document.getElementById('gallery-btn');
  const galleryScreen = document.getElementById('gallery-screen');
  const taraTheme = document.getElementById('tara-theme');

  // состояние приложения
  const appState = {
    currentQuestion: 0,
    score: 0,
    userName: '',
    letterOpened: false,
    audioStarted: false
  };

  // Менеджер звуков
  class AudioManager {
    constructor() {
      this.sounds = {
        page: document.getElementById('sfx-page'),
        bell: document.getElementById('sfx-bell'),
        pen: document.getElementById('sfx-pen')
      };
    }

    play(soundName, volume = 0.4) {
      const sound = this.sounds[soundName];
      if (sound) {
        sound.volume = volume;
        sound.currentTime = 0;
        sound.play().catch(err => console.warn(`Can't play ${soundName}:`, err));
      }
    }
  }

  // Галерея
  class FullscreenGallery {
    constructor() {
      this.fullscreen = document.getElementById('photoFullscreen');
      this.fullscreenImg = document.getElementById('fullscreenPhoto');
      this.closeBtn = this.fullscreen.querySelector('.close-btn');
      this.init();
    }

    init() {
      document.addEventListener('click', (e) => {
        if (e.target.matches('.photo-card img')) {
          this.open(e.target);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.target.matches('.photo-card img') && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          this.open(e.target);
        }
      });

      // закрытие по клику на фон
      this.fullscreen.addEventListener('click', (e) => {
        if (e.target === this.fullscreen) {
          this.close();
        }
      });

      // закрытие крестиком
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.close();
        });
      }

      // по Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.fullscreen.classList.contains('active')) {
          this.close();
        }
      });
    }

    open(img) {
      this.fullscreenImg.src = img.src;
      this.fullscreenImg.alt = img.alt;
      this.fullscreen.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.fullscreen.setAttribute('aria-hidden', 'false');
      document.querySelector('main').setAttribute('aria-hidden', 'true');
    }

    close() {
      this.fullscreen.classList.remove('active');
      document.body.style.overflow = '';
      this.fullscreen.setAttribute('aria-hidden', 'true');
      document.querySelector('main').setAttribute('aria-hidden', 'false');
    }
  }

  const audioManager = new AudioManager();
  const gallery = new FullscreenGallery();

  // функции приложения
  function sanitizeName(name) {
    return name.trim().replace(/[<>]/g, '').substring(0, 50);
  }

  function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('visible');
    setTimeout(() => {
      fromScreen.classList.add('hidden');
      toScreen.classList.remove('hidden');
      setTimeout(() => toScreen.classList.add('visible'), 50);
    }, 500);
  }

  function loadQuestion() {
    const q = quizData[appState.currentQuestion];
    const progress = ((appState.currentQuestion) / quizData.length * 100).toFixed(0);
    
    quizContainer.innerHTML = `
      <div class="quiz-progress" aria-label="Прогресс: вопрос ${appState.currentQuestion + 1} из ${quizData.length}">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="progress-text">${appState.currentQuestion + 1}/${quizData.length}</span>
      </div>
      <div class="question" aria-live="polite">${q.question}</div>
      <div class="answers" role="group" aria-label="Варианты ответов">
        ${q.answers.map((a, i) => `
          <button data-i="${i}" role="radio" aria-checked="false" tabindex="0">${a}</button>
        `).join('')}
      </div>
    `;
  }

  function startQuiz() {
    const input = document.getElementById('username');
    const rawName = (input.value || '').trim();
    
    if (!rawName) {
      input.style.borderColor = 'var(--color-error)';
      input.placeholder = 'Пожалуйста, введите имя';
      input.classList.add('error');
      setTimeout(() => input.classList.remove('error'), 500);
      return;
    }

    appState.userName = sanitizeName(rawName);
    switchScreen(startScreen, quizBlock);
    loadQuestion();
  }

  function checkAnswer(selectedIndex) {
    const q = quizData[appState.currentQuestion];
    const buttons = quizContainer.querySelectorAll('button');
    
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      btn.setAttribute('aria-checked', 'true');
      
      if (idx === q.correct) {
        btn.classList.add('correct');
        btn.setAttribute('aria-label', `${btn.textContent} - правильный ответ`);
      } else if (idx === selectedIndex) {
        btn.classList.add('wrong');
        btn.setAttribute('aria-label', `${btn.textContent} - неправильный ответ`);
      }
    });

    if (selectedIndex === q.correct) {
      appState.score++;
      audioManager.play('bell', 0.3);
    }

    setTimeout(() => {
      appState.currentQuestion++;
      appState.currentQuestion < quizData.length ? loadQuestion() : showResult();
    }, 1500);
  }

  function showResult() {
    quizContainer.innerHTML = '';
    resultEl.textContent = `${appState.userName}, ты угадала ${appState.score} из ${quizData.length}!`;
    resultEl.classList.remove('hidden');
    audioManager.play('bell');
    setTimeout(() => switchScreen(quizBlock, finalBlock), 1000);
  }

  function toggleLetter() {
    if (appState.letterOpened) {
      letter.style.display = 'none';
      continueBtn.style.display = 'none';
      appState.letterOpened = false;
      envelope.setAttribute('aria-label', 'Открыть письмо от Скарлетт О\'Хара');
    } else {
      letter.style.display = 'block';
      continueBtn.style.display = 'inline-block';
      appState.letterOpened = true;
      envelope.setAttribute('aria-label', 'Закрыть письмо');
      audioManager.play('page');
      audioManager.play('pen');
    }
  }

  function goToPersonal() {
    switchScreen(finalBlock, personalScreen);
  }

  function showGallery() {
    switchScreen(personalScreen, galleryScreen);
  }

  // запуск музыки и викторины
  startBtn.addEventListener('click', () => {
    if (taraTheme && !appState.audioStarted) {
      taraTheme.loop = true;
      taraTheme.volume = 0.05;
      taraTheme.play().then(() => {
        appState.audioStarted = true;
        let v = 0.05;
        const fade = setInterval(() => {
          v += 0.02;
          taraTheme.volume = Math.min(v, 0.4);
          if (v >= 0.4) clearInterval(fade);
        }, 100);
      }).catch(err => console.warn('Music blocked:', err));
    }
    startQuiz();
  });

  envelope.addEventListener('click', toggleLetter);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleLetter();
    }
  });

  continueBtn.addEventListener('click', goToPersonal);
  galleryBtn.addEventListener('click', showGallery);

  quizContainer.addEventListener('click', (e) => {
    if (e.target.matches('.answers button')) {
      checkAnswer(+e.target.dataset.i);
    }
  });

  document.addEventListener('keydown', e => { 
    if (e.key === 'Enter' && document.activeElement.id === 'username') startQuiz();
  });

  document.getElementById('username').addEventListener('input', function() {
    this.style.borderColor = '';
    this.placeholder = 'Ваше имя';
  });
});
/* --- Анимация падающих лепестков (добавить в конец script.js) --- */

function createPetals(count = 40, duration = 5000) {
  // если уже есть оверлей — удалим старый
  const existing = document.querySelector('.petal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'petal-overlay';
  // добавим контейнер (который использует CSS .petal-overlay)
  document.body.appendChild(overlay);

  // создаём цитату (появится в центре)
  const quote = document.createElement('div');
  quote.className = 'petal-quote';
  quote.innerText = '«В конце концов… завтра будет новый день.»';
  overlay.appendChild(quote);

  // размер окна для расчётов
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';

    // случайно красная или розовая
    if (Math.random() < 0.5) petal.classList.add('pink');

    // size variant
    const r = Math.random();
    if (r < 0.12) petal.classList.add('big');
    else if (r < 0.33) petal.classList.add('small');

    // random starting horizontal position (в пределах ширины)
    const startX = Math.random() * vw;
    // end X — слегка сдвинется влево или вправо
    const endX = startX + (Math.random() * 300 - 150);

    // random Z (глубина) и rotations
    const tz = 50 + Math.floor(Math.random() * 350); // translateZ
    const rx = (-30 + Math.random() * 60).toFixed(1) + 'deg';
    const ry = (-20 + Math.random() * 40).toFixed(1) + 'deg';
    const rz = Math.floor(Math.random() * 360) + 'deg';

    // duration и delay (добавляют хаоса)
    const dur = duration + Math.floor(Math.random() * 2500) - 800; // ms
    const delay = Math.floor(Math.random() * 800); // ms

    // задаём CSS-переменные для ключевых кадров
    petal.style.setProperty('--start-x', `${startX}px`);
    petal.style.setProperty('--end-x', `${endX}px`);
    petal.style.setProperty('--tz', `${tz}px`);
    petal.style.setProperty('--rx', rx);
    petal.style.setProperty('--ry', ry);
    petal.style.setProperty('--rz', rz);

    // комбинируем анимации: petal-fall (линейная) + spin + sway
    petal.style.animationDuration = `${(dur/1000).toFixed(2)}s, ${(2 + Math.random()*2).toFixed(2)}s, ${(3 + Math.random()*2).toFixed(2)}s`;
    petal.style.animationDelay = `${(delay/1000).toFixed(2)}s, ${(delay/1400).toFixed(2)}s, ${(delay/1200).toFixed(2)}s`;
    petal.style.left = `${startX}px`;
    // чуть рандомим начальную вертикальную позицию (немного выше экрана)
    petal.style.top = `${-20 - Math.random() * 60}px`;

    overlay.appendChild(petal);
  }

  // убрать overlay по завершении (даём запас — duration + 1.5s)
  setTimeout(() => {
    overlay.classList.add('ending');
    // плавно удаляем
    overlay.remove();
  }, duration + 1600);
}

/* Привяжем к кнопке завершения (если есть элемент с id="final-button") */
const finalBtn = document.getElementById('final-button');
if (finalBtn) {
  finalBtn.addEventListener('click', (e) => {
    // если нужно — отключаем прокрутку на время показа
    document.body.style.overflow = 'hidden';
    createPetals(48, 5600); // 48 лепестков, ~5.6s падения
    // восстановим прокрутку через 6s
    setTimeout(()=> { document.body.style.overflow = ''; }, 6200);
  });
}
