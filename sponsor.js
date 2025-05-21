document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("sponsorForm");
  const formMessage = document.getElementById("formMessage");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Sending...";

    try {
      // Create FormData from form
      const formData = new FormData(form);

      // Add Formspree-specific fields
      formData.append("_replyto", formData.get("email")); // Auto-reply to email
      formData.append("_subject", "New Sponsorship Inquiry");

      // Submit to Formspree
      const response = await fetch("https://formspree.io/f/mvgaykoq", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        // Show success message
        showMessage("Thank you! We have received your submission.", "success");

        // Option 1: Redirect after delay
        setTimeout(() => {
          window.location.href = "thank-you-sponsor.html";
        }, 2000);

        // Option 2: Show success message without redirect
        // form.reset();
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      showMessage("Error submitting form. Please try again.", "error");
      console.error("Form submission error:", error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "Submit";
    }
  });

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = "block";

    setTimeout(() => {
      formMessage.style.opacity = "0";
      setTimeout(() => {
        formMessage.style.display = "none";
        formMessage.style.opacity = "1";
      }, 500);
    }, 5000);
  }
});
