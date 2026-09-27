const WHATSAPP_NUMBER = "15551234567";

const service = document.querySelector("#service");
const quantity = document.querySelector("#qty");
const location = document.querySelector("#location");
const estimate = document.querySelector("#estimate");
const whatsapp = document.querySelector("#whatsapp");

function updateQuote() {
  const qty = Math.min(99, Math.max(1, Number(quantity.value) || 1));
  const base = Number(service.value);
  const multiplier = Number(location.value);
  const total = Math.round(base * qty * multiplier);

  quantity.value = qty;
  estimate.textContent = "$" + total.toLocaleString();

  const serviceName = service.options[service.selectedIndex].text.split(" —")[0];
  const area = location.options[location.selectedIndex].text.split(" (")[0];
  const message = [
    "Hi! I want a quote.",
    "Service: " + serviceName,
    "Quantity: " + qty,
    "Location: " + area,
    "Starting estimate: $" + total
  ].join("\n");

  whatsapp.href =
    "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
}

[service, quantity, location].forEach((field) => {
  field.addEventListener("input", updateQuote);
  field.addEventListener("change", updateQuote);
});

updateQuote();
