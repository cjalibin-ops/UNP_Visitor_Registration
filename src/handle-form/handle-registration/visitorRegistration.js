import { addVisitorAPI } from "../hanlde-server/visitorServer.js";
import { showToast } from "../function/toascontainer.js";

/*
 NAME VALIDATION SECTION
 * * Validates visitor first name, last name, and
   * middle initial before submitting registration.
   * 
 * * First and last names only accept letters.
 * 
 * * Middle name accepts only one letter with
   * optional period (Example: S or S.).
*/

function validateNameField(value, fieldName) {
  // * Remove extra spaces and trim unnecessary spaces
  const trimmed = value.trim().replace(/\s+/g, " ");

  // * Validate middle name as a single initial
  // Accepted:
  // S
  // S.
  if (fieldName === "Middle Name") {
    // Regex:
    // [A-Za-z]  -> requires one letter
    // \.?       -> allows optional period
    const middleRegex = /^[A-Za-z]\.?$/;

    if (!middleRegex.test(trimmed)) {
      showToast(
        "Middle Name must be a single initial (e.g. S or S.).",
        "warning",
      );

      return null;
    }

    return trimmed;
  }

  // * Validate first name and last name
  // Allows:
  // John
  // Juan Dela Cruz
  const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

  if (!nameRegex.test(trimmed)) {
    showToast(`${fieldName} must contain letters only.`, "warning");

    return null;
  }

  // ! Remove spaces and count only letters
  const lettersOnly = trimmed.replace(/\s/g, "");

  // * Require minimum of 2 letters
  if (lettersOnly.length < 2) {
    showToast(`${fieldName} must contain at least 2 letters.`, "warning");

    return null;
  }

  return trimmed;
}

/*
 * LETTER INPUT RESTRICTION
 * * Prevents invalid characters while typing.
 * * First name and last name:
 * Only letters and spaces allowed.
 * * Middle name:
 * Only one letter and optional period.
 */
function enforceLettersOnly(input) {
  input.addEventListener("input", () => {
    let value = input.value;

    // * Special validation for middle initial
    if (input.id === "middle_name") {
      // ! Remove all characters except letters and dot
      value = value.replace(/[^A-Za-z.]/g, "");

      // * Get only the first letter typed
      const letter = value.match(/[A-Za-z]/)?.[0] || "";

      // * Allow period only after the letter
      const dot = value.endsWith(".") ? "." : "";

      // Result format:
      // S
      // S.
      value = letter + dot;
    } else {
      // * First name and last name validation
      // * Remove numbers and special characters
      value = value.replace(/[^A-Za-z\s]/g, "");

      // * Prevent multiple spaces
      value = value.replace(/\s{2,}/g, " ");

      // * Remove spaces at the beginning
      value = value.replace(/^\s+/, "");
    }

    // * Update input value
    input.value = value;
  });
}

/*
 * CLEAR REGISTRATION FORM
 - Resets all input fields after successful
   visitor registration.
 - Resets address dropdown values.
*/
export function clearForm() {
  document.getElementById("last_name").value = "";
  document.getElementById("first_name").value = "";
  document.getElementById("middle_name").value = "";
  document.getElementById("phone_number").value = "";

  // Reset address fields
  document.getElementById("province").value = "";
  document.getElementById("municipality").value = "";

  // Reset barangay dropdown
  const barangay = document.getElementById("barangay");

  barangay.value = "";

  barangay.innerHTML =
    '<option value="">-- Select Municipality First --</option>';

  // Disable barangay until municipality is selected again
  barangay.disabled = true;
}

/*
 * DOUBLE SUBMISSION PROTECTION
 - Prevents multiple registrations caused by
   double clicking the register button.

*/
let isRegistering = false;

/*
 * VISITOR REGISTRATION FUNCTION
 - Collects visitor information.
 - Validates user input.
 - Sends registration data to backend API.
*/
export async function registerVisitor() {
  // Stop function if registration is already running
  if (isRegistering) return;

  isRegistering = true;

  const btnRegister = document.getElementById("registerBtn");

  // Disable button during API request
  if (btnRegister) {
    btnRegister.disabled = true;
    btnRegister.textContent = "Registering...";
  }

  try {
    const lastNameRaw = document.getElementById("last_name").value;
    const firstNameRaw = document.getElementById("first_name").value;
    const middleNameRaw = document.getElementById("middle_name").value;

    const lastName = validateNameField(lastNameRaw, "Last Name");
    const firstName = validateNameField(firstNameRaw, "First Name");

    let middleName = null;

    if (middleNameRaw.trim()) {
      middleName = validateNameField(middleNameRaw, "Middle Name");
    }

    const phoneNumber = document.getElementById("phone_number").value.trim();
    const province = document.getElementById("province").value.trim();
    const municipality = document.getElementById("municipality").value.trim();
    const barangay = document.getElementById("barangay").value.trim();

    if (
      !lastName ||
      !firstName ||
      !phoneNumber ||
      !province ||
      !municipality ||
      !barangay
    ) {
      showToast("Please fill all required fields.", "warning");
      return;
    }

    const phoneInput = document.getElementById("phone_number");

    if (!validatePhoneNumber({ target: phoneInput })) {
      return;
    }

    const response = await addVisitorAPI({
      lastName,
      firstName,
      middleName,
      phoneNumber,
      province,
      municipality,
      barangay,
    });

    const { status, message } = response.data;

    if (status === "success") {
      const fullName = middleName
        ? `${firstName} ${middleName} ${lastName}`
        : `${firstName} ${lastName}`;

      showToast(`${fullName} successfully registered!`, "success");

      clearForm();

      if (typeof loadTotalVisitors === "function") {
        loadTotalVisitors();
      }

      return;
    }

    if (status === "warning") {
      showToast(message, "warning");
      return;
    }

    showToast(message || "Registration failed.", "error");
  } catch (error) {
    console.error(error);

    let errorMessage = "Registration failed. Please try again.";

    if (error.response) {
      errorMessage =
        error.response.data?.message ||
        `Server error (${error.response.status}). Please try again.`;
    } else if (error.request) {
      errorMessage =
        "No response from the API. Check Apache, open this page through http://localhost:2000, and try again.";
    } else if (error.message) {
      errorMessage = "The registration request could not be created.";
    }

    showToast(errorMessage, "error");
  } finally {
    // Enable registration again
    isRegistering = false;

    if (btnRegister) {
      btnRegister.disabled = false;

      btnRegister.textContent = "Register";
    }
  }
}

/* ===========================
  PHONE FORMAT
=========================== */

function formatPhoneNumber(e) {
  let value = e.target.value;

  // Remove non-digits
  value = value.replace(/[^\d]/g, "");

  // Convert 09 -> 639
  if (value.startsWith("0")) {
    value = "63" + value.substring(1);
  }

  // Remove duplicate 63
  if (value.startsWith("6363")) {
    value = value.substring(2);
  }

  // Add +
  if (value.startsWith("63")) {
    value = "+" + value;
  }

  // Limit length
  if (value.length > 13) {
    value = value.substring(0, 13);
  }

  e.target.value = value;
}

/* ===========================
  PHONE VALIDATION
=========================== */

function validatePhoneNumber(e) {
  const phone = e.target.value.trim();

  if (phone === "") return true;

  const regex = /^\+639\d{9}$/;

  if (!regex.test(phone)) {
    showToast("Invalid phone number, always start with the 09.", "warning");

    e.target.focus();
    return false;
  } 

  return true;
}

// * INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
  // Name fields
  ["first_name", "last_name", "middle_name"].forEach((id) => {
    const input = document.getElementById(id);

    if (input) {
      enforceLettersOnly(input);
    }
  });

  // Phone number
  const phoneInput = document.getElementById("phone_number");

  if (phoneInput) {
    phoneInput.addEventListener("input", formatPhoneNumber);
    phoneInput.addEventListener("blur", validatePhoneNumber);
  }

  // Barangay enable/disable
  const municipality = document.getElementById("municipality");
  const barangay = document.getElementById("barangay");

  if (barangay) {
    barangay.disabled = true;
  }

  if (municipality) {
    municipality.addEventListener("change", () => {
      if (municipality.value) {
        barangay.disabled = false;
      } else {
        barangay.disabled = true;
        barangay.value = "";
      }
    });
  }
});
