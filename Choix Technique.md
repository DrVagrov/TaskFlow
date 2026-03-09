**Need analysis :**

To respond to the User Story's : 

*TaskFlow est une application de gestion de tâches permettant à un utilisateur de :*
*- Créer un compte et se connecter* 
*- Créer, lire, modifier et supprimer des tâches (CRUD)* 
*- Organiser ses tâches par catégorie et statut*
*- Filtrer et rechercher ses tâches*
*- Consulter un tableau de bord avec des statistiques*

Here a minimal structure needed : 

- User : {Id, Username,@mail, HashedPassword}
- Category / Tag : {Id, name}
- Statu : {Id, name}
- Task : {Id, title, description, idUser, idCategory, IdStatu}

***(OPTIONNAL)*** In the eventuality of a multi project management application, group viewing system will be more adapted (the User can only see tasks of attached groups) there will have some change to do : 

- **Group : {Id, name, HashedPassword, Users[] }**
- Task : {Id, title, description, idUser, idCategory, IdStatu, **IdGroup**}
- User : {Id, Username, @mail, HashedPassword}

**BDD Choice:**
    MongoDB is more adapted for this project. It's more flexible, more easly iterable, so it will easier to implement new evolutions and control point.
    On an other note, the fact we do not need to do extensive search (filtration is User story : by category, by statu, by User), so the search capacity of SQL is not needed.

**Stack Choice :**

- Back-end : Node.js | Express.js
- BDD : MongoDB | Mongoose
- Authentication: JWT + bcrypt
- Validation: express-validator
- Testing: Jest + Supertest
- Front-end : Html vanilla
