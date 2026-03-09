# 📌 Workflow: Next.js to Desktop App (Tauri / Electron)

**เป้าหมาย:** พัฒนา Web Application (Next.js) ให้เสร็จสมบูรณ์ ก่อนนำไปแพ็กเป็น Desktop App (.exe) สำหรับใช้งานบน PC

---

## ⚠️ กฎข้อบังคับสำหรับฝั่ง Frontend (Next.js)
เพื่อเตรียมความพร้อมสำหรับการทำ Desktop App โค้ดฝั่งหน้าเว็บ **ต้องปฏิบัติตามแนวทางนี้อย่างเคร่งครัด:**

> **ห้ามทำ Server-Side Rendering (SSR) ดึง Database ตรงๆ บนหน้าเว็บเด็ดขาด!** 
> ให้เขียนการดึงข้อมูลทั้งหมดผ่าน **API (Client-side fetching)** เท่านั้น เพราะในขั้นตอนสุดท้าย โปรเจกต์ Next.js จะต้องถูก Build ให้อยู่ในโหมด Static HTML เพื่อนำไปใส่ในโปรแกรม PC

* ต้องตั้งค่าในไฟล์ `next.config.js` ให้เป็นโหมด Export:
    
```javascript
const nextConfig = {
  output: 'export',
}
module.exports = nextConfig
```

---

## 🚀 สเตปการทำงานของทีม

1. **เฟสปัจจุบัน (Frontend Development):**
   * ทีม Frontend ลุยเขียน Next.js ทำหน้า Dashboard ให้เสร็จ
   * การรับ-ส่งข้อมูลต้องทำผ่าน API ทั้งหมด
   * ทดสอบการทำงานและเช็กความถูกต้องของยอดต่างๆ ผ่านเว็บเบราว์เซอร์ให้สมบูรณ์

2. **เฟสคู่ขนาน (Backend Development):**
   * เตรียมเซิร์ฟเวอร์และระบบ API กลางให้พร้อม เพื่อรองรับการยิง Request จากฝั่ง Next.js

3. **เฟสแพ็กเกจจิ้ง (Desktop App Integration):**
   * เมื่อฝั่งเว็บ (Next.js) โค้ดนิ่งแล้ว ให้ทำการ Build โหมด Static 
   * นำโฟลเดอร์ผลลัพธ์ (HTML/CSS/JS) ที่ได้ ไปใส่ใน Framework สำหรับทำ Desktop App เช่น **Tauri** หรือ **Electron**
   * สั่งแพ็กเป็นไฟล์ .exe พร้อมตั้งค่าระบบ Auto-Update ผ่าน Git
   * นำไปติดตั้งลงเครื่องผู้ใช้งาน

💡 **สรุป:** หากโครงสร้างการดึงข้อมูลถูกแยกเป็น API ตั้งแต่ต้น เมื่อถึงขั้นตอนการทำ PC App จะสามารถนำโค้ดไปใส่กล่อง Tauri/Electron ได้ทันทีโดยแทบไม่ต้องแก้ไขโค้ดฝั่งเว็บเลย
