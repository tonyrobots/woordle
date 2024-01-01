const standardKeyboardLayout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const alphabeticalKeyboardLayout = ["ABCDEFGHIJ", "KLMNOPQRS", "TUVWXYZ"];

export function generateKeyboardLayout(feedbackStyle = "standard") {
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

export function triggerConfetti() {
  confetti({
    particleCount: 200,
    spread: 80,
    origin: { y: 0.6 },
  });
}

export function displayMessage(message) {
  const messageElement = document.getElementById("gameMessage");
  messageElement.textContent = message;
  messageElement.style.display = "block"; // Make the bubble visible
  messageElement.style.animation = "fadeInOut 3s";

  // Hide the message after the animation is complete
  setTimeout(() => {
    messageElement.style.display = "none";
  }, 3000); // This should match the duration of the animation
}
