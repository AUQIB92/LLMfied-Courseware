import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Comprehensive LaTeX sanitizer that fixes common formatting issues
 * Enhanced for ExamGenius content with better pattern matching
 * @param text - The text containing LaTeX to sanitize
 * @returns Sanitized text with properly formatted LaTeX
 */
export function sanitizeLaTeX(text: string): string {
  if (!text || typeof text !== "string") return "";

  return (
    text
      // 🔧 Fix malformed fractions - Enhanced patterns for ExamGenius
      .replace(/@rac\s*\{(.*?)\}\s*\{(.*?)\}/g, "\\frac{$1}{$2}")
      .replace(/rac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
      .replace(/\\f\s*([A-Za-z0-9_]+)\s*\/\s*([A-Za-z0-9_]+)/g, "\\frac{$1}{$2}")
      .replace(/\\f(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}")
      .replace(/\\\\f([A-Za-z0-9]+)/g, "\\frac{$1}")
      .replace(/\\f(?![a-zA-Z])/g, "")
      
      // 🔧 Fix missing backslashes in fractions (most common issue)
      .replace(/(?<!\\)frac\{([^}]+)\}\{([^}]+)\}/g, "\\frac{$1}{$2}")
      
      // 🔧 Fix electrical engineering specific patterns from ExamGenius
      .replace(/frac\{V_t\}\{I_t\}/g, "\\frac{V_t}{I_t}")
      .replace(/frac\{V_t\}\{L_t\}/g, "\\frac{V_t}{L_t}")
      .replace(/frac\{V_th\}\{I_t\}/g, "\\frac{V_{th}}{I_t}")
      .replace(/frac\{V_th\}\{L_t\}/g, "\\frac{V_{th}}{L_t}")
      .replace(/frac\{R_th\}\{R_N\}/g, "\\frac{R_{th}}{R_N}")
      .replace(/frac\{V_N\}\{I_N\}/g, "\\frac{V_N}{I_N}")

      // 🔧 Fix electrical engineering resistivity and resistance formulas
      .replace(/frac\{hoL\}\{A\}/g, "\\frac{\\rho L}{A}")
      .replace(/frac\{rhoL\}\{A\}/g, "\\frac{\\rho L}{A}")
      .replace(/R\s*=\s*frac\{hoL\}\{A\}/g, "R = \\frac{\\rho L}{A}")
      .replace(/R\s*=\s*frac\{rhoL\}\{A\}/g, "R = \\frac{\\rho L}{A}")

      // 🔧 Fix malformed vector/arrow notations
      .replace(/\\ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\ec\{([^}]+)\}/g, "\\vec{$1}")
      .replace(/\\[^a-zA-Z0-9]?ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/→\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\vec\s+([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\overrightarrow\s+([A-Za-z]+)/g, "\\overrightarrow{$1}")

      // 🔧 Fix malformed square roots
      .replace(/qrt\{([^}]+)\}/g, "\\sqrt{$1}")
      .replace(/(?<!\\)sqrt\{([^}]+)\}/g, "\\sqrt{$1}")

      // 🔧 Fix Greek and missing backslashes - Enhanced list
      .replace(
        /(?<!\\)(frac|sqrt|sum|int|lim|log|exp|sin|cos|tan|text|oint|vec|overrightarrow|prod|partial|nabla|infty)\s*\{/g,
        "\\$1{"
      )
      .replace(
        /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|pi|sigma|tau|phi|psi|omega|infty|mu_0|theta_0|phi_0|rho)\b/g,
        "\\$1"
      )
      .replace(/μ/g, "\\mu")
      .replace(/π/g, "\\pi")
      .replace(/θ/g, "\\theta")
      .replace(/φ/g, "\\phi")
      .replace(/σ/g, "\\sigma")
      .replace(/∞/g, "\\infty")
      .replace(/ρ/g, "\\rho")

      // 🔧 Fix electrical engineering specific Greek letters and symbols
      .replace(/\bho\b/g, "\\rho") // resistivity
      .replace(/\bHo\b/g, "\\rho") // resistivity (capital)
      .replace(/\bRho\b/g, "\\rho") // resistivity (mixed case)
      .replace(/\bOMEGA\b/g, "\\Omega") // ohm symbol
      .replace(/\bOmega\b/g, "\\Omega") // ohm symbol
      .replace(/\bomega\b/g, "\\omega") // angular frequency
      .replace(/\bOMEGA\s*cdot\s*m\b/g, "\\Omega \\cdot m") // ohm-meters
      .replace(/\bOmega\s*cdot\s*m\b/g, "\\Omega \\cdot m") // ohm-meters
      .replace(/\bOmegacdotm\b/g, "\\Omega \\cdot m") // ohm-meters (no spaces)

      // 🔧 Fix common physics variables and subscripts
      .replace(/\bIenc\b/g, "I_{\\text{enc}}")
      .replace(/\bI_\{enc\}\b/g, "I_{\\text{enc}}")
      .replace(/\bV_\{th\}\b/g, "V_{th}")
      .replace(/\bR_\{th\}\b/g, "R_{th}")
      .replace(/\bI_\{N\}\b/g, "I_N")
      .replace(/\bV_\{N\}\b/g, "V_N")

      // 🔧 Fix summation and integration notation
      .replace(/(?<!\\)sum_\{([^}]+)\}\^\{([^}]+)\}/g, "\\sum_{$1}^{$2}")
      .replace(/(?<!\\)int_\{([^}]+)\}\^\{([^}]+)\}/g, "\\int_{$1}^{$2}")
      .replace(/(?<!\\)lim_\{([^}]+)\}/g, "\\lim_{$1}")
      .replace(/(?<!\\)prod_\{([^}]+)\}\^\{([^}]+)\}/g, "\\prod_{$1}^{$2}")

      // 🔧 Fix matrix and determinant notation
      .replace(/(?<!\\)det\s*\{([^}]+)\}/g, "\\det{$1}")
      .replace(/(?<!\\)tr\s*\{([^}]+)\}/g, "\\text{tr}{$1}")

      // 🔧 Fix common mathematical operators
      .replace(/(?<!\\)div\b/g, "\\div")
      .replace(/(?<!\\)times\b/g, "\\times")
      .replace(/(?<!\\)pm\b/g, "\\pm")
      .replace(/(?<!\\)mp\b/g, "\\mp")
      .replace(/(?<!\\)approx\b/g, "\\approx")
      .replace(/(?<!\\)equiv\b/g, "\\equiv")
      .replace(/(?<!\\)neq\b/g, "\\neq")
      .replace(/(?<!\\)leq\b/g, "\\leq")
      .replace(/(?<!\\)geq\b/g, "\\geq")

      // 🔧 Fix arrow notations
      .replace(/(?<!\\)to\b/g, "\\to")
      .replace(/(?<!\\)rightarrow\b/g, "\\rightarrow")
      .replace(/(?<!\\)leftarrow\b/g, "\\leftarrow")
      .replace(/(?<!\\)Leftrightarrow\b/g, "\\Leftrightarrow")

      // 🔧 Fix electrical engineering specific arrows and relationships
      .replace(/\\to\s+its/g, "\\rightarrow its") // "proportional to its"
      .replace(/\\to\s+the/g, "\\rightarrow the") // "proportional to the"
      .replace(/\\to\s+calculate/g, "\\rightarrow calculate") // "to calculate"

      // 🔧 Prevent KaTeX from crashing on lonely commands
      .replace(/\\frac(?!\s*\{)/g, "")
      .replace(/\\sqrt(?!\s*\{)/g, "")
      .replace(/\\sum(?!\s*[_{])/g, "")
      .replace(/\\int(?!\s*[_{])/g, "")

      // 🔧 Fix double backslashes that might appear in JSON strings
      .replace(/\\\\frac/g, "\\frac")
      .replace(/\\\\sqrt/g, "\\sqrt")
      .replace(/\\\\sum/g, "\\sum")
      .replace(/\\\\int/g, "\\int")
      .replace(/\\\\vec/g, "\\vec")
      .replace(/\\\\lim/g, "\\lim")
      .replace(/\\\\text/g, "\\text")
      .replace(/\\\\rho/g, "\\rho")
      .replace(/\\\\Omega/g, "\\Omega")

      // 🔧 Fix common ExamGenius specific patterns
      .replace(/\\text\{([^}]+)\}/g, "\\text{$1}") // Ensure proper text formatting
      .replace(/\$\s*\\frac/g, "$\\frac") // Fix spacing around dollar signs
      .replace(/\\frac\s*\$/g, "\\frac$") // Fix spacing around dollar signs
      
      // 🔧 Fix subscript and superscript spacing
      .replace(/([A-Za-z0-9])_\{([^}]+)\}/g, "$1_{$2}") // Ensure proper subscript formatting
      .replace(/([A-Za-z0-9])\^\{([^}]+)\}/g, "$1^{$2}") // Ensure proper superscript formatting

      // 🔧 Remove all invisible Unicode/control characters
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, "")
      
      // 🔧 Final cleanup - remove any remaining malformed patterns
      .replace(/\\(?!frac|sqrt|sum|int|lim|log|exp|sin|cos|tan|text|oint|vec|overrightarrow|prod|partial|nabla|infty|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|lambda|mu|pi|sigma|tau|phi|psi|omega|rho|Omega|div|times|pm|mp|approx|equiv|neq|leq|geq|to|rightarrow|leftarrow|Leftrightarrow|det|tr)([a-zA-Z]+)/g, "\\$1")
  );
}
