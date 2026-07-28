// visitorService.js
import { apiClient } from "./DB-server.js";

// Insert visitor   
export const addVisitorAPI = (visitor) => {
  return apiClient.post("", { action: "insert", ...visitor });
};



/** 
export const updateVisitorAPI =  (visitorData) => {
    return apiClient.post("", {action: "update", ...visitor });
};

//export const deleteVisitorAPI = rfidcards => apiClient.post("", { action: "delete", rfidcards });
*/
// Count total visitors
export const countVisitorsAPI = () => {
    return apiClient.post("", { action: "count" });
};