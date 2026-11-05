const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

let stops = [];
let selectedStop = null;
let refreshTimer = null;

loadStops();

async function loadStops() {
    try {
        const response = await fetch("https://data.foli.fi/gtfs/stops");
        const data = await response.json();
        stops = Object.values(data);
    } catch (err) {
        console.error(err);
        alert("Pysäkkien lataus epäonnistui.");
    }
}

searchInput.addEventListener("input", () => {
    const search = searchInput.value.trim().toLowerCase();

    if (search.length < 2) {
        searchResults.innerHTML = "";
        return;
    }

    const matches = stops
        .filter(stop =>
            stop.stop_name.toLowerCase().includes(search) ||
            String(stop.stop_code).includes(search)
        )
        .slice(0, 10);

    searchResults.innerHTML = "";

    matches.forEach(stop => {
        const div = document.createElement("div");
        div.className = "result-item";
        div.textContent = `${stop.stop_name} (${stop.stop_code})`;

        div.onclick = async () => {
            selectedStop = stop;
            searchInput.value = div.textContent;
            searchResults.innerHTML = "";

            await loadDepartures();

            if (refreshTimer) clearInterval(refreshTimer);
            refreshTimer = setInterval(loadDepartures, 60000);
        };

        searchResults.appendChild(div);
    });
});

async function loadDepartures() {
    if (!selectedStop) return;

    try {
        const response = await fetch(
            `https://data.foli.fi/siri/sm/${selectedStop.stop_code}`
        );

        const data = await response.json();

        if (!data.result || data.result.length === 0) {
            alert("Lähtöjä ei löytynyt.");
            return;
        }

        const departures = data.result.map(item => ({
            line: item.lineref || "-",
            destination: item.destinationdisplay || "",
            time: (item.expecteddeparturetime || item.aimeddeparturetime) * 1000
        }));

        departures.sort((a, b) => a.time - b.time);

        renderDepartures(departures);

    } catch (err) {
        console.error(err);
        alert("Lähtötietojen lataaminen epäonnistui.");
    }
}

function renderDepartures(departures) {
    document.getElementById("stopInfo").classList.remove("hidden");

    document.getElementById("stopName").textContent =
        selectedStop.stop_name;

    fillMain(departures[0]);
    fillNext(departures[1], "next1");
    fillNext(departures[2], "next2");

    document.getElementById("updated").textContent =
        "Päivitetty: " + new Date().toLocaleTimeString("fi-FI");
}

function fillMain(dep) {
    if (!dep) return;

    document.getElementById("mainLine").textContent = dep.line;
    document.getElementById("mainDestination").textContent = dep.destination;
    document.getElementById("mainTime").textContent = formatTime(dep.time);
}

function fillNext(dep, prefix) {
    if (!dep) return;

    document.getElementById(prefix + "Line").textContent = dep.line;
    document.getElementById(prefix + "Destination").textContent = dep.destination;
    document.getElementById(prefix + "Time").textContent = formatTime(dep.time);
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit"
    });
}
