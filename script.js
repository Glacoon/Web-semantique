async function fetchSPARQL(query) {
    let endpoint = "https://dbpedia.org/sparql";
    let url = endpoint + "?query=" + encodeURIComponent(query) + "&format=json";

    try {
        let response = await fetch(url);
        let data = await response.json();
        return data.results.bindings;
    } catch (error) {
        console.error("Erreur de requête SPARQL", error);
        return [];
    }
}

// Rechercher des films par réalisateur
async function searchFilmsByDirector() {
    let realisateur = document.getElementById("realisateur").value;
    let query = `
        SELECT ?film ?titre
        WHERE {
            ?film rdf:type dbo:Film .
            ?film rdfs:label ?titre .
            ?film dbo:director dbr:${realisateur} .
            FILTER (LANG(?titre) = "fr")
        }
        LIMIT 5
    `;

    let results = await fetchSPARQL(query);
    displayResults(results, "films");
}

// Récupérer des informations sur un acteur
async function searchActorInfo() {
    let acteur = document.getElementById("acteur").value;
    let query = `
        SELECT ?info ?value
        WHERE {
            dbr:${acteur} ?info ?value .
            FILTER (LANG(?value) = "fr")
        }
        LIMIT 5
    `;

    let results = await fetchSPARQL(query);
    displayResults(results, "actor-info");
}

// Affichage des résultats
function displayResults(results, elementId) {
    let resultsList = document.getElementById(elementId);
    resultsList.innerHTML = "";

    if (results.length === 0) {
        resultsList.innerHTML = "<li>Aucun résultat trouvé.</li>";
        return;
    }

    results.forEach(item => {
        let listItem = document.createElement("li");
        listItem.innerText = Object.values(item).map(v => v.value).join(" - ");
        resultsList.appendChild(listItem);
    });
}
