import { createContext, useContext } from "react";
export const FeedbackContext = createContext(null);
export function useConfirm() { return useContext(FeedbackContext); }
