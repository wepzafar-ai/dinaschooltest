# Railwayga joylash

Bu loyiha Railway uchun tayyorlangan. Railway bitta service ichida frontendni build qiladi va backend orqali saytni ochadi.

## 1. GitHubga yuklash

Loyihani GitHub repositoryga yuklang. Keyin Railwayda:

1. `New Project`
2. `Deploy from GitHub repo`
3. Shu repositoryni tanlang

Railway `railway.json` orqali build/start komandalarni o'zi oladi.

## 2. Variables

Railway service ichida `Variables` bo'limiga shularni qo'ying:

```env
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin12345
DATA_DIR=/data
```

`PORT` ni qo'ymang. Railway uni o'zi beradi.

## 3. Volume

Natijalar va o'quvchilar ma'lumoti redeploydan keyin o'chib ketmasligi uchun Railwayda Volume qo'shing:

- Mount path: `/data`

Agar Volume qo'shmasangiz ham sayt ishlaydi, lekin redeploydan keyin `db.json` qayta yaratilishi mumkin.

## 4. Start command

Railway avtomatik shuni ishlatadi:

```bash
npm run start:railway
```

Build command:

```bash
npm run railway:build
```

## 5. Saytni ochish

Deploy tugagandan keyin Railway bergan domenni oching. Frontend ham, backend API ham shu bitta domen ichida ishlaydi.

Admin:

```text
login: admin
password: admin12345
```
