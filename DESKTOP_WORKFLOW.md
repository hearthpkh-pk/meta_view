# 📌 Workflow: Web App to Desktop App (Tauri / Electron)

**เป้าหมาย:** พัฒนา Web Application (Vite / Vanilla JS) ให้เสร็จสมบูรณ์ ก่อนนำไปแพ็กเป็น Desktop App (.exe) สำหรับใช้งานบน PC

---

## ⚠️ กฎข้อบังคับสำหรับฝั่ง Frontend (Vite)
โปรเจกต์ของเราเป็น **Client-Side Rendering (CSR)** ด้วย Vite 100% ซึ่งมีความพร้อมสำหรับการทำ Desktop App (Tauri / Electron) อยู่แล้วโดยธรรมชาติ โค้ดที่ดึงข้อมูลผ่าน API (Supabase / FB) สามารถนำไปใช้ในฝั่ง Desktop ได้ทันที โดยไม่ต้องแก้ไขโครงสร้างการทำงาน

**ข้อควรระวังสำคัญ:**
> **การดึงข้อมูลทั้งหมดต้องทำผ่าน API (Client-side fetching) เท่านั้น!** 
> ระบบ Desktop App ไม่สามารถมี Server ในตัวเพื่อรองรับการดึง Database ตรงๆ ได้ (ห้ามใช้ท่า Server-Side Rendering เป็นอันขาด)

* ต้องตั้งค่าในไฟล์ `vite.config.js` ให้การ Build รองรับรูปการอ้างอิงไฟล์แบบ **Relative Path** เสมอ:
    
```javascript
export default defineConfig({
  base: './', // 👈 บังคับให้ใช้ path แบบ Relative (./) เพื่อให้โหลดหน้าบน Desktop App ได้
  // ...
})
```

---

## 🚀 สเตปการทำงานของทีม

1. **เฟสปัจจุบัน (Frontend Development):**
   * ทีม Frontend ลุยเขียน UI ทำหน้า Dashboard ผ่านเทคโนโลยี Vanilla JS + SPA Routing ให้เสร็จ
   * การรับ-ส่งข้อมูลต้องทำผ่าน API หรือ Database Service (Supabase) จากฝั่ง Client ทั้งหมด
   * ทดสอบการทำงานทั้งหมดบนเว็บเบราว์เซอร์ (`npm run dev`) ให้เสถียร

2. **เฟสคู่ขนาน (Backend Development):**
   * เตรียมระบบ Database Policies (RLS) และ Supabase Edge Functions เพื่อรองรับ Request จากฝั่ง SPA

3. **เฟสแพ็กเกจจิ้ง (Desktop App Integration):**
   * เมื่อเว็บพร้อมสมบูรณ์ ให้รันคำสั่ง Build (`npm run build`) เพื่อแพ็กไฟล์ทั้งหมดเป็นหน้าเว็บสแตติก
   * จะได้โฟลเดอร์ผลลัพธ์ (`dist/` ที่ประกอบด้วย HTML/CSS/JS บริสุทธิ์) 
   * นำโฟลเดอร์ดึงกล่าวไปผูกเข้ากับ Framework สำหรับทำ Desktop App เช่น **Tauri** หรือ **Electron**
   * สั่งแพ็กโปรแกรมคอมไพล์เป็นไฟล์นามสกุล .exe สำหรับผู้ใช้งาน PC

💡 **สรุป:** โครงสร้างของ Vite คือความสมบูรณ์แบบที่เกิดมาเพื่อพอร์ตเป็น Desktop App อยู่แล้ว แค่เขียนให้ดึงข้อมูลผ่านฝั่ง Client อย่างระมัดระวังก็เพียงพอ!
