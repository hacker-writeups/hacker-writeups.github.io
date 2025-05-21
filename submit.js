document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("resourceForm");
  const formMessage = document.getElementById("formMessage");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Validate form
    const title = document.getElementById("title").value.trim();
    const url = document.getElementById("url").value.trim();
    const description = document.getElementById("description").value.trim();
    const tags = Array.from(
      document.querySelectorAll('input[name="tags[]"]:checked')
    ).map((el) => el.value);

    if (!title || !url || !description || tags.length === 0) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      showMessage("Please enter a valid URL", "error");
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    try {
      // Submit to Formspree
      const formData = new FormData(form);

      // Add any additional data you want to capture
      formData.append("_format", "json"); // Get JSON response

      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      // Replace the success handler with:
      if (response.ok) {
        window.location.href = "thank-you.html"; // Manual redirect
        return; // Stop further execution
      } else {
        const error = await response.json();
        throw new Error(error.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      showMessage(`Error: ${error.message}`, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="fas fa-paper-plane"></i> Submit Resource';
    }
  });

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    setTimeout(() => {
      formMessage.textContent = "";
      formMessage.className = "form-message";
    }, 5000);
  }
});

if (response.ok) {
  // Show success message
  showMessage("Submission successful!", "success");

  // Optional: Redirect after delay
  setTimeout(() => {
    window.location.href = "thank-you.html";
  }, 3000);
}
