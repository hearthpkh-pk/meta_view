# Meta Views - Facebook Page Analytics Dashboard

ระบบจัดการและวิเคราะห์สถิติ Facebook Page ด้วย Meta API 

## Features

- 📊 จัดการ Facebook Page Tokens
- 📈 ดูสถิติยอดวิวและโพสต์รายวัน
- 🔧 เปิด/ปิดการดึงข้อมูลแต่ละเพจ
- 🚀 Modern UI ด้วย Tailwind CSS
- ⚡ Fast development ด้วย Vite

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm หรือ yarn
- Supabase account
- Facebook Developer account

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd meta_views
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
# แก้ไขค่าใน .env ตามค่าจาก Supabase ของคุณ
```

4. Start development server
```bash
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_META_API_VERSION=v25.0
VITE_APP_NAME=Meta Views
VITE_APP_VERSION=1.0.0
```

## Database Schema

ต้องสร้างตารางใน Supabase:

### tokens
- id (uuid, primary key)
- name (text)
- access_token (text)
- status (text)
- created_at (timestamp)

### pages  
- page_id (text, primary key)
- name (text)
- token_id (uuid, foreign key)
- is_active (boolean)
- created_at (timestamp)

### daily_stats
- id (uuid, primary key)
- page_id (text, foreign key)
- date (date)
- page_media_views (integer)
- posts_count (integer)
- created_at (timestamp)

## Usage

1. **เพิ่ม Token**: ไปที่หน้า Token Manager เพื่อเพิ่ม Facebook User Token
2. **ซิงค์เพจ**: กดปุ่ม "ซิงค์รายชื่อเพจใหม่จาก Token" เพื่อดึงรายชื่อเพจ
3. **จัดการเพจ**: เปิด/ปิดการดึงข้อมูลแต่ละเพจ
4. **ดูสถิติ**: ไปที่หน้า Dashboard เพื่อดูสถิติรายวัน

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/         # HTML pages
├── js/           # JavaScript modules
├── utils/        # Utility functions
└── styles/       # CSS files
public/           # Static assets
```

## Security Notes

- ใช้ Supabase Row Level Security (RLS) เพื่อป้องกันการเข้าถึงข้อมูล
- Token ถูกเก็บในฐานข้อมูลและเข้ารหัส
- ใช้ environment variables สำหรับค่าที่ sensitive
- Input validation ทุกจุด

## Contributing

1. Fork the project
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
