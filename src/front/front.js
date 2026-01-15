      async function chargerJeux() {
        try {
          const reponse = await fetch('/games');
          const texte = await reponse.text();
          document.getElementById('result').innerHTML = texte;
        } catch (error) {
          console.error('Erreur lors du chargement des jeux :', error);
        }
      }

      chargerJeux();