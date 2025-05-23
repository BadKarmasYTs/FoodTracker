const today = new Date().toDateString();

let foodList = JSON.parse(localStorage.getItem("foodList")) || [];
let calorieGoal = parseInt(localStorage.getItem("calorieGoal")) || 0;
let calHistory = JSON.parse(localStorage.getItem("calHistory")) || [];
let weightLog = JSON.parse(localStorage.getItem("weightLog")) || [];

if (localStorage.getItem("lastDate") !== today) {
  if (localStorage.getItem("lastDate")) {
    const prevTotal = foodList.reduce((s,i)=>s + i.calories,0);
    calHistory.push({ date: localStorage.getItem("lastDate"), total: prevTotal });
    localStorage.setItem("calHistory", JSON.stringify(calHistory));
  }
  foodList = [];
  localStorage.setItem("lastDate", today);
  localStorage.setItem("foodList", JSON.stringify(foodList));
}

function updateUI() {
  const fl = document.getElementById("food-list");
  const ch = document.getElementById("cal-history");
  let c=0,p=0,cb=0,f=0;
  fl.innerHTML="";
  foodList.forEach(x=>{
    c+=x.calories; p+=x.protein; cb+=x.carbs; f+=x.fat;
    const li=document.createElement("li");
    li.textContent=`${x.name} — ${x.calories} kcal | P:${x.protein} C:${x.carbs} F:${x.fat}`;
    fl.appendChild(li);
  });
  document.getElementById("total-cals").innerText=c;
  document.getElementById("cal-left").innerText= calorieGoal? Math.max(0,calorieGoal-c): "-";
  document.getElementById("total-prot").innerText=p;
  document.getElementById("total-carb").innerText=cb;
  document.getElementById("total-fat").innerText=f;
  localStorage.setItem("foodList", JSON.stringify(foodList));

  ch.innerHTML="";
  calHistory.slice(-7).forEach(h=>{
    const li=document.createElement("li");
    li.textContent=`${h.date}: ${h.total} kcal`;
    ch.appendChild(li);
  });
}

function setGoal(){
  calorieGoal = parseInt(document.getElementById("goal-input").value)||0;
  localStorage.setItem("calorieGoal", calorieGoal);
  updateUI();
}

function clearDay(){
  localStorage.setItem("lastDate", today);
  foodList=[]; updateUI();
}

async function startScanner(){
  const scanner=new Html5Qrcode("scanner");
  await scanner.start({facingMode:"environment"},{fps:10,qrbox:250},
    async code=>{
      scanner.stop();
      document.getElementById("result").innerText=`Searching ${code}…`;
      try {
        const res=await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
        const d=await res.json();
        if(d.status===1){
          const np=d.product.nutriments||{};
          const it={
            name:d.product.product_name||"Unknown",
            calories:parseFloat(np["energy-kcal_serving"]||np["energy-kcal_100g"]||0),
            protein:parseFloat(np["proteins_serving"]||np["proteins_100g"]||0),
            carbs:parseFloat(np["carbohydrates_serving"]||np["carbohydrates_100g"]||0),
            fat:parseFloat(np["fat_serving"]||np["fat_100g"]||0)
          };
          foodList.push(it);
          document.getElementById("result").innerText=`Added ${it.name}`;
          updateUI();
        } else document.getElementById("result").innerText="Not found.";
      } catch {
        document.getElementById("result").innerText="Fetch error.";
      }
    },
    err=>console.warn(err)
  );
}

function logWeight(){
  const w=parseFloat(document.getElementById("weight-input").value);
  if(!isNaN(w)) {
    weightLog.push({ date: today, weight: w });
    localStorage.setItem("weightLog", JSON.stringify(weightLog));
    drawChart();
  }
}

function drawChart(){
  const ctx=document.getElementById("weightChart").getContext("2d");
  const data=weightLog.slice(-7);
  new Chart(ctx,{
    type:"line",
    data:{
      labels:data.map(x=>x.date),
      datasets:[{ label:"Weight (kg)", data:data.map(x=>x.weight), fill:false }]
    }
  });
}

updateUI();
drawChart();
