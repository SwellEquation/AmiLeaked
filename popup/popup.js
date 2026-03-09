document.addEventListener("DOMContentLoaded", function () {
  const button = document.getElementById("testBtn");
  const status = document.getElementById("status");

  button.addEventListener("click", async function () {
    status.textContent = "Popup wired up. Content script will be connected later.";
  });
});
