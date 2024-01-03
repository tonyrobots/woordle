import * as Ui from "./uiHandling.js";

export function shareGame(text, word = "") {
  if (navigator.share) {
    navigator
      .share({
        title: "Worderly!",
        text: text,
      })
      .then(() => console.log("Successful share"))
      .catch((error) => console.log("Error sharing:", error));
    console.log("navigator share activated, text: ", text, "word: ", word);
  } else {
    // Fallback for browsers that don't support the Web Share API
    navigator.clipboard
      .writeText(text)
      .then(() => Ui.displayMessage("Result copied to clipboard"))
      .catch((err) => console.error("Failed to copy:", err));
  }
}

export function generateResultText(word, statusMapHistory, feedbackStyle) {
  let resultText = "";
  statusMapHistory.forEach((statusMap) => {
    if (feedbackStyle === "alphabetical") {
      resultText += generateAlphabeticResultLine(statusMap) + "\n";
    } else {
      resultText += generateStandardResultLine(statusMap) + "\n";
    }
  });
  resultText += createShareableLink(word) + "\n";

  return resultText;
}

export function createShareableLink(word = "") {
  const encodedWord = btoa(word); // Encode in Base64
  const baseUrl = window.location.href.split("?")[0]; // Base URL of your game

  const urlParams = new URLSearchParams(window.location.search);
  const variant = urlParams.get("v"); // Get the variant parameter

  let shareUrl = baseUrl;

  if (variant) {
    shareUrl += `?v=${variant}`; // Include the variant parameter if it exists
  }

  if (word !== "") {
    // Append the word parameter, with an '&' if the variant parameter exists, '?' otherwise
    shareUrl += `${variant ? "&" : "?"}w=${encodedWord}`;
  }

  return shareUrl;
}

function generateStandardResultLine(statusMap) {
  // For standard variant
  let line = "";
  for (const status in statusMap) {
    switch (statusMap[status]) {
      case "correct":
        line += "🟩";
        break;
      case "present":
        line += "🟨";
        break;
      case "incorrect":
        line += "⬜";
        break;
      default:
        line += "";
        break;
    }
  }
  return line;
}

function generateAlphabeticResultLine(statusMap) {
  // statusMap is an array of evaluations for each letter like ['correct', 'before', 'after', ...]
  //   console.log(statusMap);
  let line = "";
  for (const status in statusMap) {
    switch (statusMap[status]) {
      case "correct":
        line += "🟢";
        break;
      case "bef":
        // line += "➡️";
        line += "🥶";
        break;
      case "aft":
        // line += "⬅️";
        line += "🥵";
        break;
      default:
        line += "⬜";
        break;
    }
  }
  return line;
}
