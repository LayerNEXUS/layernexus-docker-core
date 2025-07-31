// src/utils/mermaidUtils.js
import mermaid from "mermaid";
import { isMermaidValid } from "./mermaidValidator"; // your new utility

export async function renderMermaid(targetElement, mermaidText) {
  try {
    if (!targetElement || !mermaidText?.trim()) return;

    if (!isMermaidValid(mermaidText)) {
      targetElement.innerHTML = `<p class="text-red-600">Mermaid error: Invalid Mermaid syntax or unlinked nodes.</p>`;
      return;
    }

    targetElement.removeAttribute("data-processed");
    targetElement.innerHTML = mermaidText;

    await new Promise((resolve) => setTimeout(resolve, 0));
    await mermaid.init(undefined, targetElement);
  } catch (error) {
    console.error("💥 Mermaid rendering failed:", error);
    if (targetElement) {
      targetElement.innerHTML = `<p class="text-red-600">Mermaid error: ${error.message}</p>`;
    }
  }
}
