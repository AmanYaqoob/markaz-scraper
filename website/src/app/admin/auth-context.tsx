"use client";
import { createContext, useContext } from "react";

export const AuthCtx = createContext<string>("");
export const useAdminPassword = () => useContext(AuthCtx);
