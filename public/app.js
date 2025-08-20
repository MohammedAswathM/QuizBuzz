let questions = [];
let currentQ = 0;
let score = 0;
let playerName = '';
let timer, timeLeft;


const startScreen = document.getElementById('screen-start');
const quizScreen = document.getElementById('screen-quiz');
const resultsScreen = document.getElementById('screen-results');

const btnStart = document.getElementById('btnStart');
const btnNext = document.getElementById('btnNext');
const btnRestart = document.getElementById('btnRestart');

const qNum = document.getElementById('qNum');
const qTotal = document.getElementById('qTotal');
const qText = document.getElementById('question');
const optionsDiv = document.getElementById('options');
const timerText = document.getElementById('timerText');
const timeBar = document.getElementById('timeBar');
const scoreChip = document.getElementById('score');
const finalScore = document.getElementById('finalScore');
const leaderboardList = document.getElementById('leaderboard');

btnStart.addEventListener('click', async () => {
  playerName = document.getElementById('playerName').value.trim();
  if (!playerName) return alert('Enter your name!');

  const res = await fetch('/api/questions');
  const data = await res.json();
  questions = data.questions;   // ✅ unwrap the array
  qTotal.textContent = questions.length;

  currentQ = 0;
  score = 0;
  switchScreen(startScreen, quizScreen);
  loadQuestion();
});


btnNext.addEventListener('click', () => {
  currentQ++;
  if (currentQ < questions.length) {
    loadQuestion();
  } else {
    endQuiz();
  }
});


btnRestart.addEventListener('click', () => {
  window.location.reload();
});


function switchScreen(hide, show) {
  hide.classList.remove('active');
  show.classList.add('active');
}

function loadQuestion() {
  clearInterval(timer);
  timeLeft = 15;
  btnNext.disabled = true;
  qNum.textContent = currentQ + 1;
  qText.textContent = questions[currentQ].question;
  optionsDiv.innerHTML = '';
  questions[currentQ].options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-secondary w-100';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(i);
    const col = document.createElement('div');
    col.className = 'col-6';
    col.appendChild(btn);
    optionsDiv.appendChild(col);
  });
  updateTimer();
  timer = setInterval(updateTimer, 1000);
}

function selectAnswer(idx) {
  clearInterval(timer);
  const correct = questions[currentQ].answerIndex;
  const buttons = optionsDiv.querySelectorAll('button');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i == correct) btn.classList.add('btn-success');
    if (i === idx && i != correct) btn.classList.add('btn-danger');
  });
  if (idx == correct) {
    score += 100;
    scoreChip.textContent = score;
  }
  btnNext.disabled = false;
}

function updateTimer() {
  timerText.textContent = timeLeft;
  timeBar.style.width = (timeLeft / 15) * 100 + '%';
  if (timeLeft <= 0) {
    clearInterval(timer);
    btnNext.disabled = false;
  }
  timeLeft--;
}

async function endQuiz() {
  switchScreen(quizScreen, resultsScreen);
  finalScore.textContent = `${playerName}, you scored ${score} points!`;

  await fetch('/api/score', {    // ✅ corrected endpoint
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: playerName, score, timeMs: 0 })
  });

  const res = await fetch('/api/leaderboard');
  const data = await res.json();
  const leaderboard = data.top;   // ✅ unwrap top[]

  leaderboardList.innerHTML = leaderboard
    .map((entry, i) => `<li class="list-group-item">${i + 1}. ${entry.name} - ${entry.score}</li>`)
    .join('');
}

