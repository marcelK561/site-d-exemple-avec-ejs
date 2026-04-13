const express = require('express');
const path = require('path');
const mysql = require('mysql');
const myconnection = require('express-myconnection');
const multer = require('multer');   // ← Ajouté pour l'upload

const app = express();
const port = 3002;

// ==================== MULTER CONFIG ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Format d\'image non autorisé'));
  }
});

// ==================== OPTION BD ====================
const optionBD = {
  host: 'localhost',
  user: 'admin',
  password: 'admin123',
  port: 3306,
  database: 'site_u'
};

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'vue'));
app.use(myconnection(mysql, optionBD, 'pool'));

// ==================== ROUTES ====================

// Accueil (je n'ai rien touché ici)
app.get('/', (req, res) => {
  const titre = 'accueil';

  req.getConnection((erreur, connection) => {
    if (erreur) {
      console.log('Erreur de connexion MySQL :', erreur);
      return res.status(500).render('erreur', { message: 'Erreur de connexion' });
    }

    connection.query('SELECT * FROM sitewebexo ORDER BY name ASC', (err1, detail) => {
      if (err1) return res.status(500).render('erreur', { message: 'Erreur départements' });

      connection.query('SELECT image FROM slide ORDER BY id ASC', (err2, slideDB) => {
        if (err2) return res.status(500).render('erreur', { message: 'Erreur slide' });

        connection.query('SELECT image FROM welcome_image ORDER BY id ASC LIMIT 1', (err3, welcomeImgDB) => {
          if (err3) return res.status(500).render('erreur', { message: 'Erreur welcome image' });

          connection.query('SELECT id, message FROM message_welcome ORDER BY id ASC', (err4, messageDB) => {
            if (err4) return res.status(500).render('erreur', { message: 'Erreur messages welcome' });

            connection.query('SELECT id, name, image FROM partenaire ORDER BY id ASC', (err5, partenaireDB) => {
              if (err5) return res.status(500).render('erreur', { message: 'Erreur partenaires' });

              const slide = slideDB.map(item => item.image);
              const welcome_image = welcomeImgDB[0]?.image || '';
              const message1 = messageDB.find(m => m.id == 1)?.message || '';
              const message2 = messageDB.find(m => m.id == 2)?.message || '';

              res.render('Accueil', {
                titre,
                detail,
                slide,
                welcome_image,
                message1,
                message2,
                partenaire: partenaireDB
              });
            });
          });
        });
      });
    });
  });
});

// ======= AJOUT DÉPARTEMENT =========

// Afficher le formulaire
app.get('/ajouter-departement', (req, res) => {
  res.render('ajout-departement', { titre: 'Ajouter un département' });
});

// Enregistrer dans la BD
//chercher comment on appel et recupére upload.single : .single est un objet crée par multer
//et uploard a été declarer plus haut donc upload.single est une fonction integrer de multer 
app.post('/ajouter-departement', upload.single('image'), (req, res) => {  
  const { titre, desciption } = req.body;
  const imagePath = '/images/' + req.file.filename;

  req.getConnection((err, connection) => {
    if (err) return res.status(500).send('Erreur de connexion BD');

    const sql = `INSERT INTO sitewebexo (name, desciption, image) VALUES (?, ?, ?)`;

    connection.query(sql, [titre, desciption, imagePath], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).send('Erreur lors de l\'insertion');
      }
      res.redirect('/');
    });
  });
});

// Route
app.get('/departement/:id', (req, res) => {
  const id = req.params.id;

  if (!/^\d+$/.test(id)) {
    return res.status(404).render('erreur', { message: 'Page non trouvée' });
  }

  req.getConnection((erreur, connection) => {
    if (erreur) return res.status(500).render('erreur', { message: 'Erreur de connexion' });

    connection.query('SELECT * FROM sitewebexo WHERE id = ?', [id], (erreur, resultat) => {
      if (erreur) return res.status(500).render('erreur', { message: 'Erreur requête' });
      if (resultat.length === 0) return res.status(404).render('erreur', { message: 'Département non trouvé' });

      res.render('detail', {
        dept: resultat[0],
        titre: resultat[0].name
      });
    });
  });
});

//  routes
app.get('/connexion', (req, res) => res.render('connexion', { titre: 'connexion - Université' }));
app.get('/inscription', (req, res) => res.render('inscription', { titre: 'inscription - Université' }));
app.get('/explorer', (req, res) => {res.render('explorer', { titre: 'Explorer - Carte Cameroun' });});

// 404
app.use((req, res) => res.status(404).render('erreur', { message: 'Page non trouvée' }));

// Lancement serveur
app.listen(port, () => {
  console.log(`Serveur actif sur le port ${port}`);
});