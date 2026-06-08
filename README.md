# Sirkula

Sirkula adalah sistem *reverse marketplace* sampah yang menghubungkan pengguna dengan mitra pengumpul sampah untuk memfasilitasi daur ulang.

## Struktur Proyek

Monorepo ini terdiri dari dua bagian utama:
- `backend/`: Node.js, Express.js, Mongoose, Socket.IO
- `frontend/`: React, Vite, Tailwind CSS

## Persyaratan
- Node.js (v20+)
- MongoDB (Atlas atau lokal)
- Docker & Docker Compose (Opsional)

## Menjalankan Proyek secara Lokal

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Menjalankan dengan Docker
```bash
docker-compose up -d --build
```
