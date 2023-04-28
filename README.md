# NodeJS

## BackEnd Api for Dashboard 
 - Use Node version >14
 - Install dependencies via npm or yarn
 - Create file config.json in /config, to connect database, see /config/config.example.json


### Install
```shell
yarn
```

###  Migrate create table Database
```shell
npx sequelize-cli db:migrate
```
### Seed data (Users, Roles)
```shell
npx sequelize-cli db:seed:all
```

```shell
yarn start
```
### Login account: admin | 12345678
