const express = require('express');
//const { status } = require('express/lib/reponse')
const path = require('path');
const app = express();
const port = 3001;

//definition du moteur de recherche
app.set('view engine', 'ejs')
app.set('views', 'vue')

app.use(express.static(path.join(__dirname, 'vue')));

app.get('/', (req, res) => {
res.status(200).render('Accueil')
});

app.get('/connexion', (req, res) => {
res.status(200).render('connexion')
});

app.get('/inscription', (req, res) => {
res.status(200).render('inscription')
});
app.use((req, res) => {
res.status(404).render('erreur')
});
app.listen(port, () => {
console.log(`serveur actif port ${port}`);
});
app.listen(port, () => {
console.log(`votre application écoute sur le port ${port}`);
});