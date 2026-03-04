# 🍎 Lumina's iOS Design System for Meta Views

## 🌟 Philosophy

"Technology should feel invisible." - เทคโนโลยีควรรู้สึกไร้ตัวตน

Design System นี้ถูกสร้างขึ้นตามหลักการ **iOS Human Interface Guidelines** ผสมผสานกับ **Emotional Minimalism** เพื่อสร้างประสบการณ์ที่ "ฮีลใจ" ผู้ใช้งาน

---

## 🎨 Color Palette - iOS Style

### Primary Colors
```css
--ios-blue: #007AFF        /* สีหลักของ iOS */
--ios-green: #34C759       /* สำเร็จ */
--ios-orange: #FF9500      /* คำเตือน */
--ios-red: #FF3B30         /* ข้อผิดพลาด */
--ios-purple: #AF52DE      /* สีม่วง */
```

### Neutral Grays - Warm & Soft
```css
--ios-white: #FFFFFF       /* พื้นหลังหลัก */
--ios-gray-50: #F2F2F7     /* พื้นหลังรอง */
--ios-gray-100: #E5E5EA    /* เส้นขอบ */
--ios-gray-300: #C7C7CC    /* ข้อความทุติยภูมิ */
--ios-gray-500: #8E8E93    /* ข้อความตติยภูมิ */
--ios-gray-900: #1C1C1E    /* พื้นหลังมืด */
```

### Semantic Colors
```css
--ios-success: #34C759     /* สำเร็จ */
--ios-warning: #FF9500     /* คำเตือน */
--ios-error: #FF3B30       /* ข้อผิดพลาด */
--ios-info: #007AFF         /* ข้อมูล */
```

---

## 📝 Typography System

### Font Families
- **SF Pro Display** (หัวข้อ) - สำหรับ Headings
- **SF Pro Text** (เนื้อหา) - สำหรับ Body Text
- **Noto Sans Thai** - สำหรับภาษาไทย
- **Inter Mono** - สำหรับตัวเลขและโค้ด

### Typography Scale
```css
.ios-title1    { font-size: 28px; font-weight: 700; } /* หัวข้อใหญ่สุด */
.ios-title2    { font-size: 22px; font-weight: 700; } /* หัวข้อรอง */
.ios-title3    { font-size: 20px; font-weight: 600; } /* หัวข้อเล็ก */
.ios-headline  { font-size: 17px; font-weight: 600; } /* บรรทัดสำคัญ */
.ios-body      { font-size: 17px; font-weight: 400; } /* เนื้อหาหลัก */
.ios-callout   { font-size: 16px; font-weight: 400; } /* ข้อความเรียก */
.ios-subhead   { font-size: 15px; font-weight: 400; } /* หัวข้อย่อย */
.ios-footnote  { font-size: 13px; font-weight: 400; } /* หมายเหตุ */
.ios-caption1  { font-size: 12px; font-weight: 400; } /* คำบรรยาย */
.ios-caption2  { font-size: 11px; font-weight: 400; } /* คำบรรยายเล็ก */
```

---

## 🎯 Component Library

### 📱 Cards
```javascript
iOSComponents.createCard({
  title: "หัวข้อ",
  subtitle: "รายละเอียด",
  icon: "fas fa-chart-line",
  badge: { text: "ใหม่", type: "success" },
  onClick: () => console.log("clicked")
})
```

### 📊 Metric Cards
```javascript
iOSComponents.createMetricCard({
  value: "1,234",
  label: "ยอดวิวทั้งหมด",
  change: "+12%",
  changeType: "positive",
  icon: "fas fa-eye",
  color: "blue"
})
```

### 📋 Lists
```javascript
iOSComponents.createList([
  {
    title: "รายการที่ 1",
    subtitle: "รายละเอียด",
    icon: "fas fa-file",
    onClick: (item) => console.log(item)
  }
])
```

### 🎛️ Toggles
```javascript
iOSComponents.createToggle({
  label: "เปิดการใช้งาน",
  checked: true,
  onChange: (value) => console.log(value)
})
```

### 🔘 Buttons
```javascript
iOSComponents.createButton({
  label: "บันทึก",
  icon: "fas fa-save",
  variant: "primary", // primary, secondary, ghost
  onClick: () => console.log("clicked")
})
```

---

## ✨ Animations & Micro-interactions

### Spring Physics
```javascript
iOSAnimations.spring(element, properties, 'gentle')
```

### Page Transitions
```javascript
iOSAnimations.pageTransition(fromPage, toPage, 'forward')
```

### Touch Effects
```javascript
iOSAnimations.createRipple(event, element)
```

### Success Celebrations
```javascript
iOSAnimations.celebrate(element, 'success')
```

### Loading States
```javascript
iOSAnimations.createLoadingState(container, 'skeleton')
```

---

## 🧭 Navigation Patterns

### Tab Bar Navigation
```javascript
iOSNavigation.initialize({
  tabs: [
    { icon: "fas fa-home", label: "หน้าแรก" },
    { icon: "fas fa-chart-bar", label: "สถิติ" },
    { icon: "fas fa-cog", label: "ตั้งค่า" }
  ]
})
```

### Stack Navigation
```javascript
iOSNavigation.push(pageElement, { title: "หน้าใหม่" })
iOSNavigation.pop()
```

---

## 🎨 Design Principles

### 1. **Clarity (ความชัดเจน)**
- ใช้ White Space อย่างเป็นระเบียบ
- จัดลำดับความสำคัญด้วยขนาดและสี
- ใช้ Typography ที่อ่านง่าย

### 2. **Deference (ความเคารพ)**
- UI ไม่โดดเด่นกว่า Content
- ใช้สีที่สบายตา
- ลด Element ที่ไม่จำเป็น

### 3. **Depth (ความลึก)**
- ใช้ Blur และ Translucency
- สร้างลำดับชั้นที่ชัดเจน
- ใช้เงาอย่างพอดี

---

## 📱 Responsive Design

### Mobile First
```css
/* มือถือ (ค่าเริ่มต้น) */
.ios-card { padding: 16px; }

/* แท็บเล็ต */
@media (min-width: 768px) {
  .ios-card { padding: 20px; }
}

/* เดสก์ท็อป */
@media (min-width: 1024px) {
  .ios-card { padding: 24px; }
}
```

### Touch Targets
- ขนาดขั้นต่ำ: 44x44px (iOS HIG)
- ระยะห่าง: 8px ขั้นต่ำ
- พื้นที่สัมผัส: พอดีกับนิ้วโป้ง

---

## 🌙 Dark Mode

### Color Adaptation
```css
@media (prefers-color-scheme: dark) {
  :root {
    --ios-bg-primary: #1C1C1E;
    --ios-bg-secondary: #000000;
    --ios-text-primary: #FFFFFF;
    --ios-text-secondary: #EBEBF5;
  }
}
```

### Blur Effects
- ใช้ `backdrop-filter: blur(20px)`
- ปรับความโปร่งใสตาม Context

---

## 🎯 Usage Guidelines

### DO ✅
- ใช้สีที่กำหนดไว้เท่านั้น
- เน้นความเรียบง่าย
- ให้ Feedback ทุกการกระทำ
- ใช้ Animation ที่เป็นธรรมชาติ

### DON'T ❌
- ใช้สีฉูดฉาดที่ไม่อยู่ใน Palette
- สร้าง UI ที่รก
- ใช้ Animation ที่ไม่จำเป็น
- ละเมิด iOS HIG

---

## 🔧 Implementation

### 1. Include CSS
```html
<link rel="stylesheet" href="src/styles/ios-theme.css">
```

### 2. Include JavaScript
```html
<script src="src/components/iOSComponents.js"></script>
<script src="src/animations/iOSAnimations.js"></script>
<script src="src/components/iOSNavigation.js"></script>
```

### 3. Initialize
```javascript
// Initialize Navigation
iOSNavigation.initialize({
  tabs: [
    { icon: "fas fa-home", label: "หน้าแรก" },
    { icon: "fas fa-chart-bar", label: "สถิติ" }
  ]
})

// Create Components
const card = iOSComponents.createCard({...})
document.body.appendChild(card)
```

---

## 🎨 Component Showcase

### 📊 Dashboard Layout
```
┌─────────────────────────────────┐
│ Navigation Bar                  │
├─────────────────────────────────┤
│ Metric Cards (2-3 columns)      │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │Card │ │Card │ │Card │        │
│ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────┤
│ Content Cards                   │
│ ┌─────────────────────────────┐ │
│ │ List/Table Content          │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Tab Bar                        │
└─────────────────────────────────┘
```

### 📱 Mobile Layout
```
┌─────────────────┐
│ Navigation Bar  │
├─────────────────┤
│                 │
│   Content       │
│                 │
├─────────────────┤
│ Tab Bar         │
└─────────────────┘
```

---

## 🚀 Migration Guide

### จาก Meta Theme ไป iOS Theme
1. **แทนที่สี**: เปลี่ยนจาก Facebook Colors เป็น iOS Colors
2. **ปรับ Typography**: ใช้ SF Pro Fonts
3. **เพิ่ม Animations**: ใส่ Micro-interactions
4. **ปรับ Navigation**: ใช้ Tab Bar แทน Sidebar

### Step-by-Step
1. เพิ่ม `ios-theme.css` เข้าไป
2. ค่อยๆ เปลี่ยน class names
3. ทดสอบ Responsive Design
4. เพิ่ม Animations ทีละส่วน

---

## 📞 Support

### Documentation
- ดูตัวอย่างใน `examples/` folder
- อ่าน Component API ใน code comments
- ตรวจสอบ iOS HIG สำหรับ best practices

### Troubleshooting
- ตรวจสอบว่า include CSS ถูกต้อง
- ตรวจสอบ Font loading
- ทดสอบในหลายๆ browsers

---

*"Good design is obvious. Great design is transparent."* - Joe Sparano

---

*Created by Lumina - Senior UI/UX Architect*  
*Based on iOS Human Interface Guidelines & Emotional Minimalism*
