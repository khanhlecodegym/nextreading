# NextReading

- Đánh giá sách từ người đọc
- Mạng xã hội cho người đọc sách: Lịch sử đọc sách, xây dựng hình ảnh cá nhân

## Hướng Dẫn

Update data trong file `.env`
```
ENVIRONMENT=dev
PORT=4000
BASE_URL=http://localhost:4000
DATABASE_URL=mongodb+srv://admin:admin123@cluster0.db3mi.mongodb.net/dagisa
PASS_PORT_SECRET_KEY=localhostPrivateKey

# AWS S3
S3_BUCKET=booksense-dev.com
S3_KEY=
S3_SECRET=

# SOCIAL PROVIDER
FB_KEY=387895559208287
FB_SECRET=ba11241720b323dfa1b56e66232801f3
GG_KEY=348428445726-qlt9n2tufu89rrgtkpnh9sovsj2b3i6v.apps.googleusercontent.com
GG_SECRET=NJLAufCUrD2lcjoHnZQzXPge
TW_KEY=71LABcori8AkmmGIG9o6B5rVi
TW_SECRET=QaPytR6yx5ztsdOIauOwtA3OaBYuxBgU7Nzkn7VWRI2PUiBJAH
```

1. Navigate to server folder `cd server`
2. Install dependencies packages `yarn install`
3. Run server by `yarn start`
4. Server is ready at [http://localhost:4000](http://localhost:4000)

## DB Models

![DB Models](img/DB.png?raw=true)
