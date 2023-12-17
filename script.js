document.addEventListener("DOMContentLoaded", () => {
  let wordList = [];
  fetch("wordlist.txt")
    .then((response) => response.text())
    .then((text) => {
      wordList = text.split("\n").map((word) => word.trim().toUpperCase());
      startGame();
    })
    .catch((err) => console.error("Failed to load word list:", err));

  const targetWord = getRandomWord().toUpperCase();
  let currentAttempt = 0;
  const maxAttempts = 8;
  let currentInput = "";

  document.addEventListener("keydown", handleKeyPress);

  document.getElementById("submitGuess").addEventListener("click", () => {
    const guess = document.getElementById("userInput").value.toUpperCase();
    if (guess.length === 6) {
      submitGuess(guess);
      document.getElementById("userInput").value = ""; // Clear the input field after each guess
    } else {
      alert("Please enter a 6 letter word");
    }
  });

  function getRandomWord() {
    if (wordList.length === 0) {
      return "WHOOPS"; // Fallback word in case the list fails to load
    }
    return wordList[Math.floor(Math.random() * wordList.length)];
  }

  function handleKeyPress(e) {
    if (currentAttempt < maxAttempts) {
      if (e.key.match(/^[a-z]$/i) && currentInput.length < 6) {
        // Add letter to current input
        currentInput += e.key.toUpperCase();
        updateGrid();
      } else if (e.key === "Backspace") {
        // Remove last letter from current input
        currentInput = currentInput.slice(0, -1);
        updateGrid();
      } else if (e.key === "Enter" && currentInput.length === 6) {
        submitGuess(currentInput);
        currentInput = ""; // Reset current input
      }
    }
  }

  function updateGrid() {
    // Update the current row based on currentInput
    for (let i = 0; i < 6; i++) {
      const cellId = `cell${currentAttempt}-${i}`;
      const cell = document.getElementById(cellId);
      cell.textContent = currentInput[i] || "";
      cell.classList.remove("correct", "present", "incorrect");
    }
  }

  function displayMessage(message) {
    const messageElement = document.getElementById("gameMessage");
    messageElement.textContent = message;
  }
  function submitGuess(guess) {
    if (currentAttempt < maxAttempts) {
      let targetWordCopy = targetWord; // Copy of the target word for tracking letters

      // First pass: mark correct letters
      for (let i = 0; i < 6; i++) {
        const letter = guess[i];
        const cellId = `cell${currentAttempt}-${i}`;
        const cell = document.getElementById(cellId);
        cell.textContent = letter;

        if (targetWord[i] === letter) {
          cell.classList.add("correct");
          // Replace the letter in the copy with a placeholder to avoid double marking
          targetWordCopy = targetWordCopy.replace(letter, "_");
        }
      }

      // Second pass: mark present letters
      for (let i = 0; i < 6; i++) {
        const letter = guess[i];
        const cellId = `cell${currentAttempt}-${i}`;
        const cell = document.getElementById(cellId);

        if (!cell.classList.contains("correct")) {
          if (targetWordCopy.includes(letter)) {
            cell.classList.add("present");
            // Replace the first occurrence of the letter in the copy with a placeholder
            targetWordCopy = targetWordCopy.replace(letter, "_");
          } else {
            cell.classList.add("incorrect");
          }
        }
      }

      if (guess === targetWord) {
        displayMessage("Congratulations! You guessed the word!");
        return;
      }

      currentAttempt++;
    }

    if (currentAttempt === maxAttempts) {
      displayMessage(`Game over! The word was ${targetWord}.`);
    }
  }
});
