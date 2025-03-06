// Configuration du endpoint SPARQL
const endpoint = "http://localhost:3030/stream-data/query";

// Préfixes pour les requêtes SPARQL
const prefixes = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX sd: <http://streamdata.org/ontology#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
`;

// Définition des requêtes prédéfinies
const queries = {
  "films-acteurs": {
    query: `
            ${prefixes}
            SELECT ?film ?filmLabel ?acteur ?acteurLabel
            WHERE {
                ?film rdf:type sd:Film ;
                      rdfs:label ?filmLabel ;
                      sd:a_pour_acteur ?acteur .
                ?acteur rdfs:label ?acteurLabel .
            }
            ORDER BY ?filmLabel
        `,
    headers: ["Film", "Acteur"],
    needsParam: false,
  },
  "acteurs-celebres": {
    query: `
            ${prefixes}
            SELECT ?acteur ?acteurLabel (COUNT(?film) as ?nbFilms)
            WHERE {
                ?film rdf:type sd:Film ;
                      sd:a_pour_acteur ?acteur .
                ?acteur rdfs:label ?acteurLabel .
            }
            GROUP BY ?acteur ?acteurLabel
            HAVING (COUNT(?film) >= 3)
            ORDER BY DESC(?nbFilms)
        `,
    headers: ["Acteur Célèbre", "Nombre de Films"],
    needsParam: false,
  },
  "genres-par-plateforme": {
    query: `
            ${prefixes}
            SELECT ?plateforme ?plateformeLabel ?genre ?genreLabel (COUNT(?film) as ?nbFilms)
            WHERE {
                ?plateforme rdf:type sd:Plateforme ;
                           rdfs:label ?plateformeLabel .
                ?film sd:diffuse_sur ?plateforme ;
                      sd:a_pour_genre ?genre .
                ?genre rdfs:label ?genreLabel .
            }
            GROUP BY ?plateforme ?plateformeLabel ?genre ?genreLabel
            ORDER BY ?plateformeLabel ?genreLabel
        `,
    headers: ["Plateforme", "Genre", "Nombre de Films"],
    needsParam: false,
  },
  "films-par-genre": {
    query: `
            ${prefixes}
            SELECT ?film ?filmLabel
            WHERE {
                ?film rdf:type sd:Film ;
                      rdfs:label ?filmLabel ;
                      sd:a_pour_genre ?genre .
                ?genre rdfs:label ?genreLabel .
                FILTER(REGEX(?genreLabel, "PARAM", "i"))
            }
            ORDER BY ?filmLabel
        `,
    headers: ["Film"],
    needsParam: true,
    paramPlaceholder: "Entrez un genre (ex: Drame, Comédie...)",
  },
  "acteurs-par-film": {
    query: `
            ${prefixes}
            SELECT ?acteur ?acteurLabel
            WHERE {
                ?film rdf:type sd:Film ;
                      rdfs:label ?filmLabel ;
                      sd:a_pour_acteur ?acteur .
                ?acteur rdfs:label ?acteurLabel .
                FILTER(REGEX(?filmLabel, "PARAM", "i"))
            }
            ORDER BY ?acteurLabel
        `,
    headers: ["Acteur"],
    needsParam: true,
    paramPlaceholder: "Entrez un titre de film",
  },
  "films-par-annee": {
    query: `
            ${prefixes}
            SELECT ?film ?filmLabel ?annee
            WHERE {
                ?film rdf:type sd:Film ;
                      rdfs:label ?filmLabel ;
                      sd:annee_sortie ?annee .
                FILTER(?annee = PARAM)
            }
            ORDER BY ?filmLabel
        `,
    headers: ["Film", "Année"],
    needsParam: true,
    paramPlaceholder: "Entrez une année (ex: 2019)",
  },
};

// Éléments DOM
const querySelector = document.getElementById("query-selector");
const queryParam = document.getElementById("query-param");
const executeButton = document.getElementById("execute-query");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("error-message");
const tableHeader = document.getElementById("table-header");
const tableBody = document.getElementById("table-body");

// Gestion de l'affichage du champ de paramètre
querySelector.addEventListener("change", function () {
  const selectedQuery = queries[this.value];
  if (selectedQuery.needsParam) {
    queryParam.style.display = "inline-block";
    queryParam.placeholder = selectedQuery.paramPlaceholder || "Paramètre";
  } else {
    queryParam.style.display = "none";
  }
});

// Exécution de la requête
executeButton.addEventListener("click", function () {
  const selectedQueryType = querySelector.value;
  const selectedQuery = queries[selectedQueryType];
  let finalQuery = selectedQuery.query;

  if (selectedQuery.needsParam) {
    const param = queryParam.value;
    if (!param) {
      showError("Veuillez entrer un paramètre pour cette requête.");
      return;
    }

    // Gérer différemment les paramètres numériques et textuels
    if (selectedQueryType === "films-par-annee") {
      finalQuery = finalQuery.replace("PARAM", param);
    } else {
      finalQuery = finalQuery.replace("PARAM", param);
    }
  }

  // Afficher le loader
  loader.style.display = "block";
  errorMessage.style.display = "none";

  // Envoyer la requête
  fetch(endpoint + "?query=" + encodeURIComponent(finalQuery) + "&format=json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur réseau lors de la requête.");
      }
      return response.json();
    })
    .then((data) => {
      displayResults(
        data.results.bindings,
        selectedQuery.headers,
        selectedQueryType
      );
      loader.style.display = "none";
    })
    .catch((error) => {
      console.error("Erreur:", error);
      showError("Erreur lors de l'exécution de la requête: " + error.message);
      loader.style.display = "none";
    });
});

// Affichage des résultats
function displayResults(results, headers, queryType) {
  // Nettoyer les résultats précédents
  tableHeader.innerHTML = "";
  tableBody.innerHTML = "";

  // Si aucun résultat
  if (results.length === 0) {
    showError("Aucun résultat trouvé pour cette requête.");
    return;
  }

  // Créer l'en-tête du tableau
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    tableHeader.appendChild(th);
  });

  // Remplir le tableau avec les résultats
  results.forEach((row) => {
    const tr = document.createElement("tr");

    switch (queryType) {
      case "films-acteurs":
        addCell(tr, row.filmLabel.value);
        addCell(tr, row.acteurLabel.value);
        break;
      case "acteurs-celebres":
        addCell(tr, row.acteurLabel.value);
        addCell(tr, row.nbFilms.value);
        break;
      case "genres-par-plateforme":
        addCell(tr, row.plateformeLabel.value);
        addCell(tr, row.genreLabel.value);
        addCell(tr, row.nbFilms.value);
        break;
      case "films-par-genre":
        addCell(tr, row.filmLabel.value);
        break;
      case "acteurs-par-film":
        addCell(tr, row.acteurLabel.value);
        break;
      case "films-par-annee":
        addCell(tr, row.filmLabel.value);
        addCell(tr, row.annee.value);
        break;
      default:
        // Fallback générique pour les autres types de requêtes
        Object.keys(row).forEach((key) => {
          if (key.endsWith("Label")) {
            addCell(tr, row[key].value);
          }
        });
    }

    tableBody.appendChild(tr);
  });
}

// Ajouter une cellule au tableau
function addCell(row, content) {
  const cell = document.createElement("td");
  cell.textContent = content;
  row.appendChild(cell);
}

// Afficher un message d'erreur
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

// Initialiser l'interface avec la première requête
querySelector.dispatchEvent(new Event("change"));
