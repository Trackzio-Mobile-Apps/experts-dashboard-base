import { createInitialEvaluationFormState } from "@/lib/expert/evaluationForm";
import {
  isEvaluationFormValid,
  validateEvaluationField,
  validateEvaluationForm,
} from "@/lib/expert/evaluationFormValidation";

describe("evaluationFormValidation", () => {
  it("requires mandatory fields", () => {
    const errors = validateEvaluationForm(createInitialEvaluationFormState());
    expect(errors.coinName).toMatch(/required/i);
    expect(isEvaluationFormValid(createInitialEvaluationFormState())).toBe(false);
  });

  it("validates year of minting", () => {
    expect(validateEvaluationField("yearOfMinting", "18", {})).toMatch(/year/i);
    expect(validateEvaluationField("yearOfMinting", "1850", {})).toBeNull();
    expect(
      validateEvaluationField("yearOfMinting", "1850-1860", {}),
    ).toBeNull();
  });

  it("validates optional weight when provided", () => {
    expect(validateEvaluationField("weight", "abc", {})).toMatch(/valid number/i);
    expect(validateEvaluationField("weight", "12.5", {})).toBeNull();
    expect(validateEvaluationField("weight", "", {})).toBeNull();
  });

  it("validates estimated price range when provided", () => {
    expect(validateEvaluationField("estimatedPriceRange", "ab", {})).toMatch(
      /at least 3/i,
    );
    expect(
      validateEvaluationField("estimatedPriceRange", "₹5,000 – ₹15,000", {}),
    ).toBeNull();
  });

  it("validates recommendation when provided", () => {
    expect(validateEvaluationField("recommendation", "H", {})).toMatch(
      /at least 2/i,
    );
    expect(validateEvaluationField("recommendation", "Hold", {})).toBeNull();
  });

  it("accepts Authenticity dropdown options once selected", () => {
    expect(validateEvaluationField("authenticity", "", {})).toMatch(
      /required/i,
    );
    expect(validateEvaluationField("authenticity", "Fake", {})).toBeNull();
    expect(validateEvaluationField("authenticity", "Authentic", {})).toBeNull();
    expect(validateEvaluationField("authenticity", "Doubtful", {})).toBeNull();
  });
});
