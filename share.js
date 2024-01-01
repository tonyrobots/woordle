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

function createShareableLink(word) {
  const encodedWord = btoa(word); // Encode in Base64
  const gameUrl = window.location.href.split("?")[0]; // Base URL of your game
  return `${gameUrl}?w=${encodedWord}`;
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
