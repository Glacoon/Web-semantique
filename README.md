# **TP - Exploiter les ontologies et les bases de connaissances avec SPARQL**  

## **Objectif du TP**  
Ce TP a pour but de familiariser les étudiants avec **SPARQL** et l’exploitation des ontologies à travers **DBpedia**.  
Plus précisement : 
* Exécuter des requêtes **SELECT, ASK et DESCRIBE** sur DBpedia.  
* Vérifier des faits avec **ASK** .  
* Explorer les propriétés d’une ressource avec **DESCRIBE**.  
* Modifier un **script JavaScript** pour interagir dynamiquement avec DBpedia.  

---

## **Structure du projet**  

```
📂 TP_WebSemantique  
 ├── 📜 index.html  → Interface utilisateur (formulaires et affichage des résultats)  
 ├── 📜 script.js  → Gestion des requêtes SPARQL et affichage des résultats  
 ├── 📜 README.md  → Guide du TP  
```

---

## **Comment démarrer ?**  

* **Téléchargez les fichiers** ou clonez ce repository.  
* **Ouvrez `index.html`** dans un navigateur.  
* **Saisissez des requêtes** dans les champs et cliquez sur les boutons.  
* **Observez les résultats !**  

---

## **Explication des fonctionnalités**  

### **Vérifier une information avec ASK**  
Le champ **ASK** permet de tester si une ressource appartient à une classe donnée.  
**Exemple** : Vérifier si Paris est une ville  

* **Requête SPARQL :**  
```sparql
ASK { dbr:Paris rdf:type dbo:City }
```
* **Résultat attendu :**  
```
Oui, cette ressource correspond
```

---

### **Obtenir toutes les informations sur une ressource avec DESCRIBE**  
Le champ **DESCRIBE** permet d’explorer toutes les propriétés d’une ressource.  
**Exemple** : Obtenir des informations sur Albert Einstein  

* **Requête SPARQL :**  
```sparql
DESCRIBE dbr:Albert_Einstein
```
* **Résultat attendu :**  
Une liste de toutes les propriétés associées à Albert Einstein dans DBpedia.  

---

### **Modifier le JavaScript et les requêtes**  
Il faut modifier le fichier **script.js** pour :  
* Personnaliser les requêtes **ASK et DESCRIBE**.  
* Ajouter de nouveaux cas de test.  
* Afficher plus d’informations sur les résultats.  

---

## **Exercice supplémentaire**  
Essayez de récupérer uniquement les personnes célèbres nées après 1900 avec une requête **SPARQL SELECT**.  

---

## **Ressources utiles**  
🔹 Introduction à SPARQL : [W3C SPARQL](https://www.w3.org/TR/sparql11-query/)  
🔹 Base DBpedia : [DBpedia](https://dbpedia.org/)  
🔹 Interroger DBpedia : [DBpedia SPARQL Endpoint](https://dbpedia.org/sparql)  
