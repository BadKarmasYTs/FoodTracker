let foodList = JSON.parse(localStorage.getItem("foodList")) || [];
let calorieGoal = parseInt(localStorage.getItem("calorieGoal")) || 0;
let lastDate = localStorage.getItem("lastDate");

function checkDate() {
  const today = new Date().toDateString();
  if (lastDate !== today) {
    foodList = [];
    localStorage.setItem("lastDate", today);
  }
}

function updateUI() {
  const list = document.getElementById("food-list");
  const totalSpan = document.getElementById("total-cals");
  const calLeft = document.getElementById("cal-left");
  list.innerHTML = "";

  let total = 0;
  foodList.forEach(item => {
    total += item.calories || 0;
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.calories || 0} kcal`;
    list.appendChild(li);
  });

  totalSpan.textContent = total;
  calLeft.textContent = calorieGoal > 0 ? Math.max(0, calorieGoal - total) : "-";

  localStorage.setItem("foodList", JSON.stringify(foodList));
}

function setGoal() {
  const input = document.getElementById("goal-input");
  calorieGoal = parseInt(input.value);
  localStorage.setItem("calorieGoal", calorieGoal);
  updateUI();
}

function clearDay() {
  foodList = [];
  localStorage.setItem("lastDate", new Date().toDateString());
  updateUI();
}

function startScanner() {
  const scanner = new Html5Qrcode("scanner");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async (code) => {
      scanner.stop();
      document.getElementById("result").innerText = `Searching: ${code}`;
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const data = await res.json();
        if (data.status === 1) {
          const name = data.product.product_name || "Unknown Item";
          const nutriments = data.product.nutriments || {};
          const calories = parseFloat(nutriments["energy-kcal_serving"] || nutriments["energy-kcal_100g"]) || 0;
          foodList.push({ name, calories });
          updateUI();
          document.getElementById("result").innerText = `Added: ${name} - ${calories} kcal`;
        } else {
          document.getElementById("result").innerText = "Food not found.";
        }
      } catch {
        document.getElementById("result").innerText = "Error fetching data.";
      }
    },
    (err) => console.warn(err)
  );
}

checkDate();
updateUI();
