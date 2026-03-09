export function titleCaseEyebrow(input: string) {
  const s = input.trim();
  if (!s) return "";

  return s
    .split(/\s+/g)
    .map((word) => {
      const raw = word;
      const lettersOnly = raw.replace(/[^A-Za-z0-9]/g, "");
      if (!lettersOnly) return raw;

      // Preserve acronyms / already-styled brand words
      const isAllCaps = /^[A-Z0-9]+$/.test(lettersOnly);
      const hasInnerCaps = /[A-Z].*[A-Z]/.test(lettersOnly) || (/[A-Z]/.test(lettersOnly) && /[a-z]/.test(lettersOnly));
      if (isAllCaps || hasInnerCaps) return raw;

      const lower = raw.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

