export function generateResultText(word, statusMapHistory, feedbackStyle) {
  let resultText = "";
  statusMapHistory.forEach((statusMap) => {
    if (feedbackStyle === "alphabetical") {
      resultText += generateAlphabeticResultLine(statusMap) + "\n";
    } else {
      resultText += generateStandardResultLine(statusMap) + "\n";
    }
  });
  // leave out the word for now
  //   resultText += createShareableLink(word) + "\n";
  resultText += createShareableLink() + "\n";

  return resultText;
}

// function createShareableLink(word) {
//   const encodedWord = btoa(word); // Encode in Base64
//   // preserve the base url plus the variant query string ("v") if it exists
//   const gameUrl = window.location.href.split("?")[0]; // Base URL of your game
//   if (word === "") {
//     return `${gameUrl}`;
//   } else {
//     return `${gameUrl}?w=${encodedWord}`;
//   }
// }

function createShareableLink(word = "") {
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
        line += "🟩";
        break;
      case "bef":
        line += "➡️";
        break;
      case "aft":
        line += "⬅️";
        break;
      default:
        line += "⬜";
        break;
    }
  }
  return line;
}
