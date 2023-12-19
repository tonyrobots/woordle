document.addEventListener("DOMContentLoaded", () => {
  let wordList = [];
  let targetWord = "";
  let currentAttempt = 0;
  const maxAttempts = 8;
  let currentInput = "";
  let gameOver = false; //  variable to track game state

  fetch("wordlist.txt")
    .then((response) => response.text())
    .then((text) => {
      wordList = text.split("\n").map((word) => word.trim().toUpperCase());
      startGame();
    })
    .catch((err) => console.error("Failed to load word list:", err));

  // Load valid guesses list
  fetch("validguesses.txt")
    .then((response) => response.text())
    .then((text) => {
      validGuesses = text.split("\n").map((word) => word.trim().toUpperCase());
    })
    .catch((err) => console.error("Failed to load valid guesses list:", err));

  document.addEventListener("keydown", handleKeyPress);
  document.querySelectorAll(".key").forEach((key) => {
    key.addEventListener("click", () => handleKeyClick(key.textContent));
  });

  function startGame() {
    currentAttempt = 0;
    currentInput = "";
    targetWord = getRandomWord();
    console.log(targetWord);
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
      for (let j = 0; j < 6; j++) {
        const cell = document.getElementById(`cell${i}-${j}`);
        cell.textContent = "";
        cell.classList.remove("correct", "present", "incorrect");
      }
    }
    document.getElementById("gameMessage").textContent = "";
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
    if (
      currentAttempt < maxAttempts &&
      e.key.match(/^[a-z]$/i) &&
      currentInput.length < 6
    ) {
      currentInput += e.key.toUpperCase();
      updateGrid();
    } else if (e.key === "Backspace") {
      currentInput = currentInput.slice(0, -1);
      updateGrid();
    } else if (e.key === "Enter" && currentInput.length === 6) {
      submitGuess(currentInput);
      currentInput = "";
    }
  }

  function handleKeyClick(keyValue) {
    // Ignore clicks if game is over
    if (gameOver) {
      return;
    }
    if (keyValue === "⌫") {
      currentInput = currentInput.slice(0, -1);
    } else if (keyValue === "Enter") {
      if (currentInput.length === 6) {
        submitGuess(currentInput);
        currentInput = "";
      }
    } else if (currentInput.length < 6) {
      currentInput += keyValue;
    }
    updateGrid();
  }

  function updateGrid() {
    for (let i = 0; i < 6; i++) {
      const cellId = `cell${currentAttempt}-${i}`;
      const cell = document.getElementById(cellId);
      cell.textContent = currentInput[i] || "";
      cell.classList.remove("correct", "present", "incorrect");
    }
  }

  function submitGuess(guess) {
    if (!gameOver && currentAttempt < maxAttempts) {
      let statusMap = {};
      let targetWordCopy = targetWord;
      let correctCount = 0;

      // First pass: Mark correct letters
      for (let i = 0; i < 6; i++) {
        if (guess[i] === targetWord[i]) {
          statusMap[i] = "correct";
          targetWordCopy = replaceAt(targetWordCopy, i, "_");
          correctCount++;
        }
      }

      // Win condition
      if (correctCount === 6) {
        updateGridStatus(guess, statusMap);
        displayMessage("Congratulations! You guessed the word!");
        gameOver = true; // Set gameOver to true when the game ends
        return;
      }

      // Second pass: Mark present and incorrect letters
      for (let i = 0; i < 6; i++) {
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

      updateGridStatus(guess, statusMap);

      currentAttempt++;
      if (currentAttempt === maxAttempts) {
        displayMessage(`Game over! The word was ${targetWord}.`);
        gameOver = true; // Set gameOver to true when the game ends
      }
    }
  }

  function updateGridStatus(guess, statusMap) {
    // for (let i = 0; i < 6; i++) {
    //   const cell = document.getElementById(`cell${currentAttempt}-${i}`);
    //   cell.textContent = guess[i];
    //   cell.classList.add(statusMap[guess[i]] || "incorrect");
    //   updateKeyboardStatus(guess[i], statusMap[guess[i]] || "incorrect");
    // }
    for (let i = 0; i < 6; i++) {
      const cell = document.getElementById(`cell${currentAttempt}-${i}`);
      cell.textContent = guess[i];
      const status = statusMap[i] || "incorrect";
      cell.classList.add(status);
      updateKeyboardStatus(guess[i], status);
    }
  }

  function updateKeyboardStatus(letter, status) {
    const keyElement = document.getElementById(`key-${letter}`);
    if (keyElement && !keyElement.classList.contains("correct")) {
      keyElement.classList.add(status);
    }
  }

  function displayMessage(message) {
    const messageElement = document.getElementById("gameMessage");
    messageElement.textContent = message;
  }
  function replaceAt(string, index, replacement) {
    return (
      string.substr(0, index) +
      replacement +
      string.substr(index + replacement.length)
    );
  }
});
