// Set the dimensions and margins of the graph
const width = 450;
const height = 450;
const margin = 40;
const radius = Math.min(width, height) / 2 - margin;

// Append the SVG object to the div called 'accident-type-chart'
const svgContainer = d3.select("#accident-type-chart")
  .append("svg")
    .attr("width", width)
    .attr("height", height);

const svg = svgContainer
  .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Add a static title to the SVG container
svgContainer.append("text")
  .attr("x", width / 2)
  .attr("y", 20) // Adjust the position based on your layout
  .attr("text-anchor", "middle")
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .text("Distribution of Accident Types");

// Tooltip for pie chart slices
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "rgba(0, 0, 0, 0.6)")
  .style("color", "white")
  .style("padding", "5px")
  .style("border-radius", "5px")
  .style("text-align", "center");

// Load data and store globally
let allData;
d3.csv("data/accident_weather_merged_data.csv").then(data => {
  allData = data;
  updateVisualization();

  // Add legend for the pie chart
  const accidentTypes = [...new Set(data.map(d => d["Accident Type"]))]; // Unique Accident Types
  const color = d3.scaleOrdinal()
      .domain(accidentTypes)
      .range(d3.schemeSet3); // Match the pie chart color scheme
  addLegendForPieChart(color, accidentTypes);
});

// Event listeners for the filters
document.getElementById("weather-filter").addEventListener("change", updateVisualization);
document.getElementById("time-slider").addEventListener("input", updateVisualization);

// Function to filter data and update the visualization
function updateVisualization() {
  const weatherCondition = document.getElementById("weather-filter").value;
  const selectedHour = parseInt(document.getElementById("time-slider").value, 10);

  // Filter data based on the selected weather condition and time
  const filteredData = allData.filter(d => {
    const hour = new Date(d.Time).getHours();
    return (weatherCondition === "All" || d["Weather Conditions"] === weatherCondition) &&
           (isNaN(selectedHour) || hour === selectedHour);
  });

  // Aggregate data for the pie chart
  const accidentCounts = d3.rollup(filteredData, v => v.length, d => d["Accident Type"]);
  updatePieChart(Array.from(accidentCounts));
}

// Function to update the pie chart
function updatePieChart(data) {
  // Clear the existing pie chart elements
  svg.selectAll("*").remove();

  // Set up color scale
  const color = d3.scaleOrdinal()
    .domain(data.map(d => d[0]))
    .range(d3.schemeSet3);

  // Generate the pie layout
  const pie = d3.pie().value(d => d[1]);
  const data_ready = pie(data);

  // Draw the pie slices
  svg.selectAll('path')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
    .attr('fill', d => color(d.data[0]))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)
    .on("mouseover", (event, d) => {
      tooltip.style("visibility", "visible")
             .html(`${d.data[0]}: ${(d.data[1] / d3.sum(data, d => d[1]) * 100).toFixed(1)}%`)
             .style("left", `${event.pageX + 10}px`)
             .style("top", `${event.pageY + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });
}

// Function to add a legend for the pie chart
function addLegendForPieChart(colors, accidentTypes) {
  // Select the container for the pie chart and append a legend
  const legendContainer = d3.select("#accident-type-chart")
      .append("div")
      .attr("id", "pie-legend")
      .style("margin-top", "20px")
      .style("display", "flex")
      .style("flex-wrap", "wrap")
      .style("gap", "15px");

  // Add legend items
  accidentTypes.forEach(type => {
    const legendItem = legendContainer.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px");

    // Color box
    legendItem.append("div")
      .style("width", "20px")
      .style("height", "20px")
      .style("background-color", colors(type))
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px");

    // Text label
    legendItem.append("span")
      .text(type)
      .style("font-size", "14px")
      .style("color", "#333");
  });
}
