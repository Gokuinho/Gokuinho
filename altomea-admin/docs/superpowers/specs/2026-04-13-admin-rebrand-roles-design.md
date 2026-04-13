# Altomea Admin — Rebrand & Système de rôles
**Date :** 2026-04-13  
**Scope :** Refonte visuelle complète + authentification multi-rôles + espaces distincts par rôle

---

## 1. Identité visuelle

Toutes les pages de l'admin adoptent l'identité Altomea sans exception.

| Token | Valeur |
|---|---|
| Fond principal | `#0a0a0f` |
| Fond secondaire | `#0d0d14` |
| Cartes | `#111118` |
| Bordures | `rgba(255,255,255,0.07)` |
| Texte principal | `#e8e8f0` |
| Texte secondaire | `#7a7a8e` |
| Accent or | `#c9a84c` |

**Typographies** (chargées via Google Fonts dans `app/layout.tsx`) :
- Titres : **Syne** (600, 700)
- Corps : **DM Sans** (400, 500)
- Labels / tags / données : **DM Mono** (400)

**Règles :**
- Transitions : `cubic-bezier(0.4, 0, 0.2, 1)` sur tous les éléments interactifs
- Boutons primaires : fond `#c9a84c`, texte `#0a0a0f`, uppercase, tracking large
- Inputs : fond `rgba(255,255,255,0.03)`, bordure `rgba(255,255,255,0.07)`, focus `rgba(201,168,76,0.4)`
- Cartes : fond `#111118`, bordure `rgba(255,255,255,0.07)`
- Aucun composant Tailwind générique visible (pas de `btn`, `card` génériques)

---

## 2. Schéma Prisma — modifications

### Modèle `User` — ajout du champ `role`
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  password     String
  name         String    @default("Admin")
  role         String    @default("client")   // "admin" | "collaborateur" | "comptable" | "client"
  clientStatus String    @default("nouveau")  // "nouveau" | "en_cours" | "actif" | "pause" — utilisé si role = "client"
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  messages     Message[]
}
```

### Nouveau modèle `Message`
```prisma
model Message {
  id         String   @id @default(cuid())
  clientId   String                          // toujours l'ID du User client
  senderRole String                          // "client" | "admin"
  content    String
  read       Boolean  @default(false)
  createdAt  DateTime @default(now())
  client     User     @relation(fields: [clientId], references: [id])
}
```

**Migration :** `prisma migrate dev --name add-roles-and-messages`

### Modèle `Invoice` — ajout du lien client optionnel
```prisma
model Invoice {
  // champs existants...
  clientUserId String?   // lien vers User.id si le client a un compte
}
```

---

## 3. Architecture des routes

Approche retenue : **routes séparées par rôle + composants partagés**.

```
app/
├── (public)/
│   ├── login/page.tsx
│   └── unauthorized/page.tsx
├── (print)/
│   └── factures/[id]/print/page.tsx        ← pas de layout sidebar
├── admin/
│   ├── layout.tsx                           ← AdminLayout (Sidebar admin)
│   ├── dashboard/page.tsx
│   ├── leads/page.tsx + LeadActions.tsx
│   ├── factures/page.tsx
│   ├── factures/[id]/page.tsx
│   ├── factures/nouvelle/page.tsx
│   ├── prompts/page.tsx + PromptsClient.tsx
│   ├── workspace/page.tsx
│   ├── messages/page.tsx
│   └── users/page.tsx
├── collaborateur/
│   ├── layout.tsx                           ← CollabLayout (Sidebar collab)
│   ├── dashboard/page.tsx
│   ├── leads/page.tsx
│   ├── prompts/page.tsx
│   ├── workspace/page.tsx
│   └── messages/page.tsx
├── comptable/
│   ├── layout.tsx                           ← ComptableLayout (Sidebar comptable)
│   ├── dashboard/page.tsx
│   ├── factures/page.tsx
│   ├── factures/[id]/page.tsx
│   └── factures/nouvelle/page.tsx
└── client/
    ├── layout.tsx                           ← ClientLayout (Sidebar client)
    ├── dashboard/page.tsx
    ├── factures/page.tsx
    └── messages/page.tsx
```

**Composants partagés réutilisés entre espaces :**
- `components/shared/InvoiceTable.tsx` — liste de factures (admin + comptable)
- `components/shared/LeadTable.tsx` — liste de leads (admin + collaborateur)
- `components/shared/PromptsClient.tsx` — bibliothèque prompts
- `components/shared/WorkspaceChat.tsx` — espace IA
- `components/shared/StatusBadge.tsx` — badge de statut générique
- `components/shared/InvoiceForm.tsx` — formulaire nouvelle facture

**Layouts partagés :**
- `components/layout/SidebarShell.tsx` — structure sidebar commune (logo, footer déconnexion)
- Chaque espace instancie `SidebarShell` avec ses propres items de navigation

---

## 4. Middleware

Fichier `middleware.ts` à la racine du projet.

**Logique :**
1. Lire la session JWT depuis le cookie NextAuth
2. Si route `/admin/*` → exiger `role === "admin"`, sinon `/unauthorized`
3. Si route `/collaborateur/*` → exiger `role === "admin" | "collaborateur"`, sinon `/unauthorized`
4. Si route `/comptable/*` → exiger `role === "admin" | "comptable"`, sinon `/unauthorized`
5. Si route `/client/*` → exiger `role === "client"`, sinon `/unauthorized`
6. Si route `/` → rediriger selon le rôle :
   - admin → `/admin/dashboard`
   - collaborateur → `/collaborateur/dashboard`
   - comptable → `/comptable/dashboard`
   - client → `/client/dashboard`
7. Routes publiques (`/login`, `/unauthorized`, `/factures/*/print`) → toujours accessibles

Le role est embarqué dans le JWT via le callback `jwt` de NextAuth (ajout de `token.role`).

---

## 5. Authentification — modifications

**`lib/auth.ts`** — callback `jwt` étendu pour inclure le rôle :
```ts
async jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.role = user.role
  }
  return token
}
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id
    session.user.role = token.role
  }
  return session
}
```

**`types/next-auth.d.ts`** — extension des types pour inclure `role`.

**`app/login/page.tsx`** — après connexion réussie, redirige vers le bon espace selon le rôle (via `callbackUrl` dynamique construit depuis la session, ou via un redirect API).

---

## 6. Pages par espace

### `/admin/dashboard`
Stats globales : total leads, leads nouveaux, total factures, CA encaissé, messages non lus. Liste des 5 derniers leads. Même structure que l'actuel `(admin)/page.tsx`.

### `/admin/leads`
Liste complète des leads avec filtres par statut. `LeadActions` pour changer statut + ajouter notes.

### `/admin/factures`
Liste toutes les factures. Bouton "Nouvelle facture". Lien vers page détail.

### `/admin/factures/nouvelle` + `/admin/factures/[id]`
Formulaire de création/édition. Champs : numéro, client, items (JSON), TVA, statut, date d'échéance.

### `/admin/prompts`
Bibliothèque de prompts. CRUD complet.

### `/admin/workspace`
Chat IA (Claude / GPT). Clé API saisie manuellement, non sauvegardée.

### `/admin/messages`
Liste des threads clients. Chaque thread = messages d'un client. Vue thread sélectionné + réponse admin. Badge dans sidebar si messages non lus.

### `/admin/users`
Tableau de tous les utilisateurs. Colonnes : nom, email, rôle, statut (actif/inactif), date de création. Actions : modifier rôle, désactiver compte, créer nouvel utilisateur.

---

### `/collaborateur/dashboard`
Stats leads : total, nouveaux, contactés. Liste des 5 derniers leads.

### `/collaborateur/leads`
Même composant partagé que admin/leads.

### `/collaborateur/prompts` + `/collaborateur/workspace`
Composants partagés identiques.

### `/collaborateur/messages`
Accès en lecture/écriture aux threads clients (même vue que admin).

---

### `/comptable/dashboard`
Stats financières : CA total encaissé, factures en attente, factures échues. Graphique simple (liste par mois en pur CSS).

### `/comptable/factures`
Liste des factures avec filtres par statut. Bouton créer + bouton exporter CSV.

### `/comptable/factures/nouvelle` + `/comptable/factures/[id]`
Composant partagé `InvoiceForm`.

---

### `/client/dashboard`
Statut du dossier affiché avec indicateur visuel (Nouveau / En cours / Actif / Pause). Dernières factures (3 max). Accès rapide messagerie.

### `/client/factures`
Ses factures uniquement (`where: { clientUserId: session.user.id }`). Bouton "Voir / Imprimer" → `/factures/[id]/print`.

### `/client/messages`
Thread de ses messages avec Altomea. Formulaire pour envoyer un nouveau message.

---

## 7. Page `/unauthorized`

Layout minimal sans sidebar. Message sobre :
> « Vous n'avez pas accès à cette page. »

Bouton "Retour à mon espace" → redirect selon le rôle en session (ou `/login` si non connecté).

---

## 8. Page `/factures/[id]/print`

Page isolée (pas de layout admin). Accessible aux rôles autorisés (admin, comptable, client si la facture lui appartient).

**Structure :**
- Fond blanc, texte noir
- Header : logo Altomea (texte gold → noir à l'impression) + coordonnées agence
- Corps : numéro facture, client, tableau des items, sous-total, TVA, total
- Footer : mentions légales simples
- Bouton "Imprimer / Télécharger PDF" → `window.print()` (masqué à l'impression via `@media print`)

---

## 9. API Routes

Routes API existantes migrées vers les nouveaux chemins si nécessaire. Nouvelles routes :

| Route | Méthode | Description |
|---|---|---|
| `POST /api/messages` | POST | Envoyer un message (client ou admin) |
| `GET /api/messages/[clientId]` | GET | Récupérer le thread d'un client |
| `PATCH /api/messages/[id]/read` | PATCH | Marquer message(s) comme lus |
| `GET /api/users` | GET | Liste des utilisateurs (admin only) |
| `PATCH /api/users/[id]` | PATCH | Modifier rôle / statut actif (admin only) |
| `POST /api/users` | POST | Créer un utilisateur (admin only) |
| `GET /api/invoices/[id]` | GET | Données facture pour la page print |

---

## 10. Seed mis à jour

`scripts/seed.ts` crée des utilisateurs de test pour chaque rôle :
- `admin@altomea.ch` / `admin123` → role: admin
- `collab@altomea.ch` / `collab123` → role: collaborateur
- `compta@altomea.ch` / `compta123` → role: comptable
- `client@restaurant-test.ch` / `client123` → role: client

---

## 11. Migration depuis l'existant

L'actuel groupe de routes `app/(admin)/` est **entièrement supprimé** et remplacé par `app/admin/`. Contenu à migrer :

| Ancien chemin | Nouveau chemin |
|---|---|
| `app/(admin)/page.tsx` | `app/admin/dashboard/page.tsx` |
| `app/(admin)/leads/` | `app/admin/leads/` |
| `app/(admin)/factures/` | `app/admin/factures/` |
| `app/(admin)/prompts/` | `app/admin/prompts/` |
| `app/(admin)/workspace/` | `app/admin/workspace/` |
| `app/(admin)/layout.tsx` | `app/admin/layout.tsx` (refondu) |

Les API routes existantes (`/api/leads`, `/api/prompts`, `/api/workspace`) restent en place, non déplacées. La route `/api/auth/[...nextauth]` reste identique.

---

## 12. Ce qui est hors scope

- Notifications temps réel (WebSockets, SSE) — rechargement de page suffit
- Envoi d'email lors d'un nouveau message
- Upload de fichiers joints dans la messagerie
- Authentification OAuth (Google, etc.)
- 2FA
