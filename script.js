// ======================================
// RECALLROCKET - MAIN JAVASCRIPT
// ======================================

// Get today's local date
function todayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Sample flashcards
const sampleDecks = [
    {
        id: 1,
        name: "Data Structures",
        icon: "💻",
        cards: [
            {
                id: 101,
                question: "What is a data structure?",
                answer: "A data structure is a way of organising and storing data so it can be accessed and modified efficiently."
            },
            {
                id: 102,
                question: "What is a stack?",
                answer: "A stack is a linear data structure that follows the LIFO principle (Last In, First Out)."
            },
            {
                id: 103,
                question: "What is a queue?",
                answer: "A queue is a linear data structure that follows FIFO (First In, First Out)."
            },
            {
                id: 104,
                question: "What is a linked list?",
                answer: "A linked list is a collection of nodes where each node stores data and a reference to the next node."
            }
        ]
    },
    {
        id: 2,
        name: "Algorithms",
        icon: "⚡",
        cards: [
            {
                id: 201,
                question: "What is the time complexity of QuickSort on average?",
                answer: "The average time complexity of QuickSort is O(n log n)."
            },
            {
                id: 202,
                question: "What is a searching algorithm?",
                answer: "A searching algorithm is a method used to find a particular element in a collection of data."
            },
            {
                id: 203,
                question: "What is binary search?",
                answer: "Binary search finds an element in a sorted array by repeatedly dividing the search interval into half."
            }
        ]
    },
    {
        id: 3,
        name: "Computer Networks",
        icon: "🌐",
        cards: [
            {
                id: 301,
                question: "What is a computer network?",
                answer: "A computer network is a group of interconnected devices that communicate and share resources."
            },
            {
                id: 302,
                question: "What is an IP address?",
                answer: "An IP address is a unique logical address used to identify a device on a network."
            },
            {
                id: 303,
                question: "What is HTTP?",
                answer: "HTTP stands for Hypertext Transfer Protocol. It is used for communication between web browsers and servers."
            }
        ]
    },
    {
        id: 4,
        name: "Python Basics",
        icon: "🐍",
        cards: [
            {
                id: 401,
                question: "What is Python?",
                answer: "Python is a high-level, interpreted programming language known for its simple and readable syntax."
            },
            {
                id: 402,
                question: "What is a variable in Python?",
                answer: "A variable is a named storage location used to hold a value."
            }
        ]
    }
];

// Load saved application data
let decks;

try {
    const savedDecks = localStorage.getItem("rr_decks");
    decks = savedDecks ? JSON.parse(savedDecks) : null;

    if (!Array.isArray(decks)) decks = null;
} catch (error) {
    decks = null;
}

if (!decks) {
    decks = sampleDecks.map(deck => ({
        ...deck,
        cards: deck.cards.map(card => ({
            ...card,
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            nextReviewDate: todayString()
        }))
    }));
}

let studyHistory;

try {
    studyHistory = JSON.parse(localStorage.getItem("rr_history")) || {};
} catch {
    studyHistory = {};
}

let selectedDeckId = null;
let reviewQueue = [];
let currentCardIndex = 0;
let isFlipped = false;
let currentCard = null;

const DAILY_GOAL = 10;

// Save application data
function saveData() {
    localStorage.setItem("rr_decks", JSON.stringify(decks));
    localStorage.setItem("rr_history", JSON.stringify(studyHistory));
}

// Get all flashcards
function getAllCards() {
    return decks.flatMap(deck => deck.cards);
}

// ======================================
// NAVIGATION
// ======================================

function showPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageName).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    const titles = {
        dashboard: "Good morning, Learner! 👋",
        decks: "Your Study Collections 📚",
        review: "Time to Train Your Brain 🧠",
        leaderboard: "Learn Together, Grow Together 🏆"
    };

    document.getElementById("pageTitle").textContent = titles[pageName];

    if (pageName === "dashboard") updateDashboard();
    if (pageName === "decks") renderDecks();
    if (pageName === "leaderboard") renderLeaderboard();
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        showPage(link.dataset.page);
    });
});

// ======================================
// DASHBOARD
// ======================================

function getDueCards() {
    return getAllCards().filter(card =>
        card.nextReviewDate <= todayString()
    );
}

function getTodayReviews() {
    return studyHistory[todayString()]?.count || 0;
}

function getStreak() {

    let streak = 0;
    const today = new Date();

    let checkDate = todayString();

    // Allow yesterday's streak to remain visible
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayString = [
        yesterday.getFullYear(),
        String(yesterday.getMonth() + 1).padStart(2, "0"),
        String(yesterday.getDate()).padStart(2, "0")
    ].join("-");

    if (
        !studyHistory[checkDate] &&
        !studyHistory[yesterdayString]
    ) {
        return 0;
    }

    if (!studyHistory[checkDate]) {
        checkDate = yesterdayString;
    }

    while (studyHistory[checkDate]) {

        streak++;

        const date = new Date(checkDate + "T12:00:00");
        date.setDate(date.getDate() - 1);

        checkDate = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    return streak;
}

function getMemoryPoints() {
    return getAllCards().reduce(
        (total, card) => total + (card.points || 0),
        0
    );
}

function updateDashboard() {

    const cards = getAllCards();
    const due = getDueCards();
    const reviewed = getTodayReviews();

    document.getElementById("totalCards").textContent = cards.length;
    document.getElementById("dueCards").textContent = due.length;
    document.getElementById("streakCount").textContent = getStreak();
    document.getElementById("memoryPoints").textContent = getMemoryPoints();

    const percentage = Math.min(
        100,
        Math.round((reviewed / DAILY_GOAL) * 100)
    );

    document.getElementById("progressPercent").textContent =
        percentage + "%";

    document.getElementById("progressCircle").style.background =
        `conic-gradient(#7657e9 ${percentage * 3.6}deg, #efedfa 0deg)`;

    document.getElementById("reviewedCount").textContent =
        `${reviewed} / ${DAILY_GOAL}`;

    document.getElementById("progressCaption").textContent =
        reviewed >= DAILY_GOAL
            ? "Amazing! You reached your daily goal! 🎉"
            : `${DAILY_GOAL - reviewed} more cards to reach your daily goal.`;

    renderDashboardDecks();
}

function renderDashboardDecks() {

    const container = document.getElementById("dashboardDecks");

    if (!decks.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-book-open"></i>
                <p>Create your first study deck!</p>
            </div>`;
        return;
    }

    container.innerHTML = decks.slice(0, 4).map(deck => {

        const total = deck.cards.length;
        const due = deck.cards.filter(
            card => card.nextReviewDate <= todayString()
        ).length;

        const completed = total - due;
        const percent = total
            ? Math.round((completed / total) * 100)
            : 0;

        return `
            <div class="deck-card" onclick="openDeck(${deck.id})">
                <div class="deck-icon">${deck.icon}</div>
                <h3>${escapeHTML(deck.name)}</h3>
                <p>${total} flashcards • ${due} due today</p>
                <div class="deck-progress">
                    <span style="width:${percent}%"></span>
                </div>
            </div>
        `;
    }).join("");
}

// ======================================
// DECK MANAGEMENT
// ======================================

function renderDecks() {

    const container = document.getElementById("allDecks");

    if (!decks.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-layer-group"></i>
                <p>No decks yet. Create your first deck!</p>
            </div>`;
        return;
    }

    container.innerHTML = decks.map(deck => {

        const due = deck.cards.filter(
            card => card.nextReviewDate <= todayString()
        ).length;

        return `
            <div class="deck-card">
                <div class="deck-icon">${deck.icon}</div>
                <h3>${escapeHTML(deck.name)}</h3>
                <p>${deck.cards.length} cards • ${due} due today</p>

                <div class="deck-card-actions">
                    <button class="small-btn"
                        onclick="openDeck(${deck.id})">
                        View Cards
                    </button>

                    <button class="small-btn"
                        onclick="addCardToDeck(${deck.id})">
                        + Add Card
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

// Safe HTML text display
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// Create deck modal
const deckModal = document.getElementById("deckModal");

document.getElementById("addDeckBtn").addEventListener("click", () => {
    deckModal.classList.remove("hidden");
});

document.getElementById("closeModal").addEventListener("click", () => {
    deckModal.classList.add("hidden");
});

document.getElementById("deckForm").addEventListener("submit", event => {

    event.preventDefault();

    const name = document.getElementById("deckName").value.trim();
    const icon = document.getElementById("deckIcon").value;

    if (!name) return;

    const exists = decks.some(
        deck => deck.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        alert("A deck with this name already exists.");
        return;
    }

    decks.push({
        id: Date.now(),
        name,
        icon,
        cards: []
    });

    saveData();

    event.target.reset();
    deckModal.classList.add("hidden");

    renderDecks();
    updateDashboard();

    alert("Your new study deck has been created!");
});

// ======================================
// ADD FLASHCARDS
// ======================================

const cardModal = document.getElementById("cardModal");

function addCardToDeck(deckId) {

    selectedDeckId = deckId;
    cardModal.classList.remove("hidden");
}

document.getElementById("closeCardModal").addEventListener("click", () => {
    cardModal.classList.add("hidden");
});

document.getElementById("cardForm").addEventListener("submit", event => {

    event.preventDefault();

    const question = document.getElementById("newQuestion").value.trim();
    const answer = document.getElementById("newAnswer").value.trim();

    const deck = decks.find(d => d.id === selectedDeckId);

    if (!deck || !question || !answer) return;

    deck.cards.push({
        id: Date.now(),
        question,
        answer,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: todayString(),
        points: 0
    });

    saveData();

    event.target.reset();
    cardModal.classList.add("hidden");

    renderDecks();
    updateDashboard();

    alert("Flashcard added successfully!");
});

// ======================================
// VIEW DECK DETAILS
// ======================================

const detailModal = document.getElementById("detailModal");

document.getElementById("closeDetailModal").addEventListener("click", () => {
    detailModal.classList.add("hidden");
});

function openDeck(deckId) {

    const deck = decks.find(d => d.id === deckId);

    if (!deck) return;

    selectedDeckId = deckId;

    let content = `
        <span class="hero-tag">✦ YOUR STUDY COLLECTION</span>
        <h2>${deck.icon} ${escapeHTML(deck.name)}</h2>
        <p>${deck.cards.length} flashcards in this deck.</p>

        <button class="primary-btn" onclick="addCardToDeck(${deck.id})">
            + Add Flashcard
        </button>
    `;

    if (!deck.cards.length) {
        content += `
            <div class="empty-state" style="margin-top:18px">
                <i class="fa-solid fa-book-open"></i>
                <p>No cards yet. Add your first question!</p>
            </div>`;
    } else {
        content += deck.cards.map((card, index) => `
            <div class="detail-card">
                <strong>${index + 1}. ${escapeHTML(card.question)}</strong>
                <p>${escapeHTML(card.answer)}</p>
            </div>
        `).join("");
    }

    document.getElementById("deckDetailContent").innerHTML = content;

    detailModal.classList.remove("hidden");
}

// ======================================
// SM-2 SPACED REPETITION ALGORITHM
// ======================================

function calculateSM2(card, grade) {

    let repetitions = card.repetitions || 0;
    let interval = card.interval || 0;
    let easeFactor = card.easeFactor || 2.5;

    // Update ease factor using SM-2 formula
    easeFactor = easeFactor + (
        0.1 - (5 - grade) *
        (0.08 + (5 - grade) * 0.02)
    );

    // Minimum ease factor
    easeFactor = Math.max(1.3, easeFactor);

    if (grade < 3) {

        repetitions = 0;
        interval = 1;

    } else {

        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easeFactor);
        }

        repetitions++;
    }

    // Calculate next review date
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);

    const nextReviewDate = [
        nextDate.getFullYear(),
        String(nextDate.getMonth() + 1).padStart(2, "0"),
        String(nextDate.getDate()).padStart(2, "0")
    ].join("-");

    card.repetitions = repetitions;
    card.interval = interval;
    card.easeFactor = easeFactor;
    card.nextReviewDate = nextReviewDate;

    // Award memory points
    card.points = (card.points || 0) + grade * 10;

    return {
        interval,
        nextReviewDate,
        easeFactor
    };
}

// ======================================
// DAILY REVIEW SESSION
// ======================================

function startReview() {

    reviewQueue = getDueCards().map(card => ({
        card,
        deck: decks.find(d => d.cards.includes(card))
    }));

    currentCardIndex = 0;

    document.getElementById("reviewComplete").classList.add("hidden");
    document.querySelector(".review-card-area").classList.remove("hidden");
    document.querySelector(".rating-area").classList.remove("hidden");

    if (!reviewQueue.length) {

        currentCard = null;

        document.getElementById("cardQuestion").textContent =
            "You're all caught up!";

        document.getElementById("cardAnswer").textContent =
            "Come back tomorrow for your next review.";

        document.getElementById("reviewProgress").textContent =
            "No cards due";

        document.getElementById("reviewComplete").classList.remove("hidden");
        document.querySelector(".review-card-area").classList.add("hidden");
        document.querySelector(".rating-area").classList.add("hidden");

        return;
    }

    showCurrentCard();
}

function showCurrentCard() {

    if (currentCardIndex >= reviewQueue.length) {

        finishReview();
        return;
    }

    currentCard = reviewQueue[currentCardIndex].card;

    isFlipped = false;

    document.getElementById("flashcard").classList.remove("flipped");

    document.getElementById("cardQuestion").textContent =
        reviewQueue[currentCardIndex].card.question;

    document.getElementById("cardAnswer").textContent =
        reviewQueue[currentCardIndex].card.answer;

    document.getElementById("reviewProgress").textContent =
        `Card ${currentCardIndex + 1} of ${reviewQueue.length}`;
}

function flipCard() {

    if (!currentCard) return;

    isFlipped = !isFlipped;

    document.getElementById("flashcard").classList.toggle("flipped", isFlipped);
}

document.getElementById("flipBtn").addEventListener("click", flipCard);

document.getElementById("flashcard").addEventListener("click", event => {

    if (event.target.closest(".flip-btn")) return;

    flipCard();
});

// Rating buttons
document.querySelectorAll(".rate-btn").forEach(button => {

    button.addEventListener("click", () => {

        if (!currentCard || !isFlipped) {
            alert("Please reveal the answer before rating your recall.");
            return;
        }

        const grade = Number(button.dataset.grade);

        rateCard(grade);
    });
});

function rateCard(grade) {

    if (!currentCard || !isFlipped) return;

    const result = calculateSM2(currentCard, grade);

    // Update daily activity
    const today = todayString();

    if (!studyHistory[today]) {
        studyHistory[today] = { count: 0 };
    }

    studyHistory[today].count++;

    saveData();

    const message = grade < 3
        ? "This card will return tomorrow."
        : `Great! Next review in ${result.interval} day(s).`;

    // Move to next card
    currentCardIndex++;

    updateDashboard();

    showCurrentCard();

    if (currentCard) {
        document.getElementById("reviewProgress").title = message;
    }
}

function finishReview() {

    currentCard = null;

    document.querySelector(".review-card-area").classList.add("hidden");
    document.querySelector(".rating-area").classList.add("hidden");

    document.getElementById("reviewComplete").classList.remove("hidden");

    document.getElementById("reviewProgress").textContent =
        "Session completed!";

    updateDashboard();
}

// ======================================
// KEYBOARD SHORTCUTS
// ======================================

document.addEventListener("keydown", event => {

    const reviewPage = document.getElementById("review");

    if (!reviewPage.classList.contains("active")) return;

    if (
        event.target.matches("input, textarea, select") ||
        !currentCard
    ) return;

    if (event.code === "Space") {

        event.preventDefault();
        flipCard();

    } else if (/^[0-5]$/.test(event.key)) {

        if (isFlipped) {
            const grade = Number(event.key);
            rateCard(grade);
        }
    }
});

// ======================================
// LEADERBOARD
// ======================================

function renderLeaderboard() {

    const users = [
        {
            name: "Aarav",
            streak: 12,
            points: 950,
            avatar: "A"
        },
        {
            name: "Priya",
            streak: 9,
            points: 820,
            avatar: "P"
        },
        {
            name: "Rahul",
            streak: 7,
            points: 740,
            avatar: "R"
        },
        {
            name: "Learner",
            streak: getStreak(),
            points: getMemoryPoints(),
            avatar: "S"
        },
        {
            name: "Ananya",
            streak: 4,
            points: 520,
            avatar: "A"
        }
    ];

    users.sort((a, b) => b.points - a.points);

    const container = document.getElementById("leaderboardList");

    container.innerHTML = users.map((user, index) => {

        return `
            <div class="leader-row">
                <span class="rank">#${index + 1}</span>

                <div class="student-name">
                    <div class="student-avatar">
                        ${user.avatar}
                    </div>
                    ${user.name}
                </div>

                <span>🔥 ${user.streak} days</span>

                <span class="points">
                    ${user.points} pts
                </span>
            </div>
        `;
    }).join("");
}

// ======================================
// DARK / LIGHT MODE
// ======================================

const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("rr_theme") === "dark") {
    document.body.classList.add("dark");
}

function updateThemeButton() {
    themeToggle.innerHTML = document.body.classList.contains("dark")
        ? '<i class="fa-solid fa-sun"></i> Light Theme'
        : '<i class="fa-solid fa-moon"></i> Dark Theme';
}

themeToggle.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const theme = document.body.classList.contains("dark")
        ? "dark"
        : "light";

    localStorage.setItem("rr_theme", theme);

    updateThemeButton();
});

updateThemeButton();

// ======================================
// INITIALIZE APPLICATION
// ======================================

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

saveData();
updateDashboard();
renderDecks();
renderLeaderboard();
startReview();