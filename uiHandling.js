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
