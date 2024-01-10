import { shareGame, generateResultText, createShareableLink } from "./share.js";
import * as Ui from "./uiHandling.js";

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  let variant = "standard";
  const gameVariant = urlParams.get("v");
  // 1 = standard
  // 2 = alphabetical
  // 3 = 6-letter
  // 4 = alphabetical, daily

  if (gameVariant) {
    if (gameVariant === "1") {
      variant = "standard";
    } else if (gameVariant === "2") {
      variant = "alpha";
      // document.getElementById("helpModal").style.display = "block";
    } else if (gameVariant === "3") {
      variant = "6-letter";
    } else if (gameVariant === "4") {
      variant = "alpha-daily";
      // document.getElementById("helpModal").style.display = "block";
    }
  } else {
    // set variant here
    //   let variant = "standard";
    variant = "alpha-daily";
    // document.getElementById("helpModal").style.display = "block";

    //   variant = "6-letter";
  }

  const standardKeyboardLayout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const alphabeticalKeyboardLayout = ["ABCDEFGHIJ", "KLMNOPQRS", "TUVWXYZ"];

  const now = new Date();

  let wordList = [];
  let validGuesses = [];
  let targetWord = "";
  let currentAttempt = 0;
  let currentInput = "";
  let focusCellIndex = 0;
  let statusMapHistory = [];
  let guesses = [];
  //  variables to track game state, TODO clean up
  let gameOver = false;
  let gameWon = false;

  // set standard settings
  let maxAttempts = 6;
  let letterCount = 5;
  let feedbackStyle = "standard";
  let name = "Wordlish";
  let dailyWord = false;
  let requireValidGuesses = true;

  // override with variant settings
  if (variant === "alpha") {
    feedbackStyle = "alphabetical";
    name = "Worderly";
    document.getElementById("subhead").textContent +=
      "practice mode, play as much as you want!";
  } else if (variant === "6-letter") {
    maxAttempts = 8;
    letterCount = 6;
    name = "Woordle";
  } else if (variant === "alpha-daily") {
    feedbackStyle = "alphabetical";
    name = "Worderly";
    dailyWord = true;
  }

  let letterRanges = Array(letterCount)
    .fill()
    .map(() => ({ min: "@", max: "[" })); // set min and max outside the A-Z range

  document.title = name;
  document.getElementById("gameName").textContent = name.toUpperCase();

  createGrid(letterCount, maxAttempts);
  generateKeyboardLayout();

  // load wordlist_{letterCount}.txt
  fetch("wordlists/wordlist_" + letterCount + ".txt")
    .then((response) => response.text())
    .then((text) => {
      wordList = text.split("\n").map((word) => word.trim().toUpperCase());
      startGame();
    })
    .catch((err) => console.error("Failed to load word list:", err));

  // Load valid guesses_{letterCount}.txt list
  if (requireValidGuesses) {
    fetch("wordlists/validguesses_" + letterCount + ".txt")
      .then((response) => response.text())
      .then((text) => {
        validGuesses = text
          .split("\n")
          .map((word) => word.trim().toUpperCase());
        console.log(validGuesses.length + " valid guesses loaded");
      })
      .catch((err) => console.error("Failed to load valid guesses list:", err));
  }

  document.addEventListener("keydown", handleKeyPress);

  function startGame() {
    if (variant == "alpha-daily") {
      // show help modal if it's been more than a week since last visit
      const lastVisitDate = localStorage.getItem("lastVisitDate");
      const lastVisitTime = lastVisitDate
        ? new Date(lastVisitDate).getTime()
        : 0;
      // const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds
      if (!lastVisitDate || now.getTime() - lastVisitTime > oneWeek) {
        document.getElementById("helpModal").style.display = "block";
      }

      localStorage.setItem("lastVisitDate", now.toISOString());

      // set subheader to today's date in format Month Day, Year
      // const today = new Date();
      const dateString = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      document.getElementById("subhead").textContent +=
        "daily puzzle for " + dateString;

      // check if daily game has been completed today
      const dailyCompletion = JSON.parse(
        localStorage.getItem("dailyGameCompleted")
      );
      const today = now.toDateString();
      if (
        dailyCompletion &&
        dailyCompletion.date === today &&
        dailyCompletion.completed
      ) {
        // set game to ended and show completion message
        gameOver = true;

        showCompletionMessage(dailyCompletion.message);
        // also show results modal
        // populateStatsHTML(variant);
        // showResultModal("title", "message", guesses, variant, true);
        return;
      }
    }

    // tag game start event
    gtag("event", "game_start", {
      event_category: "Game",
      event_label: "Start",
      game_variant: variant,
      game_name: name,
    });
    targetWord = "";
    currentAttempt = 0;
    currentInput = "";
    focusCellIndex = 0;
    statusMapHistory = [];
    guesses = [];
    gameOver = false;
    gameWon = false;
    //letter range?

    currentAttempt = 0;
    currentInput = "";

    // set target word
    if (dailyWord) {
      targetWord = getTodaysWord().toUpperCase();
    } else if (getWordFromUrl()) {
      targetWord = getWordFromUrl().toUpperCase();
    } else {
      targetWord = getRandomWord();
    }
    // console.log(targetWord);
    clearGrid();
    clearKeyboard();

    // Additional initialization logic can go here
    gameOver = false; // Reset game state when starting a new game
  }

  function getRandomWord() {
    return wordList.length > 0
      ? wordList[Math.floor(Math.random() * wordList.length)]
      : "ERRORS";
  }

  function getTodaysWord() {
    const index = Ui.getTodaysWordIndex() % wordList.length; // Use modulo to loop back to start
    return wordList[index];
  }

  function clearGrid() {
    for (let i = 0; i < maxAttempts; i++) {
      for (let j = 0; j < letterCount; j++) {
        const cell = document.getElementById(`cell${i}-${j}`);
        const front = cell.querySelector(".front");
        const back = cell.querySelector(".back");

        front.textContent = "";
        back.textContent = "";
        back.className = "back"; // Reset classes

        cell.classList.remove("flip", "correct", "present", "incorrect");
      }
    }
    document.getElementById("playAgain").innerHTML = "";
  }

  function clearKeyboard() {
    document.querySelectorAll(".key").forEach((key) => {
      key.classList.remove("correct", "present", "incorrect");
    });
  }

  function handleKeyPress(e) {
    // Ignore clicks if game is over
    if (gameOver) {
      return;
    }

    if (currentAttempt < maxAttempts && e.key.match(/^[a-z]$/i)) {
      // Convert the currentInput string to an array for easy manipulation
      while (currentInput.length < letterCount) {
        currentInput += " ";
      }
      let inputArray = currentInput.split("");

      // Insert or replace the character at the focus position
      inputArray[focusCellIndex] = e.key.toUpperCase();

      // Convert the array back to a string
      currentInput = inputArray.join("").trimEnd();

      if (focusCellIndex < letterCount - 1) {
        updateFocus(focusCellIndex + 1);
      }
      updateGrid();
    } else if (e.key === "Backspace") {
      // Convert the currentInput string to an array for easy manipulation
      let inputArray = currentInput.split("");

      // if current focus cell is empty, just move focus to the previous cell
      if (
        inputArray[focusCellIndex] === " " ||
        inputArray[focusCellIndex] === undefined
      ) {
        updateFocus(Math.max(0, focusCellIndex - 1));
      }
      if (inputArray[focusCellIndex] !== " ") {
        // if current focus cell is not empty, delete the current cell and don't move focus
        inputArray[focusCellIndex] = " ";
      }

      // Convert the array back to a string
      currentInput = inputArray.join("");

      updateGrid();
    } else if (e.key === "Enter" && currentInput.length === letterCount) {
      submitGuess(currentInput);
      currentInput = "";
      // wait 1 second before clearing the grid
      setTimeout(() => {
        updateGrid();
      }, 1000);
    } else if (e.key === "?") {
      // show help modal
      document.getElementById("helpModal").style.display = "block";
    }
    // focusCellIndex = currentInput.length;
    if (focusCellIndex < letterCount) {
      updateKeyboardForLetterPosition(focusCellIndex);
    }
  }
  function handleKeyClick(keyValue) {
    let value = keyValue;
    if (value === "⌫") {
      value = "Backspace";
    } else if (value === "Enter") {
      value = "Enter";
    }
    handleKeyPress({ key: value });
  }

  function updateGrid() {
    // return if game is over
    if (gameOver) {
      return;
    }

    for (let i = 0; i < letterCount; i++) {
      const cellId = `cell${currentAttempt}-${i}`;
      const cell = document.getElementById(cellId);

      if (cell) {
        const front = cell.querySelector(".front");
        if (front) {
          front.textContent = currentInput[i] || "";
        } else {
          console.error(`Front not found in cell ${cellId}`);
        }

        // Do not remove classes here; they should be handled in updateGridStatus
      } else {
        console.error(`Cell not found: ${cellId}`);
      }
    }
  }

  function submitGuess(guess) {
    if (!gameOver && currentAttempt < maxAttempts) {
      let statusMap = {};
      let targetWordCopy = targetWord;
      let correctCount = 0;
      guess = guess.toUpperCase().trim();

      //   Check if the guess is a valid word
      if (!validGuesses.includes(guess)) {
        Ui.displayMessage("that's not a word", true);
        updateFocus(0);

        return; // Do not proceed further
      }

      // add guess to guesses array
      guesses.push(guess);

      // console feedback for Alex's solver
      let consoleFeedback = "";

      if (feedbackStyle === "alphabetical") {
        // Alphabetical variant logic
        updateKeyboardForLetterPosition(0);

        for (let i = 0; i < letterCount; i++) {
          const guessedLetter = guess[i];
          const correctLetter = targetWord[i];
          if (guessedLetter === correctLetter) {
            statusMap[i] = "correct";
            correctCount++;
            consoleFeedback += "0";
          } else if (guessedLetter < correctLetter) {
            statusMap[i] = "bef"; // Guessed letter comes before alphabetically
            consoleFeedback += "1";
          } else {
            statusMap[i] = "aft"; // Guessed letter comes after alphabetically
            consoleFeedback += "-1";
          }
          consoleFeedback += ",";
        }
      } else {
        // First pass: Mark correct letters
        for (let i = 0; i < letterCount; i++) {
          if (guess[i] === targetWord[i]) {
            statusMap[i] = "correct";
            targetWordCopy = replaceAt(targetWordCopy, i, "_");
            correctCount++;
          }
        }

        // Second pass: Mark present and incorrect letters
        for (let i = 0; i < letterCount; i++) {
          if (!statusMap[i]) {
            if (targetWordCopy.includes(guess[i])) {
              statusMap[i] = "present";
              // targetWordCopy = targetWordCopy.replace(guess[i], "_");
              let indexOfLetter = targetWordCopy.indexOf(guess[i]);
              targetWordCopy = replaceAt(targetWordCopy, indexOfLetter, "_");
            } else {
              statusMap[i] = "incorrect";
            }
          }
        }
        // After determining the status of each letter
        for (let i = 0; i < letterCount; i++) {
          //   updateKeyboardStatus(guess[i], statusMap[i] || "incorrect");
          updateKeyboardStatus(guess[i], statusMap[i]);
        }
      }

      statusMapHistory.push(statusMap);

      // Win condition
      if (correctCount === letterCount) {
        updateGridStatus(guess, statusMap);
        const winMessages = [
          "Spectacular!",
          "Top notch!",
          "Woohoo!",
          "Nice one!",
          "Not bad!",
          "Phew!",
        ];
        // Set timeout for confetti/message to trigger after flip animations
        setTimeout(() => {
          Ui.displayMessage(winMessages[guesses.length - 1]);
          Ui.triggerConfetti();
          endGame();
        }, 1000);
        return;
      }
      updateGridStatus(guess, statusMap);

      currentAttempt++;
      if (currentAttempt === maxAttempts) {
        Ui.displayMessage(`Sorry, you lose. The word was ${targetWord}.`);
        gameOver = true; // Set gameOver to true when the game ends
        endGame(false);
        return;
      }
      updateFocus(0); // back to the beginning

      if (feedbackStyle === "alphabetical") {
        updateLetterRanges(guess, statusMap, currentAttempt % letterCount);
        // remove trailing "," from consoleFeedback
        consoleFeedback = consoleFeedback.slice(0, -1);
        console.log(consoleFeedback);
      }
    }
  }

  function updateGridStatus(guess, statusMap) {
    for (let i = 0; i < letterCount; i++) {
      const cell = document.getElementById(`cell${currentAttempt}-${i}`);
      const back = cell.querySelector(".back");

      if (!cell || !back) {
        console.error(`Cell or back not found for cell ${i}`);
        continue;
      }

      // Reset content and classes
      back.textContent = guess[i];
      back.innerHTML = guess[i]; // Ensure any existing overlay is cleared
      cell.classList.remove(
        "correct",
        "present",
        "incorrect",
        "bef",
        "aft",
        "possible",
        "impossible"
      );

      back.classList.add(statusMap[i] || "incorrect");
      if (feedbackStyle === "alphabetical") {
        if (statusMap[i] === "bef") {
          // Overlay '>' symbol
          //   back.innerHTML += '<span class="overlay">&gt;</span>';
          // add dot before
          //   displayContent = "•" + displayContent; // Dot before the letter
        } else if (statusMap[i] === "aft") {
          // Overlay '<' symbol
          //   back.innerHTML += '<span class="overlay">&lt;</span>';
          //   // add dot after
          //   displayContent += "•"; // Dot after the letter
        }
      }

      // Trigger the flip animation
      setTimeout(() => {
        cell.classList.add("flip");
      }, i * 180); // Delay for cascading effect
    }
  }

  function updateKeyboardStatus(letter, status) {
    const keyElement = document.getElementById(`key-${letter}`);
    // const keyElement = document.getElementsByClassName(`key ${letter}`);

    if (keyElement && !keyElement.classList.contains("correct")) {
      keyElement.classList.add(status);
    }
  }

  // for alphabetical only
  function updateLetterRanges(guess, statusMap, currentPosition) {
    for (let i = 0; i < letterCount; i++) {
      //   if (i === currentPosition) {
      if (statusMap[i] === "aft" && guess[i] < letterRanges[i].max) {
        letterRanges[i].max = guess[i];
      } else if (statusMap[i] === "bef" && guess[i] > letterRanges[i].min) {
        letterRanges[i].min = guess[i];
      } else if (statusMap[i] === "correct") {
        letterRanges[i].min = guess[i];
        letterRanges[i].max = guess[i];
      }
      //   }
    }
  }
  function updateKeyboardForLetterPosition(currentPosition) {
    if (feedbackStyle !== "alphabetical") return;
    const currentRange = letterRanges[currentPosition];
    document.querySelectorAll(".key").forEach((keyElement) => {
      const letter = keyElement.textContent; // or keyElement.getAttribute('data-letter') if you use data attributes
      if (letter !== "Enter" && letter !== "⌫") {
        if (letter <= currentRange.min || letter >= currentRange.max) {
          keyElement.classList.add("impossible"); // Highlight as impossible
        } else {
          keyElement.classList.remove("impossible");
          keyElement.classList.remove("correct");
        }
        if (currentRange.min === currentRange.max) {
          if (currentRange.min === letter) {
            keyElement.classList.add("correct"); // Highlight as correct
            keyElement.classList.remove("impossible");
          } else {
            keyElement.classList.add("impossible"); // Highlight as impossible
          }
        }
      }
    });
  }

  function getFocusedCell() {
    return document.getElementById(`cell${currentAttempt}-${focusCellIndex}`);
  }

  function updateFocus(newFocusCellIndex) {
    // remove focus class from all cells
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("cell-focused");
    });
    let currentRow = currentAttempt;
    // ID for the previously focused cell
    const oldFocusCellId = `cell${currentRow}-${focusCellIndex}`;

    // Remove focus from the previously focused cell
    if (focusCellIndex !== null) {
      const oldFocusCell = document.getElementById(oldFocusCellId);
      if (oldFocusCell) {
        oldFocusCell.classList.remove("cell-focused");
      }
    }

    // Update the focus cell index
    focusCellIndex = newFocusCellIndex;

    // ID for the new focus cell
    const newFocusCellId = `cell${currentRow}-${focusCellIndex}`;

    // Apply focus to the new cell
    const newFocusCell = document.getElementById(newFocusCellId);
    if (newFocusCell) {
      newFocusCell.classList.add("cell-focused");
    } else {
      console.error("New focus cell not found: ", newFocusCellId);
    }

    updateKeyboardForLetterPosition(focusCellIndex);
  }

  function replaceAt(string, index, replacement) {
    return (
      string.substr(0, index) +
      replacement +
      string.substr(index + replacement.length)
    );
  }

  function endGame(won = true) {
    gameOver = true; // Set gameOver to true when the game ends
    gameWon = won;
    let endMessage,
      endTitle = "";
    if (won) {
      endTitle = "Nice work!";
      endMessage = `You found the word ${targetWord} in ${
        statusMapHistory.length
      } ${statusMapHistory.length === 1 ? "guess!" : "guesses."}`;
    } else {
      endTitle = "Better luck next time.";
      endMessage = `Sorry, you failed to find the word ${targetWord} in ${statusMapHistory.length} guesses.`;
    }
    // update stats
    updateStats(won, statusMapHistory.length, variant);
    populateStatsHTML(variant);

    // event tracking
    gtag("event", "game_end", {
      event_category: "Game",
      event_label: "End",
      game_won: won,
      guess_count: statusMapHistory.length,
      game_variant: variant,
      game_name: name,
    });

    setTimeout(() => {
      showResultModal(
        // `${statusMapHistory.length}/${maxAttempts}`,
        endTitle,
        endMessage,
        guesses,
        variant,
        won
      );
    }, 2500);

    // add link to play again
    // const gameUrl = window.location.href.split("?")[0]; // Base URL

    // document.getElementById(
    //   "playAgain"
    // ).innerHTML = `<a href="${gameUrl}">Play Again</a>`;
  }

  function createGrid(letterCount, maxAttempts) {
    const gridContainer = document.getElementById("grid");
    gridContainer.innerHTML = ""; // Clear existing grid if any

    for (let row = 0; row < maxAttempts; row++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "row";

      for (let col = 0; col < letterCount; col++) {
        const cellDiv = document.createElement("div");
        cellDiv.className = "cell";
        cellDiv.id = `cell${row}-${col}`;
        cellDiv.addEventListener("click", () => updateFocus(col));

        const frontDiv = document.createElement("div");
        frontDiv.className = "front";

        const backDiv = document.createElement("div");
        backDiv.className = "back";

        cellDiv.appendChild(frontDiv);
        cellDiv.appendChild(backDiv);
        rowDiv.appendChild(cellDiv);
      }

      gridContainer.appendChild(rowDiv);
    }
  }

  function generateKeyboardLayout(feedbackStyle = "standard") {
    let layout;
    if (feedbackStyle === "alphabetic") {
      //todo update with separate keyboard style variant option
      layout = alphabeticalKeyboardLayout;
    } else {
      layout = standardKeyboardLayout;
    }

    const keyboardContainer = document.getElementById("keyboard");
    keyboardContainer.innerHTML = ""; // Clear existing keyboard

    layout.forEach((row, rowIndex) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "keyboard-row";

      // Add "Enter" at the start of the third row
      if (rowIndex === 2) {
        const enterKey = document.createElement("button");
        enterKey.className = "key enter";
        enterKey.textContent = "Enter";
        enterKey.id = "key-Enter";
        enterKey.addEventListener("click", () => handleKeyClick("Enter"));
        rowDiv.appendChild(enterKey);
      }

      row.split("").forEach((key) => {
        const keyButton = document.createElement("button");
        keyButton.className = "key";
        keyButton.textContent = key;
        keyButton.id = `key-${key}`;
        keyButton.addEventListener("click", () => handleKeyClick(key));
        rowDiv.appendChild(keyButton);
      });

      // Add "Backspace" at the end of the last row
      if (rowIndex === layout.length - 1) {
        const backspaceKey = document.createElement("button");
        backspaceKey.className = "key backspace";
        backspaceKey.textContent = "⌫";
        backspaceKey.id = "key-Backspace";
        backspaceKey.addEventListener("click", () => handleKeyClick("⌫"));
        rowDiv.appendChild(backspaceKey);
      }
      keyboardContainer.appendChild(rowDiv);
    });
  }

  function getWordFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedWord = urlParams.get("w");
    if (encodedWord) {
      return atob(encodedWord); // Decode from Base64
    }
    return null; // or default word
  }

  const resultModal = document.getElementById("resultModal");
  const helpModal = document.getElementById("helpModal");
  const scoreElement = document.getElementById("gameScore");
  const resultHeaderElement = document.getElementById("resultHeader");
  const resultTextElement = document.getElementById("resultText");
  // const shareButton = document.getElementById("shareButton");

  // Function to show the modal with the game's score
  function showResultModal(endTitle, endText, guesses, variant, won) {
    resultHeaderElement.textContent = `${endTitle}`;
    resultTextElement.textContent = `${endText}`;

    // hide play again button if daily variant
    if (dailyWord) {
      document.getElementById("playAgainButton").style.display = "none";
    }

    // show completion message, and set completed localStorage if daily variant
    if (dailyWord) {
      showCompletionMessage();
      storeDailyCompletion(endText);
    }

    resultModal.style.display = "block";
  }

  // Add event listener to the share buttons
  const shareButtons = document.querySelectorAll(".share-button");
  shareButtons.forEach((button) => {
    button.addEventListener("click", shareClicked);
  });

  // shareButton.addEventListener("click", () => {
  //   shareClicked();
  // });

  function shareClicked(event) {
    // needs name, gameWon, statusMapHistory, maxAttempts, targetWord, feedbackStyle
    // of which, only gameWon and statusMapHistory should be needed
    let resultText = `${name}  - ${
      gameWon ? statusMapHistory.length : "X"
    }/${maxAttempts} \n`;
    // add word to share link, unless daily variant
    let shareWord = "";
    if (!dailyWord) {
      shareWord = targetWord;
    }
    resultText += generateResultText(
      shareWord,
      statusMapHistory,
      feedbackStyle
    );
    shareGame(resultText, shareWord);
  }

  // add event listener to the play again button
  document.getElementById("playAgainButton").addEventListener("click", () => {
    // reload the page, without the "w" parameter
    console.log("reloading");
    // window.location = window.location.href.split("?")[0];
    window.location = createShareableLink();
  });
  // Close modal
  //   closeModal.addEventListener("click", () => {
  //     modal.style.display = "none";
  //   });
  const closeButtons = document.querySelectorAll(".close-modal-button");
  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  function closeModal(event) {
    let modal = event.target.closest(".modal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  function storeDailyCompletion(message) {
    console.log("storing daily completion");
    // const today = new Date().toDateString();
    const today = now.toDateString();
    localStorage.setItem(
      "dailyGameCompleted",
      JSON.stringify({ date: today, completed: true, message: message })
    );
  }
  function showCompletionMessage(message = "") {
    const completionMessage = document.getElementById("completionMessage");
    completionMessage.style.display = "block";
    // append the dynamic message to the completionMessage div
    // completionMessage.innerHTML += message;

    // set the p id completedMessage to the dynamic message
    document.getElementById("completedMessage").textContent = message;

    document.getElementById("grid-container").style.display = "none"; // Hide the grid
    document.getElementById("keyboard").style.display = "none"; // Hide the keyboard
  }

  function updateStats(isWin, guessCount, variant = "daily") {
    const statsName = "worderlyStats-" + variant;
    // Retrieve existing stats or initialize if not present
    let stats = JSON.parse(localStorage.getItem(statsName)) || {
      gamesPlayed: 0,
      wins: 0,
      guessDistribution: Array(7).fill(0), // Indices 1-6 for guesses, index 0 for losses
      currentStreak: 0,
      longestStreak: 0,
      playerSince: now.toISOString().split("T")[0], // Only set this once
    };

    // Update stats
    stats.gamesPlayed++;
    if (isWin) {
      stats.wins++;
      stats.guessDistribution[guessCount]++;
      stats.currentStreak++;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
    } else {
      stats.guessDistribution[0]++; // Increment losses
      stats.currentStreak = 0;
    }

    localStorage.setItem(statsName, JSON.stringify(stats));
  }

  function populateStatsHTML(variant = "daily") {
    const stats = JSON.parse(localStorage.getItem("worderlyStats-" + variant));
    if (variant === "alpha") {
      document.getElementById("statsHeader").textContent =
        "Practice Statistics";
    }

    if (stats) {
      // Update simple stats
      document.getElementById("gamesPlayed").textContent = stats.gamesPlayed;
      document.getElementById("wins").textContent = stats.wins;

      document.getElementById("winPercent").textContent =
        ((stats.wins / stats.gamesPlayed) * 100).toFixed(0) + "%";
      document.getElementById("currentStreak").textContent =
        stats.currentStreak;
      document.getElementById("maxStreak").textContent = stats.longestStreak;

      // Update guess distribution histogram
      const guessDistributionContainer =
        document.getElementById("guessDistribution");
      guessDistributionContainer.innerHTML = ""; // Clear previous bars
      stats.guessDistribution.forEach((count, index) => {
        // skip losses
        if (index === 0) {
          return;
        }
        const bar = document.createElement("div");
        bar.className = "bar";
        const label = document.createElement("span");
        label.textContent = index;
        const progressBar = document.createElement("div");
        progressBar.className = "progress";
        progressBar.style.width = `${
          (count / Math.max(...stats.guessDistribution)) * 100
        }%`; // Scale based on max
        if (count > 0) {
          progressBar.textContent = count;
        }
        bar.appendChild(label);
        bar.appendChild(progressBar);
        guessDistributionContainer.appendChild(bar);
      });
    }
  }
});

document.addEventListener(
  "dblclick",
  function (event) {
    event.preventDefault();
  },
  { passive: false }
);
