const app = document.getElementById("app");
const counter = { count: 0, increment() { this.count++; document.getElementById("count").textContent = this.count; } };
app.innerHTML = "<h2>Interactive Counter Demo</h2><p>Count: <span id=\"count\">0</span></p><button onclick=\"counter.increment()\">Click Me!</button>";
console.log("Sample project loaded!");
