
import { http } from "."

export const platFormApi = {

    // 
    isConnected: async (platform: string) => {
        const res = await http.get("/platform/connected/" + platform);
        return res.data;
    },

    connectedPlatforms: async () => {
        const res = await http.get("/platform/connected-platforms");
        return res.data;
    },
    
}
