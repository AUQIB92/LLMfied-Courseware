import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Comprehensive LaTeX sanitizer that fixes common formatting issues
 * Enhanced for ExamGenius content with better pattern matching and duplication prevention
 * @param text - The text containing LaTeX to sanitize
 * @returns Sanitized text with properly formatted LaTeX
 */
export function sanitizeLaTeX(text: string): string {
  if (!text || typeof text !== "string") return "";

  // First, detect and fix duplicate LaTeX expressions
  // This pattern looks for repeated math expressions that are identical
  text = text.replace(/(\$\$.+?\$\$)\s*\1/g, "$1");
  text = text.replace(/(\$.+?\$)\s*\1/g, "$1");
  
  // Remove duplicate inline math that might be nested
  text = text.replace(/\$(.+?)\$\s*\$\1\$/g, "$$$1$$");
  
  // Remove duplicate block math that might be nested
  text = text.replace(/\$\$(.+?)\$\$\s*\$\$\1\$\$/g, "$$$$1$$$$");

  // 🔧 Fix malformed dollar sign combinations first
  text = text.replace(/\$\$\$/g, "$$")
    .replace(/\$\$\$\$/g, "$$")
    .replace(/\$\s+\$/g, "$$")
    .replace(/\$\$\s+\$\$/g, "$$");

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
      
      // 🔧 Fix mathematical operators and functions
      .replace(/(?<!\\)(sin|cos|tan|sec|csc|cot|log|ln|exp)\s*\(/g, "\\$1(")
      .replace(/(?<!\\)(sin|cos|tan|sec|csc|cot|log|ln|exp)\s*\{/g, "\\$1{")
      .replace(/(?<!\\)(sin|cos|tan|sec|csc|cot|log|ln|exp)\s+([a-zA-Z0-9])/g, "\\$1 $2")
      
      // 🔧 Fix calculus and advanced math notation
      .replace(/(?<!\\)(lim|int|sum|prod|partial|nabla|grad|div|curl)\s*\{/g, "\\$1{")
      .replace(/(?<!\\)(lim|int|sum|prod|partial|nabla|grad|div|curl)\s*_/g, "\\$1_")
      .replace(/(?<!\\)(lim|int|sum|prod|partial|nabla|grad|div|curl)\s*\^/g, "\\$1^")
      
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

      // 🔧 Fix physics and engineering equations
      .replace(/frac\{dQ\}\{dt\}/g, "\\frac{dQ}{dt}")
      .replace(/frac\{dV\}\{dt\}/g, "\\frac{dV}{dt}")
      .replace(/frac\{dI\}\{dt\}/g, "\\frac{dI}{dt}")
      .replace(/frac\{d\}\{dt\}/g, "\\frac{d}{dt}")
      .replace(/frac\{d\}\{dx\}/g, "\\frac{d}{dx}")
      .replace(/frac\{d\^2\}\{dx\^2\}/g, "\\frac{d^2}{dx^2}")

      // 🔧 Fix malformed vector/arrow notations
      .replace(/\\ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\ec\{([^}]+)\}/g, "\\vec{$1}")
      .replace(/\\[^a-zA-Z0-9]?ec\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/→\s*([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\vec\s+([A-Za-z])/g, "\\vec{$1}")
      .replace(/\\overrightarrow\s+([A-Za-z]+)/g, "\\overrightarrow{$1}")

      // 🔧 Fix malformed square roots and powers
      .replace(/qrt\{([^}]+)\}/g, "\\sqrt{$1}")
      .replace(/(?<!\\)sqrt\{([^}]+)\}/g, "\\sqrt{$1}")
      .replace(/\^([0-9]+)/g, "^{$1}")
      .replace(/_([0-9]+)/g, "_{$1}")
      .replace(/\^([a-zA-Z])/g, "^{$1}")
      .replace(/_([a-zA-Z])/g, "_{$1}")

      // 🔧 Fix Greek and missing backslashes - Enhanced list
      .replace(
        /(?<!\\)(frac|sqrt|sum|int|lim|log|exp|sin|cos|tan|sec|csc|cot|ln|text|oint|vec|overrightarrow|prod|partial|nabla|infty|grad|div|curl)\s*\{/g,
        "\\$1{"
      )
      .replace(
        /(?<!\\)\b(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|mu_0|theta_0|phi_0|epsilon_0)\b/g,
        "\\$1"
      )
      
      // 🔧 Fix Unicode Greek letters
      .replace(/α/g, "\\alpha")
      .replace(/β/g, "\\beta")
      .replace(/γ/g, "\\gamma")
      .replace(/δ/g, "\\delta")
      .replace(/ε/g, "\\epsilon")
      .replace(/ζ/g, "\\zeta")
      .replace(/η/g, "\\eta")
      .replace(/θ/g, "\\theta")
      .replace(/ι/g, "\\iota")
      .replace(/κ/g, "\\kappa")
      .replace(/λ/g, "\\lambda")
      .replace(/μ/g, "\\mu")
      .replace(/ν/g, "\\nu")
      .replace(/ξ/g, "\\xi")
      .replace(/π/g, "\\pi")
      .replace(/ρ/g, "\\rho")
      .replace(/σ/g, "\\sigma")
      .replace(/τ/g, "\\tau")
      .replace(/υ/g, "\\upsilon")
      .replace(/φ/g, "\\phi")
      .replace(/χ/g, "\\chi")
      .replace(/ψ/g, "\\psi")
      .replace(/ω/g, "\\omega")
      .replace(/Γ/g, "\\Gamma")
      .replace(/Δ/g, "\\Delta")
      .replace(/Θ/g, "\\Theta")
      .replace(/Λ/g, "\\Lambda")
      .replace(/Ξ/g, "\\Xi")
      .replace(/Π/g, "\\Pi")
      .replace(/Σ/g, "\\Sigma")
      .replace(/Υ/g, "\\Upsilon")
      .replace(/Φ/g, "\\Phi")
      .replace(/Ψ/g, "\\Psi")
      .replace(/Ω/g, "\\Omega")
      .replace(/∞/g, "\\infty")

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

      // 🔧 Fix mathematical symbols and operators
      .replace(/±/g, "\\pm")
      .replace(/∓/g, "\\mp")
      .replace(/×/g, "\\times")
      .replace(/÷/g, "\\div")
      .replace(/≈/g, "\\approx")
      .replace(/≡/g, "\\equiv")
      .replace(/≠/g, "\\neq")
      .replace(/≤/g, "\\leq")
      .replace(/≥/g, "\\geq")
      .replace(/→/g, "\\rightarrow")
      .replace(/←/g, "\\leftarrow")
      .replace(/↔/g, "\\leftrightarrow")
      .replace(/⇒/g, "\\Rightarrow")
      .replace(/⇐/g, "\\Leftarrow")
      .replace(/⇔/g, "\\Leftrightarrow")
      .replace(/∂/g, "\\partial")
      .replace(/∇/g, "\\nabla")
      .replace(/∫/g, "\\int")
      .replace(/∑/g, "\\sum")
      .replace(/∏/g, "\\prod")
      .replace(/√/g, "\\sqrt")

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

      // 🔧 Fix common mathematical environments and delimiters
      .replace(/\\\[/g, "$$")
      .replace(/\\\]/g, "$$")
      .replace(/\\begin\{equation\}/g, "$$")
      .replace(/\\end\{equation\}/g, "$$")
      .replace(/\\begin\{align\}/g, "$$")
      .replace(/\\end\{align\}/g, "$$")

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
      .replace(/\\\\alpha/g, "\\alpha")
      .replace(/\\\\beta/g, "\\beta")
      .replace(/\\\\gamma/g, "\\gamma")
      .replace(/\\\\delta/g, "\\delta")
      .replace(/\\\\epsilon/g, "\\epsilon")
      .replace(/\\\\theta/g, "\\theta")
      .replace(/\\\\lambda/g, "\\lambda")
      .replace(/\\\\mu/g, "\\mu")
      .replace(/\\\\pi/g, "\\pi")
      .replace(/\\\\sigma/g, "\\sigma")
      .replace(/\\\\phi/g, "\\phi")
      .replace(/\\\\omega/g, "\\omega")

      // 🔧 Fix common ExamGenius specific patterns
      .replace(/\\text\{([^}]+)\}/g, "\\text{$1}") // Ensure proper text formatting
      .replace(/\$\s*\\frac/g, "$\\frac") // Fix spacing around dollar signs
      .replace(/\\frac\s*\$/g, "\\frac$") // Fix spacing around dollar signs
      
      // 🔧 Fix subscript and superscript spacing and formatting
      .replace(/([A-Za-z0-9])_\{([^}]+)\}/g, "$1_{$2}") // Ensure proper subscript formatting
      .replace(/([A-Za-z0-9])\^\{([^}]+)\}/g, "$1^{$2}") // Ensure proper superscript formatting
      .replace(/([A-Za-z0-9])_([A-Za-z0-9])/g, "$1_{$2}") // Single character subscripts
      .replace(/([A-Za-z0-9])\^([A-Za-z0-9])/g, "$1^{$2}") // Single character superscripts

      // 🔧 Remove all invisible Unicode/control characters
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B\u200C\u200D\uFEFF]/g, "")
      
      // 🔧 Fix duplicate dollar signs that might cause rendering issues
      .replace(/\$\$\$/g, "$$")
      .replace(/\$\$\$\$/g, "$$")
      .replace(/\$\s*\$/g, "$$")
      
      // 🔧 Final cleanup - remove any remaining malformed patterns
      .replace(/\\(?!frac|sqrt|sum|int|lim|log|exp|sin|cos|tan|sec|csc|cot|ln|text|oint|vec|overrightarrow|prod|partial|nabla|infty|grad|div|curl|alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|pm|mp|times|div|approx|equiv|neq|leq|geq|to|rightarrow|leftarrow|Leftrightarrow|det|tr)([a-zA-Z]+)/g, "$1")
  );
}
