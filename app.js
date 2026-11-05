const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

let stops = [];
let selectedStop = null;
let refreshTimer = null;

loadStops();

async function loadStops() {

    const response = await fetch(
        "https://data.foli.fi/gtfs/stops"
    );

    const data = await response.json();

    stops = Object.values(data);
}

searchInput.addEventListener("input", () => {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    if (search.length < 2) {

        searchResults.innerHTML = "";

        return;
    }

    const matches = stops
        .filter(stop =>
            stop.stop_name
                .toLowerCase()
                .includes(search) ||
            String(stop.stop_code)
                .includes(search)
        )
        .slice(0, 10);

    searchResults.innerHTML = "";

    matches.forEach(stop => {

        const result = document.createElement("div");

        result.className = "result-item";

        result.textContent =
            `${stop.stop_name} (${stop.stop_code})`;

        result.onclick = async () => {

            selectedStop = stop;

            searchInput.value =
                result.textContent;

            searchResults.innerHTML = "";

            await loadDepartures();

            clearInterval(refreshTimer);

            refreshTimer = setInterval(
                loadDepartures,
                60000
            );
        };

        searchResults.appendChild(result);
    });
});

async function loadDepartures() {

    if (!selectedStop) {
        return;
    }

    const response = await fetch(
        `https://data.foli.fi/siri/sm/${selectedStop.stop_code}`
    );

    const data = await response.json();

    if (!data.result?.length) {
        return;
    }

    const departures = data.result
        .map(item => ({

            line:
                item.lineref || "-",

            destination:
                item.destinationdisplay || "",

            scheduledTime:
                (
                    item.aimeddeparturetime ||
                    item.expecteddeparturetime
                ) * 1000,

            estimatedTime:
                (
                    item.expecteddeparturetime ||
                    item.aimeddeparturetime
                ) * 1000
        }))
        .sort(
            (a, b) =>
                a.estimatedTime -
                b.estimatedTime
        );

    renderDepartures(departures);
}

function renderDepartures(departures) {

    document
        .getElementById("stopInfo")
        .classList
        .remove("hidden");

    document.getElementById(
        "stopName"
    ).textContent =
        selectedStop.stop_name;

    fillMain(departures[0]);

    fillNext(
        departures[1],
        "next1"
    );

    fillNext(
        departures[2],
        "next2"
    );

    document.getElementById(
        "updated"
    ).textContent =
        "Päivitetty: " +
        new Date()
            .toLocaleTimeString(
                "fi-FI"
            );
}

function fillMain(dep) {

    if (!dep) {
        return;
    }

    document.getElementById(
        "mainLine"
    ).textContent =
        dep.line;

    document.getElementById(
        "mainDestination"
    ).textContent =
        dep.destination;

    document.getElementById(
        "mainScheduledTime"
    ).textContent =
        formatTime(
            dep.scheduledTime
        );

    document.getElementById(
        "mainEstimatedTime"
    ).textContent =
        formatTime(
            dep.estimatedTime
        );
}

function fillNext(dep, prefix) {

    if (!dep) {
        return;
    }

    document.getElementById(
        prefix + "Line"
    ).textContent =
        dep.line;

    document.getElementById(
        prefix + "Destination"
    ).textContent =
        dep.destination;

    document.getElementById(
        prefix + "Scheduled"
    ).textContent =
        formatTime(
            dep.scheduledTime
        );

    document.getElementById(
        prefix + "Estimated"
    ).textContent =
        formatTime(
            dep.estimatedTime
        );
}

function formatTime(timestamp) {

    return new Date(timestamp)
        .toLocaleTimeString(
            "fi-FI",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}