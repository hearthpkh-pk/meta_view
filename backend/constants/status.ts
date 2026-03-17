export const PAGE_STATUS_CONFIG = {
    'ใช้งานปกติ': { 
        label: 'ใช้งานปกติ', 
        color: 'emerald', 
        bg: 'bg-emerald-50', 
        text: 'text-emerald-700', 
        border: 'border-emerald-200',
        level: 'safe' 
    },
    'ใช้งาน (แจ้งเตือน)': { 
        label: 'แจ้งเตือน (เหลือง)', 
        color: 'amber', 
        bg: 'bg-amber-50', 
        text: 'text-amber-700', 
        border: 'border-amber-200',
        level: 'warning' 
    },
    'ใช้งาน (จำกัด)': { 
        label: 'จำกัด (แดง)', 
        color: 'rose', 
        bg: 'bg-rose-50', 
        text: 'text-rose-700', 
        border: 'border-rose-200',
        level: 'restricted' 
    },
    'พักเพจปกติ': { 
        label: 'พักเพจปกติ', 
        color: 'blue', 
        bg: 'bg-blue-50', 
        text: 'text-blue-700', 
        border: 'border-blue-200',
        level: 'safe' 
    },
    'พักเพจ (แจ้งเตือน)': { 
        label: 'พักเพจ (เตือน)', 
        color: 'orange', 
        bg: 'bg-orange-50', 
        text: 'text-orange-700', 
        border: 'border-orange-200',
        level: 'warning' 
    },
    'พักเพจ (จำกัด)': { 
        label: 'พักเพจ (จำกัด)', 
        color: 'red', 
        bg: 'bg-red-50', 
        text: 'text-red-700', 
        border: 'border-red-200',
        level: 'restricted' 
    },
    'เพจมีปัญหา': { 
        label: 'เพจมีปัญหา', 
        color: 'slate', 
        bg: 'bg-slate-50', 
        text: 'text-slate-700', 
        border: 'border-slate-200',
        level: 'error' 
    }
} as const;

export type PageStatus = keyof typeof PAGE_STATUS_CONFIG;
