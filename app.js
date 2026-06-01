const chapters = window.DDIA_CHAPTERS || [];
const storageKey = "ddia-learning-state-v1";
let state = loadState();
let activeChapterId = state.activeChapterId || chapters[0].id;
let activeView = "notes";
let notesCache = {};
let currentQuizIndex = 0;
let currentCardIndex = 0;
let flashcardFlipped = false;

const els = {
  chapterNav: document.getElementById("chapterNav"),
  chapterTitle: document.getElementById("chapterTitle"),
  chapterProgressText: document.getElementById("chapterProgressText"),
  chapterProgressBar: document.getElementById("chapterProgressBar"),
  notesContent: document.getElementById("notesContent"),
  searchInput: document.getElementById("searchInput"),
  markRevisedBtn: document.getElementById("markRevisedBtn"),
  statusBanner: document.getElementById("statusBanner"),
  flashcard: document.getElementById("flashcard"),
  flashcardCount: document.getElementById("flashcardCount"),
  flashcardPrompt: document.getElementById("flashcardPrompt"),
  flashcardAnswer: document.getElementById("flashcardAnswer"),
  quizPanel: document.getElementById("quizPanel"),
  weakAreas: document.getElementById("weakAreas"),
  cheatSheet: document.getElementById("cheatSheet"),
  resetQuizBtn: document.getElementById("resetQuizBtn"),
  resetFlashcardsBtn: document.getElementById("resetFlashcardsBtn")
};

init();

function init() {
  renderChapterNav();
  bindEvents();
  setActiveChapter(activeChapterId);
}

function bindEvents() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setActiveView(tab.dataset.view));
  });

  els.searchInput.addEventListener("input", () => renderNotes());
  els.markRevisedBtn.addEventListener("click", markChapterRevised);
  els.flashcard.addEventListener("click", flipFlashcard);
  els.flashcard.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flipFlashcard();
    }
  });

  document.querySelectorAll(".rating-row button").forEach((button) => {
    button.addEventListener("click", () => rateFlashcard(button.dataset.rating));
  });

  els.resetQuizBtn.addEventListener("click", resetQuiz);
  els.resetFlashcardsBtn.addEventListener("click", resetFlashcards);
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function getChapter() {
  return chapters.find((chapter) => chapter.id === activeChapterId) || chapters[0];
}

function getChapterState(chapterId = activeChapterId) {
  state.chapters ||= {};
  state.chapters[chapterId] ||= {
    revised: false,
    quizCorrect: 0,
    quizAnswered: 0,
    flashcardsReviewed: 0,
    ratings: {}
  };
  return state.chapters[chapterId];
}

function chapterProgress(chapterId) {
  const chapter = chapters.find((item) => item.id === chapterId);
  const chapterState = getChapterState(chapterId);
  const revisedScore = chapterState.revised ? 40 : 0;
  const quizScore = chapter.questions.length
    ? Math.min(35, (chapterState.quizAnswered / chapter.questions.length) * 35)
    : 0;
  const cardScore = chapter.flashcards.length
    ? Math.min(25, (chapterState.flashcardsReviewed / chapter.flashcards.length) * 25)
    : 0;
  return Math.round(revisedScore + quizScore + cardScore);
}

function renderChapterNav() {
  els.chapterNav.innerHTML = chapters
    .map((chapter) => {
      const progress = chapterProgress(chapter.id);
      const active = chapter.id === activeChapterId ? "active" : "";
      return `
        <button class="chapter-button ${active}" data-chapter="${chapter.id}" type="button">
          <strong>${escapeHtml(chapter.title)}</strong>
          <span>${escapeHtml(chapter.subtitle)}</span>
          <div class="mini-track"><div class="mini-bar" style="width:${progress}%"></div></div>
        </button>
      `;
    })
    .join("");

  document.querySelectorAll(".chapter-button").forEach((button) => {
    button.addEventListener("click", () => setActiveChapter(button.dataset.chapter));
  });
}

async function setActiveChapter(chapterId) {
  activeChapterId = chapterId;
  state.activeChapterId = chapterId;
  currentQuizIndex = 0;
  currentCardIndex = 0;
  flashcardFlipped = false;
  saveState();
  renderChapterNav();
  const chapter = getChapter();
  els.chapterTitle.textContent = chapter.title;
  await loadNotes(chapter);
  renderAll();
}

async function loadNotes(chapter) {
  if (notesCache[chapter.id]) return;
  try {
    const response = await fetch(chapter.notesPath);
    if (!response.ok) throw new Error(`Unable to load ${chapter.notesPath}`);
    notesCache[chapter.id] = await response.text();
  } catch (error) {
    notesCache[chapter.id] = `# ${chapter.title}\n\nUnable to load Markdown notes. Run this site through a local server or deploy it to a static host.\n\n${error.message}`;
  }
}

function renderAll() {
  updateProgress();
  renderNotes();
  renderFlashcard();
  renderQuiz();
  renderWeakAreas();
  renderCheatSheet();
}

function updateProgress() {
  const progress = chapterProgress(activeChapterId);
  els.chapterProgressText.textContent = `${progress}%`;
  els.chapterProgressBar.style.width = `${progress}%`;
  renderChapterNav();
}

function setActiveView(view) {
  activeView = view;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active-view", section.id === `${view}View`);
  });
}

function renderNotes() {
  const markdown = notesCache[activeChapterId] || "";
  const query = els.searchInput.value.trim().toLowerCase();
  const filtered = query ? filterMarkdown(markdown, query) : markdown;
  els.notesContent.innerHTML = markdownToHtml(filtered || `No matches for "${escapeHtml(query)}".`);
}

function filterMarkdown(markdown, query) {
  const blocks = markdown.split(/\n(?=#{1,3}\s)/);
  return blocks
    .filter((block) => block.toLowerCase().includes(query))
    .join("\n\n");
}

function markdownToHtml(markdown) {
  const lines = markdown.split("\n");
  const html = [];
  let inCode = false;
  let inList = false;
  let inTable = false;
  let paragraph = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  const closeTable = () => {
    if (inTable) {
      html.push("</tbody></table>");
      inTable = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith("```")) {
      flushParagraph();
      closeList();
      closeTable();
      if (inCode) {
        html.push("</code></pre>");
        inCode = false;
      } else {
        html.push("<pre><code>");
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(rawLine)}\n`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      closeList();
      closeTable();
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      flushParagraph();
      closeList();
      const cells = line
        .slice(1, -1)
        .split("|")
        .map((cell) => cell.trim());
      if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
      if (!inTable) {
        html.push("<table><tbody>");
        inTable = true;
      }
      html.push(`<tr>${cells.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join("")}</tr>`);
      continue;
    } else {
      closeTable();
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushParagraph();
      closeList();
      html.push("<hr>");
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  closeTable();
  if (inCode) html.push("</code></pre>");
  return html.join("\n");
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function renderFlashcard() {
  const chapter = getChapter();
  const card = chapter.flashcards[currentCardIndex] || null;
  if (!card) {
    els.flashcardPrompt.textContent = "No flashcards yet.";
    els.flashcardAnswer.textContent = "";
    els.flashcardCount.textContent = "";
    return;
  }
  els.flashcard.classList.toggle("flipped", flashcardFlipped);
  els.flashcardCount.textContent = `Card ${currentCardIndex + 1} of ${chapter.flashcards.length}`;
  els.flashcardPrompt.textContent = card.front;
  els.flashcardAnswer.textContent = card.back;
}

function flipFlashcard() {
  flashcardFlipped = !flashcardFlipped;
  renderFlashcard();
}

function rateFlashcard(rating) {
  const chapter = getChapter();
  const chapterState = getChapterState();
  const cardKey = `${chapter.id}-${currentCardIndex}`;
  chapterState.ratings[cardKey] = rating;
  chapterState.flashcardsReviewed = Math.max(
    chapterState.flashcardsReviewed,
    Object.keys(chapterState.ratings).filter((key) => key.startsWith(chapter.id)).length
  );
  if (rating !== "again") {
    currentCardIndex = (currentCardIndex + 1) % chapter.flashcards.length;
  }
  flashcardFlipped = false;
  saveState();
  renderAll();
  showStatus(`Rated ${rating}. Progress saved in this browser.`);
}

function resetFlashcards() {
  const chapterState = getChapterState();
  chapterState.flashcardsReviewed = 0;
  chapterState.ratings = {};
  currentCardIndex = 0;
  flashcardFlipped = false;
  saveState();
  renderAll();
  showStatus("Flashcard progress reset.");
}

function renderQuiz() {
  const chapter = getChapter();
  const question = chapter.questions[currentQuizIndex];
  if (!question) {
    els.quizPanel.innerHTML = `<div class="empty-state">No MCQs for this chapter yet.</div>`;
    return;
  }
  const chapterState = getChapterState();
  els.quizPanel.innerHTML = `
    <div class="quiz-question">
      <h4>${currentQuizIndex + 1}. ${escapeHtml(question.prompt)}</h4>
      <div class="quiz-options">
        ${question.options
          .map(
            (option, index) =>
              `<button class="quiz-option" data-option="${index}" type="button">${escapeHtml(option)}</button>`
          )
          .join("")}
      </div>
      <div id="quizExplanation" class="explanation" hidden></div>
    </div>
    <div class="quiz-footer">
      <span>Score: ${chapterState.quizCorrect}/${chapterState.quizAnswered}</span>
      <button id="nextQuestionBtn" class="primary-action" type="button">Next question</button>
    </div>
  `;

  document.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => answerQuestion(Number(button.dataset.option)));
  });

  document.getElementById("nextQuestionBtn").addEventListener("click", () => {
    currentQuizIndex = (currentQuizIndex + 1) % chapter.questions.length;
    renderQuiz();
  });
}

function answerQuestion(selectedIndex) {
  const chapter = getChapter();
  const question = chapter.questions[currentQuizIndex];
  const chapterState = getChapterState();
  const buttons = document.querySelectorAll(".quiz-option");
  buttons.forEach((button, index) => {
    button.disabled = true;
    button.classList.toggle("correct", index === question.answer);
    button.classList.toggle("incorrect", index === selectedIndex && selectedIndex !== question.answer);
  });

  chapterState.quizAnswered += 1;
  if (selectedIndex === question.answer) chapterState.quizCorrect += 1;
  saveState();
  updateProgress();

  const explanation = document.getElementById("quizExplanation");
  explanation.hidden = false;
  explanation.textContent =
    selectedIndex === question.answer
      ? `Correct. ${question.explanation}`
      : `Not quite. ${question.explanation}`;
}

function resetQuiz() {
  const chapterState = getChapterState();
  chapterState.quizCorrect = 0;
  chapterState.quizAnswered = 0;
  currentQuizIndex = 0;
  saveState();
  renderAll();
  showStatus("Quiz progress reset.");
}

function renderWeakAreas() {
  const chapter = getChapter();
  els.weakAreas.innerHTML = chapter.weakAreas
    .map(
      (item) => `
        <section class="weak-item">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.text)}</p>
        </section>
      `
    )
    .join("");
}

function renderCheatSheet() {
  const chapter = getChapter();
  els.cheatSheet.innerHTML = chapter.cheatSheet
    .map(
      ([title, text]) => `
        <section class="cheat-item">
          <h4>${escapeHtml(title)}</h4>
          <p>${escapeHtml(text)}</p>
        </section>
      `
    )
    .join("");
}

function markChapterRevised() {
  const chapterState = getChapterState();
  chapterState.revised = true;
  saveState();
  updateProgress();
  showStatus("Chapter marked as revised.");
}

function showStatus(message) {
  els.statusBanner.textContent = message;
  els.statusBanner.hidden = false;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    els.statusBanner.hidden = true;
  }, 2400);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
