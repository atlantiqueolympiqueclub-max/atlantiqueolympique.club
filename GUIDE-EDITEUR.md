# Guide de l'éditeur — Site de l'AOC

Bienvenue ! Ce guide explique **comment modifier le contenu du site** sans
toucher au code. Tout se fait depuis une page d'administration, avec de simples
formulaires. Aucune connaissance technique n'est nécessaire.

> **En résumé :** vous allez sur `.../admin`, vous vous connectez, vous
> remplissez des champs, vous cliquez sur **Enregistrer** — et le site public
> se met à jour tout seul en 1 à 2 minutes.

---

## 1. Se connecter

1. Ouvrez votre navigateur et allez à l'adresse du site suivie de **`/admin`**
   (par exemple `https://aoc-natation.pages.dev/admin`).
   *(L'adresse exacte vous sera communiquée par la personne qui a installé le site.)*
2. Cliquez sur **« Se connecter avec GitHub »**.
3. La première fois, GitHub vous demande d'autoriser l'accès : cliquez sur
   **Authorize**. C'est à faire une seule fois.
4. Vous arrivez sur le tableau de bord de l'éditeur. 🎉

> 💡 Ajoutez cette page `/admin` à vos favoris pour la retrouver facilement.

---

## 2. Comprendre l'écran

À gauche, une **liste de rubriques** correspond aux différentes parties du site :

| Rubrique | Ce que ça modifie |
|---|---|
| **Athlètes** | Les nageurs présentés dans « Le club » |
| **Staff / Encadrement** | Les entraîneurs et encadrants |
| **Événements** | Le calendrier (« Prochains événements ») |
| **Blog** | Les articles / actualités |
| **Galerie** | Les photos de la galerie |
| **Partenaires** | Les logos des fédérations et partenaires |
| **Réglages du site** | Textes d'accueil, coordonnées, menu, chiffres clés |

Cliquez sur une rubrique pour voir la liste des éléments existants.

---

## 3. Modifier un élément existant

Exemple avec un **athlète** (le principe est identique partout) :

1. Cliquez sur **Athlètes** dans la liste de gauche.
2. Cliquez sur l'athlète à modifier.
3. Changez ce que vous voulez (nom, discipline, palmarès…).
4. En haut à droite, cliquez sur **Enregistrer** (ou **Publier**).
5. Attendez 1 à 2 minutes : le site public est mis à jour automatiquement.

---

## 4. Ajouter un nouvel élément

1. Cliquez sur la rubrique voulue (ex. **Athlètes**).
2. Cliquez sur le bouton **« Créer un(e)… »** (en haut à droite).
3. Remplissez les champs. Les champs marqués comme obligatoires doivent être remplis.
4. Cliquez sur **Enregistrer / Publier**.

### Les champs « Ordre d'affichage »
Certaines rubriques ont un champ **Ordre d'affichage** (un nombre). Plus le
nombre est **petit**, plus l'élément apparaît **tôt** sur le site. Par exemple,
un athlète avec l'ordre `1` s'affiche avant un athlète avec l'ordre `5`.

---

## 5. Ajouter ou remplacer une photo

Dans un champ **Photo / Image / Logo** :

1. Cliquez sur le champ image.
2. Choisissez **Téléverser** (« Upload ») et sélectionnez la photo sur votre
   ordinateur (ou votre téléphone).
3. La photo est ajoutée automatiquement au site.

**Conseils pour les photos :**
- Formats acceptés : **JPG** ou **PNG** (photos), **SVG** ou **PNG** (logos).
- Évitez les fichiers trop lourds : idéalement **moins de 1 Mo** par photo.
  Une image trop grande ralentit le site. Vous pouvez réduire une photo avec un
  outil gratuit comme [squoosh.app](https://squoosh.app) avant de la téléverser.
- Préférez des photos au format **paysage** (plus large que haut) pour les
  couvertures et bannières.

---

## 6. Supprimer un élément

Ouvrez l'élément, puis cherchez le bouton **Supprimer** (souvent via le menu
« ⋯ » en haut à droite). Confirmez.

> ℹ️ Rien n'est jamais vraiment perdu : chaque modification est enregistrée dans
> un historique. En cas d'erreur, la personne qui gère le site peut toujours
> revenir en arrière.

---

## 7. Modifier les textes, le contact et les chiffres

Tout cela se trouve dans **Réglages du site** :

- **Page d'accueil — textes** : le grand titre, le sous-titre, et le texte
  « Qui sommes-nous ? ».
- **Contact** : téléphone(s) et e-mail.
  *(L'emplacement du club et la carte sont volontairement « fixes » — normalement
  vous n'y touchez pas. Ils sont rangés dans des sections repliées.)*
- **Général & navigation** : nom du club, devise, menu du haut, réseaux sociaux,
  et les **chiffres clés** (les compteurs animés : licenciés, podiums, etc.).

---

## 8. Bonnes pratiques

- ✅ **Enregistrez souvent.** Chaque enregistrement est une sauvegarde.
- ✅ **Vérifiez le résultat** sur le site public après 1 à 2 minutes.
- ⚠️ **Ne modifiez pas** les champs indiqués comme « fixe » (latitude, longitude,
  zoom de la carte) sans raison : ils font fonctionner la carte.
- ⚠️ Les **liens** doivent commencer par `https://` (ex. `https://fsns.sn`).
- 📱 L'éditeur fonctionne aussi **depuis un téléphone**.

---

## 9. En cas de problème

- La page `/admin` ne se charge pas ? Vérifiez votre connexion, puis réessayez.
- Vous ne pouvez pas vous connecter ? Votre accès a peut-être besoin d'être
  activé — contactez la personne qui gère le site.
- Une modification n'apparaît pas après quelques minutes ? Actualisez la page
  (Ctrl+Maj+R, ou Cmd+Maj+R sur Mac) ; la mise en ligne peut prendre 1 à 2 minutes.

Pour toute question technique, transmettez ce message à l'administrateur du site
en précisant **ce que vous faisiez** et **ce qui s'est passé**.

Bon travail ! 🏊
