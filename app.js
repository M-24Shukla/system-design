const chapters = [
  {
    id: "transactions",
    title: "Transactions",
    subtitle: "ACID, isolation levels, anomalies, and serializability",
    notesPath: "./transactions-chapter-summary.md",
    flashcards: [
      {
        front: "What does atomicity mean?",
        back: "A transaction's writes are all-or-nothing: commit keeps all writes; abort rolls partial writes back."
      },
      {
        front: "How is ACID consistency different from replication consistency?",
        back: "ACID consistency is about preserving validity rules and invariants. Replication consistency is about replicas agreeing or read freshness."
      },
      {
        front: "What does Read Committed prevent?",
        back: "Dirty reads and dirty writes. It does not provide a stable transaction-wide snapshot."
      },
      {
        front: "Why can Read Committed show an inconsistent report?",
        back: "Each read sees the latest committed value at that moment, so different reads can observe different committed points in time."
      },
      {
        front: "What is MVCC?",
        back: "Multi-version concurrency control: the database keeps multiple record versions so transactions can read the version visible to their snapshot."
      },
      {
        front: "Lost update vs write skew?",
        back: "Lost update overwrites the same object. Write skew updates different objects but breaks a shared invariant."
      },
      {
        front: "What does serializability mean?",
        back: "Concurrent transactions have the same result as if they ran one at a time in some serial order."
      },
      {
        front: "2PL vs SSI?",
        back: "2PL pessimistically blocks conflicts with locks. SSI optimistically runs transactions on snapshots and aborts dangerous conflicts."
      }
    ],
    questions: [
      {
        prompt: "Under Read Committed, which anomaly can still happen?",
        options: ["Dirty read", "Dirty write", "Non-repeatable read", "Reading uncommitted data"],
        answer: 2,
        explanation: "Read Committed prevents dirty reads and dirty writes, but the same transaction can read different committed values at different times."
      },
      {
        prompt: "Which statement best describes snapshot isolation?",
        options: [
          "Every read sees the newest committed value",
          "All reads in a transaction see one stable committed snapshot",
          "Transactions literally execute one at a time",
          "Uncommitted writes are visible to readers"
        ],
        answer: 1,
        explanation: "Snapshot isolation gives a stable view of committed data as of a particular point in time."
      },
      {
        prompt: "Two doctors both read that the other is on call, then each marks themselves off call. What anomaly is this?",
        options: ["Dirty read", "Lost update", "Write skew", "Dirty write"],
        answer: 2,
        explanation: "They write different rows, but together violate the invariant that at least one doctor is on call."
      },
      {
        prompt: "Serializable isolation means:",
        options: [
          "Transactions always produce the same result under every possible order",
          "Transactions must physically run one at a time",
          "The result is equivalent to some serial order",
          "Transactions never abort"
        ],
        answer: 2,
        explanation: "Serializable means equivalent to one valid serial order, not every order and not necessarily literal serial execution."
      },
      {
        prompt: "Why do stored procedures help actual serial execution?",
        options: [
          "They guarantee all data is in memory",
          "They avoid client-server round trips during the transaction",
          "They remove the need for durability",
          "They make all queries read-only"
        ],
        answer: 1,
        explanation: "The full transaction logic runs inside the database, so the serial execution thread is not waiting on interactive client round trips."
      }
    ],
    weakAreas: [
      {
        title: "Atomicity is not pending jobs",
        text: "Atomicity means abortability: uncommitted partial writes are rolled back or ignored. Retry queues and sagas are separate application patterns."
      },
      {
        title: "Read Committed has mixed views",
        text: "Every read can be committed and still form an inconsistent report because reads may come from different committed moments."
      },
      {
        title: "Snapshot Isolation is not Serializable",
        text: "Snapshot isolation gives stable reads, but concurrent transactions can still break invariants through write skew."
      },
      {
        title: "Some serial order",
        text: "Serializable means equivalent to some valid serial order, not all possible orders."
      }
    ],
    cheatSheet: [
      ["Atomicity vs Isolation", "Atomicity handles partial failure. Isolation handles concurrent transactions."],
      ["Read Committed vs Snapshot", "Read Committed sees latest committed data per read. Snapshot sees one committed view for the transaction."],
      ["Lost Update vs Write Skew", "Lost update overwrites the same object. Write skew writes different objects and breaks an invariant."],
      ["2PL vs SSI", "2PL blocks conflicts. SSI tracks dangerous dependencies and may abort later."]
    ]
  },
  {
    id: "distributed-trouble",
    title: "The Trouble With Distributed Systems",
    subtitle: "Partial failures, clocks, pauses, quorums, and system models",
    notesPath: "./trouble-with-distributed-systems-summary.md",
    flashcards: [
      {
        front: "What does a timeout prove?",
        back: "Nothing certain. It only proves no response arrived within the deadline; the outcome is unknown."
      },
      {
        front: "Why does tail latency matter?",
        back: "A small slow fraction can dominate user experience, especially when one request fans out to many services."
      },
      {
        front: "Time-of-day clock vs monotonic clock?",
        back: "Time-of-day gives wall-clock date/time and can jump. Monotonic clocks measure elapsed time and only move forward locally."
      },
      {
        front: "What is clock drift?",
        back: "Hardware clocks run at slightly different rates, causing clock differences to grow over time."
      },
      {
        front: "Why is a paused process dangerous?",
        back: "It may resume with stale beliefs, such as thinking it is still leader or still owns a lease."
      },
      {
        front: "What does a fencing token do?",
        back: "It is a monotonically increasing ownership token. Resources reject stale requests with older tokens."
      },
      {
        front: "Why do majorities help prevent split brain?",
        back: "Any two majorities overlap, so two disconnected minorities cannot both make authoritative conflicting decisions."
      },
      {
        front: "Safety vs liveness?",
        back: "Safety means bad things never happen. Liveness means good things eventually happen."
      }
    ],
    questions: [
      {
        prompt: "A request times out. What can the caller safely conclude?",
        options: [
          "The remote node definitely crashed",
          "The operation definitely did not happen",
          "No response arrived before the deadline",
          "The network is permanently broken"
        ],
        answer: 2,
        explanation: "Timeouts indicate uncertainty. The request or response may be delayed, lost, or the operation may have completed."
      },
      {
        prompt: "Which clock should be used for measuring elapsed request duration?",
        options: ["Time-of-day clock", "Monotonic clock", "Wall-clock timestamp", "Last-write-wins timestamp"],
        answer: 1,
        explanation: "Monotonic clocks are designed for elapsed time because they do not jump backward."
      },
      {
        prompt: "Why is a lease alone unsafe with process pauses?",
        options: [
          "Leases cannot expire",
          "A paused process may resume after lease expiry and act on stale ownership",
          "Leases require Byzantine fault tolerance",
          "Leases only work with one node"
        ],
        answer: 1,
        explanation: "The process may not observe that time passed while paused, so it can continue acting as if it still owns the lease."
      },
      {
        prompt: "For fencing tokens to work, what must the shared resource do?",
        options: [
          "Conduct leader elections",
          "Ignore tokens from old leaders",
          "Check tokens and reject stale ones",
          "Use only local clocks"
        ],
        answer: 2,
        explanation: "A token only protects the resource if the resource enforces monotonic token ordering."
      },
      {
        prompt: "In a 5-node cluster split into groups of 2 and 3, which side can make authoritative decisions?",
        options: ["The 2-node side", "The 3-node side", "Both sides", "Neither side ever"],
        answer: 1,
        explanation: "Three nodes form a majority of five. The minority should stop making authoritative decisions."
      }
    ],
    weakAreas: [
      {
        title: "Timeout is not proof",
        text: "After a timeout, the system suspects failure or treats the request as failed operationally. The true outcome is still unknown."
      },
      {
        title: "Clock drift vs offset",
        text: "Offset is the current difference. Drift is clocks running at different rates, causing differences to accumulate."
      },
      {
        title: "Fencing must be enforced",
        text: "A coordinator may issue tokens, but the shared resource must reject older tokens for fencing to work."
      },
      {
        title: "Quorum is broader than election",
        text: "Majority/quorum defines authoritative distributed decisions generally. Leader election is one example."
      }
    ],
    cheatSheet: [
      ["Timeout", "No response by deadline; not proof of failure."],
      ["Tail Latency", "The slowest fraction matters because fanout increases the chance of hitting it."],
      ["Time-of-Day vs Monotonic", "Wall-clock for dates/logs; monotonic for elapsed duration."],
      ["Paused vs Crashed", "Crashed stops. Paused can resume with stale state."],
      ["Lease vs Fencing", "Lease grants temporary ownership; fencing lets resources reject stale owners."],
      ["Safety vs Liveness", "Safety prevents permanent bad states; liveness promises eventual progress."]
    ]
  }
];

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
