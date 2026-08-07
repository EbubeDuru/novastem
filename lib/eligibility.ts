export type EligibilityVerdict = "eligible" | "almost_eligible" | "not_eligible";

/**
 * Application-level shape stored in opportunities.eligibility_rules.
 * The database column is JSONB, so this intentionally lives outside the
 * generated database types and is validated before it is used.
 */
export interface EligibilityRules {
  min_grade?: string;
  max_grade?: string;
  min_age?: number;
  max_age?: number;
  citizenship?: StudentEligibilityContext["citizenshipStatus"][];
  countries?: number[];
  gpa_min?: number;
  requires_financial_need?: boolean;
}

export interface EligibilityCheck {
  verdict: EligibilityVerdict;
  reasons: string[]; // human-readable — always show these, never a bare verdict
}

export interface StudentEligibilityContext {
  grade?: string;
  age?: number;
  citizenshipStatus?: "citizen" | "permanent_resident" | "visa_holder" | "international";
  countryId?: number;
  gpa?: number;
  hasFinancialNeed?: boolean;
}

const GRADE_ORDER = ["9", "10", "11", "12", "freshman", "sophomore", "junior", "senior", "graduate"];

function gradeRank(grade: string): number {
  const idx = GRADE_ORDER.indexOf(grade);
  return idx === -1 ? -1 : idx;
}

/**
 * Evaluates a student against an opportunity's structured eligibility_rules.
 *
 * Design note: this returns a *verdict + reasons*, never a bare boolean.
 * "Explain why" is a hard product requirement (students shouldn't waste time
 * on opportunities they can't access, but they also shouldn't be given an
 * unexplained rejection) — so every branch below pushes a human-readable
 * reason, whether it passes or fails.
 *
 * "almost_eligible" exists for near-misses (e.g. one grade below minimum, or
 * a missing profile field we can't verify) — treat unknown/missing student
 * data as "almost" rather than "not eligible", since a false negative here
 * costs a student a real opportunity.
 */
export function evaluateEligibility(
  rules: EligibilityRules,
  student: StudentEligibilityContext
): EligibilityCheck {
  const reasons: string[] = [];
  let hasFailure = false;
  let hasUncertainty = false;

  if (rules.min_grade || rules.max_grade) {
    if (!student.grade) {
      hasUncertainty = true;
      reasons.push("Add your grade level to your profile to confirm eligibility.");
    } else {
      const studentRank = gradeRank(student.grade);
      if (rules.min_grade && studentRank < gradeRank(rules.min_grade)) {
        hasFailure = true;
        reasons.push(`Requires grade ${rules.min_grade} or above.`);
      } else if (rules.max_grade && studentRank > gradeRank(rules.max_grade)) {
        hasFailure = true;
        reasons.push(`Only open through grade ${rules.max_grade}.`);
      } else {
        reasons.push("Grade level matches.");
      }
    }
  }

  if (rules.min_age !== undefined || rules.max_age !== undefined) {
    if (student.age === undefined) {
      hasUncertainty = true;
      reasons.push("Add your date of birth to confirm age eligibility.");
    } else {
      if (rules.min_age !== undefined && student.age < rules.min_age) {
        hasFailure = true;
        reasons.push(`Requires age ${rules.min_age}+.`);
      }
      if (rules.max_age !== undefined && student.age > rules.max_age) {
        hasFailure = true;
        reasons.push(`Only open to age ${rules.max_age} and under.`);
      }
    }
  }

  if (rules.citizenship && rules.citizenship.length > 0) {
    if (!student.citizenshipStatus) {
      hasUncertainty = true;
      reasons.push("Add your citizenship/residency status to confirm eligibility.");
    } else if (!rules.citizenship.includes(student.citizenshipStatus)) {
      hasFailure = true;
      reasons.push(`Open only to: ${rules.citizenship.join(", ")}.`);
    } else {
      reasons.push("Citizenship/residency status matches.");
    }
  }

  if (rules.countries && rules.countries.length > 0) {
    if (student.countryId === undefined) {
      hasUncertainty = true;
      reasons.push("Add your country to confirm location eligibility.");
    } else if (!rules.countries.includes(student.countryId)) {
      hasFailure = true;
      reasons.push("Not open in your country.");
    }
  }

  if (rules.gpa_min !== undefined) {
    if (student.gpa === undefined) {
      hasUncertainty = true;
      reasons.push(`Requires GPA ${rules.gpa_min}+ — add your GPA to confirm.`);
    } else if (student.gpa < rules.gpa_min) {
      hasFailure = true;
      reasons.push(`Requires GPA ${rules.gpa_min}+.`);
    }
  }

  if (rules.requires_financial_need) {
    if (student.hasFinancialNeed === undefined) {
      hasUncertainty = true;
      reasons.push("This opportunity requires demonstrated financial need.");
    } else if (!student.hasFinancialNeed) {
      hasFailure = true;
      reasons.push("Requires demonstrated financial need.");
    }
  }

  if (reasons.length === 0) {
    reasons.push("No specific eligibility restrictions found.");
  }

  const verdict: EligibilityVerdict = hasFailure
    ? "not_eligible"
    : hasUncertainty
      ? "almost_eligible"
      : "eligible";

  return { verdict, reasons };
}
