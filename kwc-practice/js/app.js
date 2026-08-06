import { loadTricks } from "./data.js";

import {
    displayTricks,
    displayLevelFilters,
    showTableError
} from "./ui.js";


/* --------------------------------------------------
   DOM elements
-------------------------------------------------- */

const homeScreen = document.querySelector("#home-screen");
const selectionScreen = document.querySelector("#selection-screen");
const practiceScreen = document.querySelector("#practice-screen");

const modeButtons = document.querySelectorAll(".mode-card");
const backHomeButton = document.querySelector("#back-home-button");

const selectionTitle = document.querySelector("#selection-title");
const selectionDescription = document.querySelector(
    "#selection-description"
);
const selectionCounter = document.querySelector("#selection-counter");
const startPracticeButton = document.querySelector(
    "#start-practice-button"
);
const clearSelectionButton = document.querySelector(
    "#clear-selection-button"
);

const practiceModeLabel = document.querySelector(
    "#practice-mode-label"
);
const practiceRoundTitle = document.querySelector(
    "#practice-round-title"
);
const practiceTimer = document.querySelector("#practice-timer");
const practiceMessage = document.querySelector(
    "#practice-message"
);
const practiceTrickList = document.querySelector(
    "#practice-trick-list"
);

const startTimerButton = document.querySelector(
    "#start-timer-button"
);
const nextRoundButton = document.querySelector(
    "#next-round-button"
);
const exitPracticeButton = document.querySelector(
    "#exit-practice-button"
);

const resultsScreen =
    document.querySelector("#results-screen");

const resultsModeLabel =
    document.querySelector("#results-mode-label");

const resultsTitle =
    document.querySelector("#results-title");

const resultsContent =
    document.querySelector("#results-content");

const resultsTotalScore =
    document.querySelector("#results-total-score");

const practiceAgainButton =
    document.querySelector("#practice-again-button");

const newTricksButton =
    document.querySelector("#new-tricks-button");

const resultsHomeButton =
    document.querySelector("#results-home-button");

const landedTrickIds = new Set();

const resultsBaseScore =
    document.querySelector("#results-base-score");

const resultsLevel14Bonus =
    document.querySelector("#results-level-14-bonus");

const resultsLevel15Bonus =
    document.querySelector("#results-level-15-bonus");

const resultsFullMarksBonus =
    document.querySelector("#results-full-marks-bonus");

const level14BonusRow =
    document.querySelector("#level-14-bonus-row");

const level15BonusRow =
    document.querySelector("#level-15-bonus-row");

const fullMarksBonusRow =
    document.querySelector("#full-marks-bonus-row");
/* --------------------------------------------------
   Application state
-------------------------------------------------- */

let currentMode = null;
let allTricks = [];

let selectedTrickIds = new Set();
let selectedLevels = new Set();

let preliminaryRoundOneIds = new Set();
let preliminaryRoundTwoIds = new Set();

let currentPracticeRound = 1;
let currentPracticeTricks = [];

let countdownInterval = null;
let roundTimerInterval = null;
let goTimeout = null;
let timerIsRunning = false;


/* --------------------------------------------------
   Screen navigation
-------------------------------------------------- */

function showScreen(screenToShow) {
    homeScreen.classList.remove("active");
    selectionScreen.classList.remove("active");
    practiceScreen.classList.remove("active");
    resultsScreen.classList.remove("active");

    screenToShow.classList.add("active");
}


/* --------------------------------------------------
   Selection rules and counters
-------------------------------------------------- */

function getSelectionRules() {
    if (currentMode === "preliminary") {
        return {
            minimum: 10,
            maximum: 10
        };
    }

    if (currentMode === "finals") {
        return {
            minimum: 10,
            maximum: 30
        };
    }

    return {
        minimum: 0,
        maximum: 0
    };
}


function updateSelectionControls() {
    const rules = getSelectionRules();
    const selectedTotal = selectedTrickIds.size;

    if (currentMode === "preliminary") {
        selectionCounter.innerHTML = `
            <span>
                Round 1:
                <strong>
                    ${preliminaryRoundOneIds.size} / 5
                </strong>
            </span>

            <span>
                Round 2:
                <strong>
                    ${preliminaryRoundTwoIds.size} / 5
                </strong>
            </span>
        `;
    }

    if (currentMode === "finals") {
        selectionCounter.innerHTML = `
            Selected:
            <strong>${selectedTotal}</strong>
            / ${rules.maximum}
            (Minimum ${rules.minimum})
        `;
    }

    let validSelection = false;

    if (currentMode === "preliminary") {
        validSelection =
            preliminaryRoundOneIds.size === 5 &&
            preliminaryRoundTwoIds.size === 5;
    }

    if (currentMode === "finals") {
        validSelection =
            selectedTotal >= rules.minimum &&
            selectedTotal <= rules.maximum;
    }

    startPracticeButton.disabled = !validSelection;
}


/* --------------------------------------------------
   Trick filtering
-------------------------------------------------- */

function getTricksForMode(mode) {
    if (mode === "preliminary") {
        return allTricks;
    }

    if (mode === "finals") {
        return allTricks.filter((trick) => trick.finals);
    }

    return [];
}


function getVisibleTricks() {
    const availableTricks = getTricksForMode(currentMode);

    if (selectedLevels.size === 0) {
        return availableTricks;
    }

    return availableTricks.filter((trick) =>
        selectedLevels.has(trick.level)
    );
}


function handleLevelToggle(level) {
    if (selectedLevels.has(level)) {
        selectedLevels.delete(level);
    } else {
        selectedLevels.add(level);
    }

    renderSelectionScreen();
}


/* --------------------------------------------------
   Trick selection
-------------------------------------------------- */

function handleTrickSelection(trick, isSelected) {
    const rules = getSelectionRules();

    if (
        isSelected &&
        selectedTrickIds.size >= rules.maximum
    ) {
        return;
    }

    if (currentMode === "preliminary") {
        if (isSelected) {
            selectedTrickIds.add(trick.id);

            if (preliminaryRoundOneIds.size < 5) {
                preliminaryRoundOneIds.add(trick.id);
            } else if (preliminaryRoundTwoIds.size < 5) {
                preliminaryRoundTwoIds.add(trick.id);
            }
        } else {
            selectedTrickIds.delete(trick.id);
            preliminaryRoundOneIds.delete(trick.id);
            preliminaryRoundTwoIds.delete(trick.id);
        }
    }

    if (currentMode === "finals") {
        if (isSelected) {
            selectedTrickIds.add(trick.id);
        } else {
            selectedTrickIds.delete(trick.id);
        }
    }

    renderSelectionScreen();
}


function renderSelectionScreen() {
    const rules = getSelectionRules();
    const availableTricks = getTricksForMode(currentMode);
    const visibleTricks = getVisibleTricks();

    const levels = [
        ...new Set(
            availableTricks.map((trick) => trick.level)
        )
    ].sort((a, b) => a - b);

    displayLevelFilters(
        levels,
        selectedLevels,
        handleLevelToggle
    );

    displayTricks(
        visibleTricks,
        selectedTrickIds,
        handleTrickSelection,
        rules.maximum,
        currentMode
    );

    updateSelectionControls();
}


/* --------------------------------------------------
   Selection screen setup
-------------------------------------------------- */

function openSelectionScreen(mode) {
    clearPracticeTimers();

    currentMode = mode;

    selectedTrickIds.clear();
    selectedLevels.clear();

    preliminaryRoundOneIds.clear();
    preliminaryRoundTwoIds.clear();

    if (mode === "preliminary") {
        selectionTitle.textContent =
            "Preliminary Round Practice";

        selectionDescription.textContent =
            "Select five tricks for Round 1 and five tricks for Round 2.";
    }

    if (mode === "finals") {
        selectionTitle.textContent =
            "Finals Practice";

        selectionDescription.textContent =
            "Select between 10 and 30 tricks for your three-minute round.";
    }

    renderSelectionScreen();
    showScreen(selectionScreen);
}


function returnHome() {
    clearPracticeTimers();

    currentMode = null;

    selectedTrickIds.clear();
    selectedLevels.clear();

    preliminaryRoundOneIds.clear();
    preliminaryRoundTwoIds.clear();

    startPracticeButton.disabled = true;

    showScreen(homeScreen);
}
function clearSelections() {
    selectedTrickIds.clear();

    preliminaryRoundOneIds.clear();
    preliminaryRoundTwoIds.clear();

    renderSelectionScreen();
}

/* --------------------------------------------------
   Practice trick helpers
-------------------------------------------------- */

function getTricksFromIds(trickIds) {
    return [...trickIds]
        .map((trickId) =>
            allTricks.find((trick) => trick.id === trickId)
        )
        .filter(Boolean);
}


function displayPracticeTricks(tricks) {
    practiceTrickList.innerHTML = "";

    tricks.forEach((trick) => {
        const item = document.createElement("li");
        item.className = "practice-trick-item";

        const level = document.createElement("span");
        level.className = "practice-trick-level";
        level.textContent =
            `Level ${trick.level}.${trick.trickNumber}`;

        const name = document.createElement("span");
        name.className = "practice-trick-name";
        name.textContent = trick.name;

        item.append(level, name);

        practiceTrickList.appendChild(item);
    });
}

/* --------------------------------------------------
   Timer helpers
-------------------------------------------------- */

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
}


function clearPracticeTimers() {
    if (countdownInterval !== null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    if (roundTimerInterval !== null) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }

    if (goTimeout !== null) {
        clearTimeout(goTimeout);
        goTimeout = null;
    }

    timerIsRunning = false;
}


/* --------------------------------------------------
   Five-second preparation countdown
-------------------------------------------------- */

function startPreparationCountdown() {
    if (timerIsRunning) {
        return;
    }

    clearPracticeTimers();

    timerIsRunning = true;

    startTimerButton.disabled = true;
    exitPracticeButton.disabled = true;

    practiceTimer.classList.add("countdown");
    practiceTimer.classList.remove("finished");

    practiceMessage.textContent = "Get ready!";

    let countdownSeconds = 5;

    practiceTimer.textContent = countdownSeconds;

    countdownInterval = setInterval(() => {
        countdownSeconds -= 1;

        if (countdownSeconds > 0) {
            practiceTimer.textContent = countdownSeconds;
            return;
        }

        clearInterval(countdownInterval);
        countdownInterval = null;

        practiceTimer.textContent = "GO!";
        practiceMessage.textContent = "Round in progress.";

        goTimeout = window.setTimeout(() => {
            goTimeout = null;
            startRoundTimer();
        }, 700);
    }, 1000);
}


/* --------------------------------------------------
   Three-minute round timer
-------------------------------------------------- */

function startRoundTimer() {
    let remainingSeconds = 3 * 60;

    practiceTimer.classList.remove(
        "countdown",
        "finished"
    );

    practiceTimer.textContent = formatTime(remainingSeconds);

    roundTimerInterval = setInterval(() => {
        remainingSeconds -= 1;

        practiceTimer.textContent =
            formatTime(remainingSeconds);

        if (remainingSeconds <= 0) {
            finishPracticeRound();
        }
    }, 1000);
}


/* --------------------------------------------------
   End-of-round behavior
-------------------------------------------------- */

function finishPracticeRound() {
    if (roundTimerInterval !== null) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }

    timerIsRunning = false;

    practiceTimer.textContent = "Time!";
    practiceTimer.classList.add("finished");

    exitPracticeButton.disabled = false;

    if (
        currentMode === "preliminary" &&
        currentPracticeRound === 1
    ) {
        practiceMessage.textContent =
            "Round 1 complete. Continue when you are ready for Round 2.";

        startTimerButton.classList.add("hidden");
        nextRoundButton.classList.remove("hidden");

        return;
    }

    if (
        currentMode === "preliminary" &&
        currentPracticeRound === 2
    ) {
        practiceMessage.textContent =
            "Preliminary practice complete.";

        startTimerButton.classList.add("hidden");
        nextRoundButton.classList.add("hidden");

        setTimeout(() => {
            openResultsScreen();
        }, 1000);

        return;
    }

    practiceMessage.textContent =
        "Finals practice complete.";

    startTimerButton.classList.add("hidden");
    nextRoundButton.classList.add("hidden");

    setTimeout(() => {
        openResultsScreen();
    }, 1000);
}

function calculateResultsScore() {
    const resultTricks =
        currentMode === "preliminary"
            ? [
                ...getTricksFromIds(preliminaryRoundOneIds),
                ...getTricksFromIds(preliminaryRoundTwoIds)
            ]
            : getTricksFromIds(selectedTrickIds);

    let baseScore = 0;
    let level14Bonus = 0;
    let level15Bonus = 0;
    let fullMarksBonus = 0;

    landedTrickIds.forEach((trickId) => {
        const trick = resultTricks.find(
            (item) => item.id === trickId
        );

        if (!trick) {
            return;
        }

        if (currentMode === "preliminary") {
            baseScore += Number(trick.points) || 0;
            return;
        }

        const level = Number(trick.level);

        baseScore += level ** 2;

        if (level === 14) {
            level14Bonus += 30;
        }

        if (level === 15) {
            level15Bonus += 50;
        }
    });

    const earnedFullMarks =
        currentMode === "finals" &&
        resultTricks.length > 0 &&
        landedTrickIds.size === resultTricks.length;

    if (earnedFullMarks) {
        fullMarksBonus = resultTricks.reduce(
            (total, trick) =>
                total + Number(trick.level),
            0
        );
    }

    const totalScore =
        baseScore +
        level14Bonus +
        level15Bonus +
        fullMarksBonus;

    resultsBaseScore.textContent = baseScore;

    resultsLevel14Bonus.textContent =
        `+${level14Bonus}`;

    resultsLevel15Bonus.textContent =
        `+${level15Bonus}`;

    resultsFullMarksBonus.textContent =
        `+${fullMarksBonus}`;

    resultsTotalScore.textContent = totalScore;

    level14BonusRow.classList.toggle(
        "hidden",
        level14Bonus === 0
    );

    level15BonusRow.classList.toggle(
        "hidden",
        level15Bonus === 0
    );

    fullMarksBonusRow.classList.toggle(
        "hidden",
        fullMarksBonus === 0
    );
}

function createResultSection(title, tricks) {
    const section = document.createElement("section");
    section.className = "result-section";

    const heading = document.createElement("h3");
    heading.textContent = title;

    section.appendChild(heading);

    tricks.forEach((trick) => {
        const row = document.createElement("label");
        row.className = "result-row";

        const leftSide = document.createElement("span");
        leftSide.className = "result-left";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "trick-checkbox";
        checkbox.checked = landedTrickIds.has(trick.id);

        const trickInfo = document.createElement("div");
        trickInfo.className = "result-info";

        const level = document.createElement("span");
        level.className = "result-level";
        level.textContent =
            `Level ${trick.level}.${trick.trickNumber}`;

        const trickName = document.createElement("span");
        trickName.className = "result-name";
        trickName.textContent = trick.name;

        trickInfo.append(level, trickName);

        const points = document.createElement("span");
        points.className = "result-points";

        let pointValue;

        if (currentMode === "finals") {
            const level = Number(trick.level);

            pointValue = level ** 2;

            if (level === 14) {
                pointValue += 30;
            }

            if (level === 15) {
                pointValue += 50;
            }
        } else {
            pointValue = trick.points;
        }

        points.textContent =
            `${pointValue} ${Number(pointValue) === 1 ? "point" : "points"}`;

        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                landedTrickIds.add(trick.id);
            } else {
                landedTrickIds.delete(trick.id);
            }

            row.classList.toggle(
                "landed",
                checkbox.checked
            );

            calculateResultsScore();
        });

        row.classList.toggle(
            "landed",
            checkbox.checked
        );

        leftSide.append(
            checkbox,
            trickInfo
        );

        row.append(
            leftSide,
            points
        );

        section.appendChild(row);
    });

    return section;
}
function renderResults() {
    resultsContent.innerHTML = "";

    if (currentMode === "preliminary") {
        resultsModeLabel.textContent =
            "Preliminary Practice Results";

        resultsTitle.textContent =
            "How did you do?";

        const roundOneTricks =
            getTricksFromIds(preliminaryRoundOneIds);

        const roundTwoTricks =
            getTricksFromIds(preliminaryRoundTwoIds);

        resultsContent.append(
            createResultSection(
                "Round 1",
                roundOneTricks
            ),
            createResultSection(
                "Round 2",
                roundTwoTricks
            )
        );
    } else {
        resultsModeLabel.textContent =
            "Finals Practice Results";

        resultsTitle.textContent =
            "How did you do?";

        const finalsTricks =
            getTricksFromIds(selectedTrickIds);

        resultsContent.appendChild(
            createResultSection(
                "Finals",
                finalsTricks
            )
        );
    }

    calculateResultsScore();
}
function openResultsScreen() {
    landedTrickIds.clear();

    renderResults();
    showScreen(resultsScreen);
}
/* --------------------------------------------------
   Practice screen setup
-------------------------------------------------- */

function openPracticeRound(roundNumber, tricks) {
    clearPracticeTimers();

    currentPracticeRound = roundNumber;
    currentPracticeTricks = tricks;

    practiceTimer.textContent = "3:00";
    practiceTimer.classList.remove(
        "countdown",
        "finished"
    );

    startTimerButton.disabled = false;
    exitPracticeButton.disabled = false;

    startTimerButton.classList.remove("hidden");
    nextRoundButton.classList.add("hidden");

    if (currentMode === "preliminary") {
        practiceModeLabel.textContent =
            "Preliminary Practice";

        practiceRoundTitle.textContent =
            `Round ${roundNumber}`;

        startTimerButton.textContent =
            `Start Round ${roundNumber}`;
    }

    if (currentMode === "finals") {
        practiceModeLabel.textContent =
            "Finals Practice";

        practiceRoundTitle.textContent =
            "Selected Tricks";

        startTimerButton.textContent =
            "Start Timer";
    }

    practiceMessage.textContent =
        "Review your tricks, then start the timer when ready.";

    displayPracticeTricks(currentPracticeTricks);
    showScreen(practiceScreen);
}


/* --------------------------------------------------
   Event listeners
-------------------------------------------------- */

modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        openSelectionScreen(button.dataset.mode);
    });
});


backHomeButton.addEventListener(
    "click",
    returnHome
);

clearSelectionButton.addEventListener(
    "click",
    clearSelections
);

startPracticeButton.addEventListener("click", () => {
    if (currentMode === "preliminary") {
        const roundOneTricks = getTricksFromIds(
            preliminaryRoundOneIds
        );

        openPracticeRound(1, roundOneTricks);
        return;
    }

    const finalsTricks = getTricksFromIds(
        selectedTrickIds
    );

    openPracticeRound(1, finalsTricks);
});


startTimerButton.addEventListener(
    "click",
    startPreparationCountdown
);


nextRoundButton.addEventListener("click", () => {
    const roundTwoTricks = getTricksFromIds(
        preliminaryRoundTwoIds
    );

    openPracticeRound(2, roundTwoTricks);
});


exitPracticeButton.addEventListener("click", () => {
    clearPracticeTimers();

    renderSelectionScreen();
    showScreen(selectionScreen);
});

practiceAgainButton.addEventListener("click", () => {
    landedTrickIds.clear();

    if (currentMode === "preliminary") {
        const roundOneTricks =
            getTricksFromIds(preliminaryRoundOneIds);

        openPracticeRound(1, roundOneTricks);
    } else {
        const finalsTricks =
            getTricksFromIds(selectedTrickIds);

        openPracticeRound(1, finalsTricks);
    }
});

newTricksButton.addEventListener("click", () => {
    landedTrickIds.clear();

    clearSelections();
    showScreen(selectionScreen);
});

resultsHomeButton.addEventListener(
    "click",
    returnHome
);


/* --------------------------------------------------
   Start application
-------------------------------------------------- */

async function startApp() {
    try {
        allTricks = await loadTricks();
    } catch (error) {
        console.error(error);

        showTableError(
            "There was a problem loading the trick database."
        );
    }
}


startApp();