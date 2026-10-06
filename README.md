# DinaSchool Test Platform

React frontend va Node.js backend asosida test platforma.

## Rollar

Admin:

- hamma o'quvchilarni ko'radi;
- kim test ishlaganini, kim ishlayotganini, kim tugatganini ko'radi;
- ism, guruh, test va status bo'yicha filter qiladi;
- yangi o'quvchi qo'shadi;
- natijalarni CSV qilib yuklab oladi.

O'quvchi:

- login va password bilan kiradi;
- HTML CSS testida aynan 50 ta savol ishlaydi;
- Word Excel testida aynan 50 ta savol ishlaydi;
- Word Excel PowerPoint testida ham aynan 50 ta savol ishlaydi;
- har bir test uchun 1 soat vaqt oladi;
- javoblar avtomatik saqlanadi;
- natijasini ko'radi.

## Default loginlar

Admin:

- login: `admin`
- password: `admin12345`

O'quvchilar:

- login: `ali`, password: `123456`
- login: `madina`, password: `123456`
- login: `jasur`, password: `123456`

## Windowsda ishga tushirish

1. Zipni `Extract All` qilib oching.
2. Papkani Desktopga qo'ying.
3. `run_windows.bat` faylini bosing.
4. Brauzerda `http://localhost:5173` ochiladi.

Eslatma: agar `run_windows.bat` tasodifan WinRAR ichidagi `Temp\Rar$...` papkasidan ishga tushsa, script loyihani Desktopga ko'chirib, o'sha yerdan ishga tushiradi.

Agar eski versiyadan qolgan 10 ta test ko'rinsa, `reset_data.bat` faylini bir marta bosing, keyin yana `run_windows.bat` ni ishga tushiring. Shunda hamma testlar 50 tadan yangilanadi.

Yoki asosiy papkada:

```bash
npm run dev
```

## Terminal orqali

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Backend URL:

```text
http://localhost:5000
```

## Admin parolini o'zgartirish

`backend/.env` faylini oching:

```env
PORT=5000
HOST=127.0.0.1
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin12345
```

`ADMIN_PASSWORD` ni o'zgartiring va backendni qayta ishga tushiring.
