export const handleCopy = async (text: string, onSuccess?: () => void, onError?: () => void) => {
    if (!text) return;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const el = document.createElement('textarea');
            el.value = text;
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        if (onSuccess) onSuccess();
    } catch (err) {
        console.error('Copy failed:', err);
        if (onError) onError();
    }
};

import { PAGE_STATUS_CONFIG, type PageStatus } from '@meta/backend/constants/status';

export const getStatusColor = (status: string) => {
    const config = PAGE_STATUS_CONFIG[status as PageStatus];
    if (config) {
        return `${config.bg} ${config.text} ${config.border}`;
    }
    return 'bg-gray-100 text-gray-800 border-gray-300';
};
