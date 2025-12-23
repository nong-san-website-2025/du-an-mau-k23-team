    // utils/chatUtils.js

    export const THEME_COLOR = "#00b96b"; // GreenFarm Green

    export const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' 
    });
    };

    export const getBuyerId = (conv, currentUserId) => {
        if (!conv) return null;
        const raw = conv.user ?? conv.buyer ?? conv.customer ?? conv.user_profile ?? conv.buyer_profile;
        let buyerId = null;
        
        if (raw && typeof raw === "object") buyerId = raw.id || raw.user_id || null;
        else if (typeof raw === "number") buyerId = raw;
        else if (typeof raw === "string" && raw.trim()) { const n = Number(raw); buyerId = Number.isNaN(n) ? null : n; }
        
        if (!buyerId) {
        const cand = conv.user_id ?? conv.buyer_id ?? conv.customer_id;
        if (typeof cand === "number") buyerId = cand;
        else if (typeof cand === "string" && cand.trim() && !Number.isNaN(Number(cand))) buyerId = Number(cand);
        }
        
        if (!buyerId && Array.isArray(conv.participants)) {
        const other = conv.participants.find((p) => {
            const pid = p?.id || p?.user?.id || p?.user_id;
            return !currentUserId || (pid && pid !== currentUserId);
        }) || conv.participants[0];
        const pid = other?.id || other?.user?.id || other?.user_id;
        if (typeof pid === "number") buyerId = pid;
        else if (typeof pid === "string" && pid.trim() && !Number.isNaN(Number(pid))) buyerId = Number(pid);
        }
        return buyerId;
    };

    export const getBuyerName = (conv, currentUserId) => {
        const u = conv?.user || conv?.buyer;
        // Sử dụng logic getBuyerId để fallback nếu cần thiết (ở đây demo đơn giản như logic cũ)
        return u?.full_name || u?.username || `Khách hàng #${getBuyerId(conv, currentUserId)}`;
    };

    export const getBuyerAvatar = (conv) => {
        const u = conv?.user || conv?.buyer;
        return u?.avatar || null;
    };