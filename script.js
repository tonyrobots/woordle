document.addEventListener("DOMContentLoaded", () => {
  // set variant here
  let variant = "standard";
  //   variant = "gt-lt";
  //   variant = "6-letter";

  let wordList = [];
  let targetWord = "";
  let currentAttempt = 0;
  let currentInput = "";
  let focusCellIndex = 0;
  let gameOver = false; //  variable to track game state
  const standardKeyboardLayout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  const alphabeticalKeyboardLayout = ["ABCDEFGHIJ", "KLMNOPQRS", "TUVWXYZ"];

  // set standard settings
  let maxAttempts = 6;
  let letterCount = 5;
  let feedbackStyle = "standard";
  let name = "Wordlish";
  let requireValidGuesses = true;

  // override with variant settings
  if (variant === "gt-lt") {
    feedbackStyle = "alphabetical";
    name = "Wordlish";
  } else if (variant === "6-letter") {
    maxAttempts = 8;
    letterCount = 6;
    name = "Woordle";
    let requireValudGuesses = false;
  }

  let letterRanges = Array(letterCount)
    .fill()
    .map(() => ({ min: "@", max: "[" })); // set min and max outside the A-Z range

  document.title = name + " - a Wordle Variant";
  document.getElementById("gameName").textContent = name;

  createGrid();
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
    currentAttempt = 0;
    currentInput = "";
    targetWord = getRandomWord();
    // console.log(targetWord);
    clearGrid();
    clearKeyboard();
    // Additional initialization logic can go here
    gameOver = false; // Reset game state when starting a new game
  }

  function getRandomWord() {
    return wordList.length > 0
      ? wordList[Math.floor(Math.random() * wordList.length)]
      : "WHOOPS";
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
        displayMessage("Not a valid word");
        // console.log("Guess: " + guess + " is not a valid word");
        updateFocus(0);
        return; // Do not proceed further
      }

      if (feedbackStyle === "alphabetical") {
        // Alphabetical variant logic
        updateKeyboardForLetterPosition(0);

        for (let i = 0; i < letterCount; i++) {
          const guessedLetter = guess[i];
          const correctLetter = targetWord[i];
          if (guessedLetter === correctLetter) {
            statusMap[i] = "correct";
            correctCount++;
          } else if (guessedLetter < correctLetter) {
            statusMap[i] = "bef"; // Guessed letter comes before alphabetically
          } else {
            statusMap[i] = "aft"; // Guessed letter comes after alphabetically
          }
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
      // Win condition
      if (correctCount === letterCount) {
        updateGridStatus(guess, statusMap);
        // Set timeout for confetti to trigger after flip animations
        setTimeout(() => {
          displayMessage("Woohoo!");
          triggerConfetti();
        }, 1000);
        gameOver = true; // Set gameOver to true when the game ends
        return;
      }
      updateGridStatus(guess, statusMap);

      currentAttempt++;
      if (currentAttempt === maxAttempts) {
        displayMessage(`Game over! The word was ${targetWord}.`);
        gameOver = true; // Set gameOver to true when the game ends
      }
      updateFocus(0); // back to the beginning

      if (feedbackStyle === "alphabetical") {
        updateLetterRanges(guess, statusMap, currentAttempt % letterCount);
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

  function displayMessage(message) {
    const messageElement = document.getElementById("gameMessage");
    messageElement.textContent = message;
    messageElement.style.display = "block"; // Make the bubble visible
    messageElement.style.animation = "fadeInOut 3s";

    // Hide the message after the animation is complete
    setTimeout(() => {
      messageElement.style.display = "none";
    }, 3000); // This should match the duration of the animation
  }

  function replaceAt(string, index, replacement) {
    return (
      string.substr(0, index) +
      replacement +
      string.substr(index + replacement.length)
    );
  }

  function createGrid() {
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

  function generateKeyboardLayout() {
    let layout;
    if (feedbackStyle === "xxx") {
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

  function triggerConfetti() {
    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.6 },
    });
  }
});

document.addEventListener(
  "dblclick",
  function (event) {
    event.preventDefault();
  },
  { passive: false }
);
