export function triggerConfetti() {
  confetti({
    particleCount: 200,
    spread: 80,
    origin: { y: 0.6 },
  });
}

export function displayMessage(message, isError = false) {
  const messageElement = document.getElementById("gameMessage");
  messageElement.textContent = message;
  messageElement.style.display = "block"; // Make the bubble visible
  //   messageElement.style.transform = "translateX(0)"; // Reset transform

  if (isError) {
    messageElement.style.animation = "shake 1.5s";
  } else {
    messageElement.style.animation = "fadeInOut 3s";
  }

  // Adjust the timeout duration based on the animation
  const timeoutDuration = isError ? 1500 : 3000;
  setTimeout(() => {
    messageElement.style.display = "none";
    messageElement.style.animation = "none"; // Reset the animation
  }, timeoutDuration);
}

export function hashDate(date) {
  var hash = 0;
  for (var i = 0; i < date.length; i++) {
    var character = date.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getTodaysWordIndex() {
  const today = new Date();
  const dateString =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  const hashedDate = hashDate(dateString);

  return hashedDate;
}
