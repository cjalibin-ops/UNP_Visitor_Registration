import { addVisitorAPI } from "../hanlde-server/visitorServer.js";
import { showToast } from "../function/toascontainer.js";

/**
 * Validates that the input contains only letters and has a minimum length.
 */
// Updated: Allows spaces, but ensures it starts and ends with letters 
// and contains at least 2 letters total.
function validateNameField(value, fieldName) {
    const trimmed = value.trim();

    // Regex explanation:
    // ^[A-Za-z] : Starts with a letter
    // ([A-Za-z\s]*[A-Za-z])? : Allows letters and spaces in between, but must end in a letter
    // {2,} : Minimum 2 total characters
    if (!/^[A-Za-z]([A-Za-z\s]*[A-Za-z])?$/.test(trimmed) || trimmed.length < 2) {
        showToast(
            `${fieldName} must contain letters and spaces only, and be at least 2 characters long.`,
            "warning"
        );
        return null;
    }

    return trimmed;
}

/**
 * Enforces input constraints: Letters only, no numbers/symbols.
 */
function enforceLettersOnly(inputElement) {
    inputElement.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/[^A-Za-z]/g, "");
    });
}

/**
 * Clears the registration form fields.
 */
export function clearForm() {
    const fields = ["last_name", "first_name", "middle_name", "phone_number", "province", "municipality"];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const barangay = document.getElementById("barangay");
    if (barangay) {
        barangay.value = "";
        barangay.innerHTML = '<option value="">-- Select Municipality First --</option>';
        barangay.disabled = true;
    }
}

/**
 * Main function to register a visitor with duplicate protection.
 */
export async function registerVisitor() {
    // 1. Collect and Validate Data
    const lastNameRaw = document.getElementById("last_name").value;
    const firstNameRaw = document.getElementById("first_name").value;
    const middleNameRaw = document.getElementById("middle_name").value;
    const phoneNumber = document.getElementById("phone_number").value.trim();
    const province = document.getElementById("province").value.trim();
    const municipality = document.getElementById("municipality").value.trim();
    const barangay = document.getElementById("barangay").value.trim();

    const lastName = validateNameField(lastNameRaw, "Last Name");
    const firstName = validateNameField(firstNameRaw, "First Name");
    const middleName = middleNameRaw.trim() ? middleNameRaw.trim() : null;

    // 2. Perform Validation
    if (!lastName || !firstName || !phoneNumber || !province || !municipality || !barangay) {
        if (!lastName || !firstName) return; // Toast already shown by validateNameField
        showToast("Please fill all required fields correctly.", "warning");
        return;
    }

    if (!/^09\d{9}$/.test(phoneNumber)) {
        showToast("Phone number must be valid (e.g., 09XXXXXXXXX)", "warning");
        return;
    }

    // 3. Send to Server
    try {
        const response = await addVisitorAPI({
            action: "insert",
            lastName,
            firstName,
            middleName,
            phoneNumber,
            province,
            municipality,
            barangay
        });

        // 4. Handle Response
        if (response.status === "success") {
            showToast(`${firstName} ${lastName} successfully registered!`, "success");
            clearForm();
        } else {
            // This catches the 'warning' status from your PHP duplicate check
            showToast(response.message || "Visitor is already registered.", "warning");
        }
    } catch (error) {
        console.error("Registration Error:", error);
        showToast("Unable to reach the server.", "error");
    }
}

// Initialization for UI listeners
document.addEventListener("DOMContentLoaded", () => {
    // Enforce letters on name fields
    const names = ["first_name", "last_name", "middle_name"];
    names.forEach(id => {
        const el = document.getElementById(id);
        if (el) enforceLettersOnly(el);
    });

    // Handle Municipality/Barangay toggle
    const municipality = document.getElementById("municipality");
    const barangay = document.getElementById("barangay");

    if (municipality && barangay) {
        municipality.addEventListener("change", () => {
            barangay.disabled = !municipality.value;
            if (!municipality.value) barangay.value = "";
        });
    }
});