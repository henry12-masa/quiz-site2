const QUESTION_LIMIT = 50;
const state = { currentExam: null, questions: [], index: 0, score: 0, answered: false };

const el = {
  homeView: document.getElementById("homeView"),
  quizView: document.getElementById("quizView"),
  examGrid: document.getElementById("examGrid"),
  totalInfo: document.getElementById("totalInfo"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  backBtn: document.getElementById("backBtn"),
  quizCategory: document.getElementById("quizCategory"),
  quizTitle: document.getElementById("quizTitle"),
  progressText: document.getElementById("progressText"),
  scoreText: document.getElementById("scoreText"),
  progressBar: document.getElementById("progressBar"),
  questionText: document.getElementById("questionText"),
  choices: document.getElementById("choices"),
  explanation: document.getElementById("explanation"),
  nextBtn: document.getElementById("nextBtn"),
  restartBtn: document.getElementById("restartBtn")
};

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function setupCategories() {
  const categories = [...new Set(window.examRegistry.map(e => e.category))].sort();
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    el.categoryFilter.appendChild(option);
  });
}

function renderExamList() {
  const keyword = el.searchInput.value.trim().toLowerCase();
  const category = el.categoryFilter.value;
  const exams = window.examRegistry.filter(exam => {
    const text = `${exam.title} ${exam.category}`.toLowerCase();
    return (!keyword || text.includes(keyword)) && (category === "all" || exam.category === category);
  });

  el.totalInfo.textContent = `${window.examRegistry.length}資格 / ${window.examRegistry.reduce((sum, e) => sum + e.questionCount, 0).toLocaleString()}問`;
  el.examGrid.innerHTML = "";

  exams.forEach(exam => {
    const card = document.createElement("div");
    card.className = "exam-card";
    card.innerHTML = `
      <span class="badge">${exam.category}</span>
      <h3>${exam.title}</h3>
      <p>${exam.questionCount}問からランダム${QUESTION_LIMIT}問を出題</p>
      <button class="primary" data-exam-id="${exam.id}">開始する</button>
    `;
    el.examGrid.appendChild(card);
  });

  el.examGrid.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => startQuiz(btn.dataset.examId));
  });
}

function startQuiz(examId) {
  const exam = window.quizData[examId];
  if (!exam || !exam.questions || exam.questions.length === 0) {
    alert("この資格の問題データが読み込めませんでした。");
    return;
  }
  state.currentExam = exam;
  state.questions = shuffle(exam.questions).slice(0, Math.min(QUESTION_LIMIT, exam.questions.length));
  state.index = 0;
  state.score = 0;
  state.answered = false;
  el.homeView.classList.add("hidden");
  el.quizView.classList.remove("hidden");
  el.quizCategory.textContent = exam.category;
  el.quizTitle.textContent = exam.title;
  el.restartBtn.classList.add("hidden");
  showQuestion();
}

function showQuestion() {
  const q = state.questions[state.index];
  state.answered = false;
  el.nextBtn.classList.add("hidden");
  el.explanation.classList.add("hidden");
  el.explanation.textContent = "";
  el.questionText.textContent = `Q${state.index + 1}. ${q.question}`;
  el.choices.innerHTML = "";

  q.choices.forEach((choice, idx) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.textContent = choice;
    button.addEventListener("click", () => answerQuestion(idx));
    el.choices.appendChild(button);
  });
  updateStatus();
}

function answerQuestion(selectedIndex) {
  if (state.answered) return;
  state.answered = true;
  const q = state.questions[state.index];
  const buttons = [...el.choices.querySelectorAll(".choice")];

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === q.answer) btn.classList.add("correct");
    if (idx === selectedIndex && idx !== q.answer) btn.classList.add("wrong");
  });

  if (selectedIndex === q.answer) state.score++;
  el.explanation.textContent = q.explanation;
  el.explanation.classList.remove("hidden");

  if (state.index < state.questions.length - 1) el.nextBtn.classList.remove("hidden");
  else el.restartBtn.classList.remove("hidden");

  updateStatus();
}

function updateStatus() {
  el.progressText.textContent = `${state.index + 1} / ${state.questions.length}`;
  el.scoreText.textContent = `正解 ${state.score}`;
  el.progressBar.style.width = `${((state.index + 1) / state.questions.length) * 100}%`;
}

el.nextBtn.addEventListener("click", () => { state.index++; showQuestion(); });
el.restartBtn.addEventListener("click", () => startQuiz(state.currentExam.id));
el.backBtn.addEventListener("click", () => { el.quizView.classList.add("hidden"); el.homeView.classList.remove("hidden"); });
el.searchInput.addEventListener("input", renderExamList);
el.categoryFilter.addEventListener("change", renderExamList);

setupCategories();
renderExamList();