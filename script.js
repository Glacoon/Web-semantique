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
  document.getElementById("films").innerHTML = "Chargement...";

  let query = `
    SELECT DISTINCT ?film ?titre ?abstract (SAMPLE(?categoryLabel) AS ?genre)
    WHERE {
      ?film rdf:type dbo:Film .
      ?film rdfs:label ?titre .
      ?film dbo:director dbr:${realisateur} .
      OPTIONAL {
        ?film dcterms:subject ?category .
        BIND(REPLACE(STR(?category), "http://dbpedia.org/resource/Category:", "") AS ?categoryLabel)
      }
      OPTIONAL {
        ?film dbo:abstract ?abstract .
        FILTER (LANG(?abstract) = "fr")
      }
      FILTER (LANG(?titre) = "fr")
    }
    GROUP BY ?film ?titre ?abstract
    ORDER BY ?titre
    LIMIT 10
  `;

  let results = await fetchSPARQL(query);
  displayResults(results, "films");
}

// Récupérer des informations sur un acteur
async function searchActorInfo() {
  let acteur = document.getElementById("acteur").value;
  document.getElementById("actor-info").innerHTML = "Chargement...";

  let query = `
    SELECT ?nom ?birthDate ?birthPlace ?abstract ?occupation
    WHERE {
      dbr:${acteur} rdfs:label ?nom .
      OPTIONAL { dbr:${acteur} dbo:birthDate ?birthDate . }
      OPTIONAL { 
        dbr:${acteur} dbo:birthPlace ?birthPlace .
        ?birthPlace rdfs:label ?birthPlaceName .
        FILTER (LANG(?birthPlaceName) = "fr")
      }
      OPTIONAL { dbr:${acteur} dbo:abstract ?abstract . FILTER (LANG(?abstract) = "fr") }
      OPTIONAL { dbr:${acteur} dbo:occupation ?occupation . }
      FILTER (LANG(?nom) = "fr")
    }
    LIMIT 1
  `;

  let results = await fetchSPARQL(query);
  displayActorInfo(results, "actor-info");
}

// Trouver tous les acteurs qui ont joué dans un film de Tarantino
async function searchTarantinoActors() {
  document.getElementById("tarantino-actors").innerHTML = "Chargement...";
  
  let query = `
    SELECT DISTINCT ?acteur ?acteurNom ?film ?filmTitre
    WHERE {
      ?film dbo:director dbr:Quentin_Tarantino .
      ?film rdfs:label ?filmTitre .
      ?film dbo:starring ?acteur .
      ?acteur rdfs:label ?acteurNom .
      FILTER (LANG(?filmTitre) = "fr")
      FILTER (LANG(?acteurNom) = "fr")
    }
    ORDER BY ?acteurNom
    LIMIT 5
  `;

  let results = await fetchSPARQL(query);
  displayTarantinoActors(results, "tarantino-actors");
}

// Récupérer tous les présidents français et leur mandat
async function searchFrenchPresidents() {
  document.getElementById("french-presidents").innerHTML = "Chargement...";
  
  let query = `
    SELECT DISTINCT ?president ?nom ?debutMandat ?finMandat ?parti
    WHERE {
      ?president dbo:office "President of France"@en .
      ?president rdfs:label ?nom .
      OPTIONAL { ?president dbp:termStart ?debutMandat . }
      OPTIONAL { ?president dbp:termEnd ?finMandat . }
      OPTIONAL { 
        ?president dbo:party ?partiEntity .
        ?partiEntity rdfs:label ?parti .
        FILTER (LANG(?parti) = "fr")
      }
      FILTER (LANG(?nom) = "fr")
    }
    ORDER BY ?debutMandat
    LIMIT 20
  `;

  let results = await fetchSPARQL(query);
  displayFrenchPresidents(results, "french-presidents");
}

// Vérifier une information avec ASK
async function executeAskQuery() {
  let resource = document.getElementById("askQueryInput").value;
  let entityType = document.getElementById("entityType").value;
  
  if (!resource.startsWith("dbr:")) {
    alert("Veuillez entrer une ressource valide au format dbr:Nom");
    return;
  }
  
  document.getElementById("askResult").innerHTML = "Vérification...";
  
  const entityTypes = {
    "City": "ville",
    "Company": "entreprise",
    "Person": "personne",
    "Film": "film",
    "Country": "pays"
  };
  
  let query = `ASK { ${resource} rdf:type dbo:${entityType} }`;
  
  try {
    let endpoint = "https://dbpedia.org/sparql";
    let url = endpoint + "?query=" + encodeURIComponent(query) + "&format=json";
    
    let response = await fetch(url);
    let data = await response.json();
    
    let resultElement = document.getElementById("askResult");
    let entityName = resource.replace("dbr:", "").replace(/_/g, " ");
    let entityTypeName = entityTypes[entityType] || entityType;
    
    if (data.boolean) {
      resultElement.innerHTML = `<p class="success">Oui, ${entityName} est bien une ${entityTypeName}.</p>`;
    } else {
      resultElement.innerHTML = `<p class="error">Non, ${entityName} n'est pas considéré comme une ${entityTypeName} dans DBpedia.</p>`;
    }
  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête ASK", error);
    document.getElementById("askResult").innerHTML = "<p>Erreur lors de la vérification.</p>";
  }
}

// Obtenir des informations détaillées avec DESCRIBE
async function executeDescribeQuery() {
  let resource = document.getElementById("describeQueryInput").value;
  if (!resource.startsWith("dbr:")) {
    alert("Veuillez entrer une ressource valide au format dbr:Nom");
    return;
  }

  document.getElementById("describeResults").innerHTML = "Chargement...";
  let query = `DESCRIBE ${resource}`;

  try {
    let endpoint = "https://dbpedia.org/sparql";
    let url = endpoint + "?query=" + encodeURIComponent(query) + "&format=application/rdf%2Bxml";
    
    let response = await fetch(url);
    let text = await response.text();
    
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(text, "text/xml");
    let descriptions = xmlDoc.getElementsByTagName("rdf:Description");
    
    let triples = [];
    for (let i = 0; i < descriptions.length; i++) {
      let subject = descriptions[i].getAttribute("rdf:about");
      let children = descriptions[i].children;
      
      for (let j = 0; j < children.length; j++) {
        let predicate = children[j].tagName;
        let object = children[j].getAttribute("rdf:resource") || children[j].textContent;
        
        triples.push({
          subject: { value: subject },
          predicate: { value: predicate },
          object: { value: object }
        });
      }
    }
    
    displayDescribeResults(triples, "describeResults");
  } catch (error) {
    console.error("Erreur lors de l'exécution de la requête DESCRIBE", error);
    document.getElementById("describeResults").innerHTML = "<li>Erreur lors de la requête.</li>";
  }
}

// Affichage des résultats pour DESCRIBE
function displayDescribeResults(results, elementId) {
  let resultsList = document.getElementById(elementId);
  resultsList.innerHTML = "";

  if (!results || results.length === 0) {
    resultsList.innerHTML = "<li>Aucune information trouvée.</li>";
    return;
  }

  // Limiter à 10 résultats
  const maxResults = 10;
  const displayResults = results.slice(0, maxResults);

  displayResults.forEach(triple => {
    let listItem = document.createElement("li");
    listItem.innerText = `${triple.subject.value} - ${triple.predicate.value} - ${triple.object.value}`;
    resultsList.appendChild(listItem);
  });
  
  if (results.length > maxResults) {
    let moreItem = document.createElement("li");
    moreItem.innerText = `... et ${results.length - maxResults} autres propriétés`;
    resultsList.appendChild(moreItem);
  }
}

// Affichage des résultats
function displayResults(results, elementId) {
  let resultsList = document.getElementById(elementId);
  resultsList.innerHTML = "";

  if (results.length === 0) {
    resultsList.innerHTML = "<li>Aucun résultat trouvé.</li>";
    return;
  }

  // Filtrer les doublons par titre
  let uniqueFilms = [];
  let filmTitles = new Set();

  results.forEach(item => {
    if (!filmTitles.has(item.titre.value)) {
      filmTitles.add(item.titre.value);
      uniqueFilms.push(item);
    }
  });

  uniqueFilms.forEach(item => {
    let listItem = document.createElement("li");

    // Cas spécifique pour les films
    if (elementId === "films") {
      let titre = item.titre ? item.titre.value : "Titre inconnu";
      let genre = item.genre ? item.genre.value.replace(/_/g, ' ') : "Genre non spécifié";
      let abstract = item.abstract ? 
        `<p class="film-abstract">${item.abstract.value.substring(0, 150)}...</p>` : "";

      listItem.innerHTML = `
        <div class="film-card">
          <h3>${titre} <span class="film-genre">(${genre})</span></h3>
          ${abstract}
        </div>
      `;
    } else {
      // Cas par défaut
      let formattedValues = [];
      for (let key in item) {
        let value = item[key].value;
        if (value.startsWith("http://")) {
          value = value.split("/").pop().replace(/_/g, " ");
        }
        formattedValues.push(value);
      }
      listItem.innerText = formattedValues.join(" - ");
    }

    resultsList.appendChild(listItem);
  });
}

// Affichage des acteurs de Tarantino avec leurs films
function displayTarantinoActors(results, elementId) {
  let resultsList = document.getElementById(elementId);
  resultsList.innerHTML = "";

  if (results.length === 0) {
    resultsList.innerHTML = "<li>Aucun résultat trouvé.</li>";
    return;
  }

  // Regrouper les résultats par acteur
  let actorsMap = new Map();
  results.forEach(item => {
    let actorURI = item.acteur.value;
    let actorName = item.acteurNom.value;
    let filmTitle = item.filmTitre.value;

    if (!actorsMap.has(actorURI)) {
      actorsMap.set(actorURI, {
        name: actorName,
        films: [filmTitle]
      });
    } else {
      actorsMap.get(actorURI).films.push(filmTitle);
    }
  });

  // Afficher les acteurs et leurs films
  actorsMap.forEach((actor, uri) => {
    let listItem = document.createElement("li");
    listItem.innerHTML = `
      <strong>${actor.name}</strong>
      <ul>
        ${actor.films.map(film => `<li>${film}</li>`).join("")}
      </ul>
    `;
    resultsList.appendChild(listItem);
  });
}

// Affichage des présidents français
function displayFrenchPresidents(results, elementId) {
  let resultsList = document.getElementById(elementId);
  resultsList.innerHTML = "";

  if (results.length === 0) {
    resultsList.innerHTML = "<li>Aucun résultat trouvé.</li>";
    return;
  }

  results.forEach(item => {
    let listItem = document.createElement("li");
    let presidentName = item.nom.value;
    let startDate = item.debutMandat ? item.debutMandat.value : "Inconnu";
    let endDate = item.finMandat ? item.finMandat.value : "En cours";
    let party = item.parti ? item.parti.value : "Parti inconnu";

    listItem.innerHTML = `
      <div class="president-card">
        <h3>${presidentName}</h3>
        <p><strong>Mandat:</strong> ${startDate} - ${endDate}</p>
        <p><strong>Parti:</strong> ${party}</p>
      </div>
    `;
    resultsList.appendChild(listItem);
  });
}

// Affichage des informations d'acteur
function displayActorInfo(results, elementId) {
  let resultsList = document.getElementById(elementId);
  resultsList.innerHTML = "";

  if (results.length === 0) {
    resultsList.innerHTML = "<li>Aucune information trouvée pour cet acteur.</li>";
    return;
  }

  let actor = results[0];
  let actorCard = document.createElement("li");

  let name = actor.nom ? actor.nom.value : "Nom inconnu";
  let birthDate = actor.birthDate ? new Date(actor.birthDate.value).toLocaleDateString() : "Date de naissance inconnue";
  let birthPlace = actor.birthPlaceName ? actor.birthPlaceName.value : "Lieu de naissance inconnu";
  let occupation = actor.occupation ? actor.occupation.value.split("/").pop().replace(/_/g, " ") : "Occupation inconnue";
  let abstractHtml = actor.abstract ? `<p class="actor-abstract">${actor.abstract.value.substring(0, 300)}...</p>` : "";

  actorCard.innerHTML = `
    <div class="actor-card">
      <h3>${name}</h3>
      <p><strong>Date de naissance:</strong> ${birthDate}</p>
      <p><strong>Lieu de naissance:</strong> ${birthPlace}</p>
      <p><strong>Occupation:</strong> ${occupation}</p>
      ${abstractHtml}
    </div>
  `;

  resultsList.appendChild(actorCard);
}
