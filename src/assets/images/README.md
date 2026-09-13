# src/assets/images

Mets ici les images utilisées **à l'intérieur des composants** (logos, icônes
custom, illustrations, images de fond, avatars par défaut...).

Elles doivent être importées comme un module JS — Vite les optimise et leur
donne un nom de fichier avec hash au build :

```jsx
import logo from '../assets/images/logo.png'

<img src={logo} alt="Logo" />
```

Pour une image de fond en CSS/Tailwind, passe par une classe custom ou un
style inline avec le même import.

---

Si une image doit être accessible par une URL fixe (ex: `/favicon.svg`,
ou un fichier référencé en dur dans `index.html`), mets-la plutôt dans
`public/` à la racine du projet — elle sera alors accessible telle quelle,
sans import, à `/nom-du-fichier.ext`.
