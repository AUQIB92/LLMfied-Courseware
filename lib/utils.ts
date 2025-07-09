import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Comprehensive LaTeX sanitizer that fixes common formatting issues
 * @param text - The text containing LaTeX to sanitize
 * @returns Sanitized text with properly formatted LaTeX
 */
export function sanitizeLaTeX(text: string): string {
  if (!text || typeof text !== "string") return "";

  return (
    text
      // Fix malformed fractions
      .replace(/@rac\s*\{(.*?)\}\s*\{(.*?)\}/g, "\\frac{$1}{$2}")
      .replace(
        /\\f\s*([A-Za-z0-9_]+)\s*\/\s*([A-Za-z0-9_]+)/g,
        "\\frac{$1}{$2}"
      )
      .replace(/\\f(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
      .replace(/\\\\f([A-Za-z0-9]+)/g, "\\frac{$1}")
      .replace(/\\f(?![a-zA-Z])/g, "")
      .replace(/rac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")

      // Fix malformed vector/arrow notations
      .replace(/\\ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\ec\{([^}]+)\}/g, "\\vec{$1}")
      .replace(/\\[^a-zA-Z0-9]?ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/→\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\vec\s+([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\overrightarrow\s+([A-Za-z]+)/g, "\\overrightarrow{$1}")

      // Fix malformed square roots
      .replace(/qrt\{([^}]+)\}/g, "\\sqrt{$1}")

      // Fix Greek and missing backslashes
      .replace(
        /(?<!\\)(frac|sqrt|sum|int|lim|log|exp|sin|cos|tan|text|oint|vec|overrightarrow)\s*\{/g,
        "\\$1{"
      )
      .replace(
        /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|pi|sigma|tau|phi|psi|omega|infty|mu_0)\b/g,
        "\\$1"
      )
      .replace(/μ/g, "\\mu")

      // Fix common physics variables
      .replace(/\bIenc\b/g, "I_{\\text{enc}}")

      // Fix summation and integration notation
      .replace(/(?<!\\)sum_\{([^}]+)\}\^\{([^}]+)\}/g, "\\sum_{$1}^{$2}")
      .replace(/(?<!\\)int_\{([^}]+)\}\^\{([^}]+)\}/g, "\\int_{$1}^{$2}")
      .replace(/(?<!\\)lim_\{([^}]+)\}/g, "\\lim_{$1}")

      // Prevent KaTeX from crashing on lonely commands
      .replace(/\\frac(?!\s*\{)/g, "")
      .replace(/\\sqrt(?!\s*\{)/g, "")

      // Fix double backslashes that might appear in JSON strings
      .replace(/\\\\frac/g, "\\frac")
      .replace(/\\\\sqrt/g, "\\sqrt")
      .replace(/\\\\sum/g, "\\sum")
      .replace(/\\\\int/g, "\\int")
      .replace(/\\\\vec/g, "\\vec")

      // Remove all invisible Unicode/control characters
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, "")
  );
}
