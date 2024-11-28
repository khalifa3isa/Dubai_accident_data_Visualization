function setupNetworkGraph() {
    const width = 960;
    const height = 600;

    const svg = d3.select("#networkGraphContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(d => d.id).distance(100).strength(0.5))
        .force("charge", d3.forceManyBody().strength(-150))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide(50));

    let allData = { nodes: [], links: [] };

    d3.csv("data/accident_weather_merged_data.csv").then(data => {
        const nodes = [];
        const links = [];
        const nodeById = new Map();

        data.forEach(d => {
            const time = new Date(d.Time).getHours();
            if (!nodeById.has(d["Weather Conditions"])) {
                nodes.push({ id: d["Weather Conditions"], group: "Weather", time });
                nodeById.set(d["Weather Conditions"], { id: d["Weather Conditions"], group: "Weather", time });
            }
            if (!nodeById.has(d["Accident Type"])) {
                nodes.push({ id: d["Accident Type"], group: "Accident Type", time });
                nodeById.set(d["Accident Type"], { id: d["Accident Type"], group: "Accident Type", time });
            }
            links.push({ source: d["Weather Conditions"], target: d["Accident Type"], value: 1, time });
        });

        allData = { nodes, links };

        updateGraph(allData.nodes, allData.links);

        document.getElementById("weather-filter").addEventListener("change", filterGraph);
        document.getElementById("time-slider").addEventListener("input", filterGraph);
    });

    function filterGraph() {
        const selectedWeather = document.getElementById("weather-filter").value;
        const selectedTime = parseInt(document.getElementById("time-slider").value, 10);

        const filteredNodes = allData.nodes.filter(d => 
            (selectedWeather === "All" || d.id === selectedWeather || d.group === "Accident Type") &&
            (isNaN(selectedTime) || d.time === selectedTime)
        );

        const filteredLinks = allData.links.filter(d => 
            (selectedWeather === "All" || d.source === selectedWeather) &&
            (isNaN(selectedTime) || d.time === selectedTime)
        );

        updateGraph(filteredNodes, filteredLinks);
    }

    function updateGraph(nodes, links) {
        svg.selectAll(".links").remove();
        svg.selectAll(".nodes").remove();
        svg.selectAll(".labels").remove();

        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", d => Math.sqrt(d.value));

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 8)
            .attr("fill", d => (d.group === "Weather" ? "#69b3a2" : "#ff6347"))
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        const labels = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .text(d => d.id)
            .style("font-size", "10px")
            .style("font-family", "Arial")
            .style("fill", "#333");

        simulation.nodes(nodes).on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels
                .attr("x", d => d.x + 10)
                .attr("y", d => d.y + 3);
        });

        simulation.force("link").links(links);
        simulation.alpha(1).restart();
    }

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

setupNetworkGraph();
