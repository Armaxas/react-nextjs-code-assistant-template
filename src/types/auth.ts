import { AdapterUser } from "@auth/core/adapters";

export interface CustomAdapterUser extends AdapterUser {
  lastLogin: Date | null;
  role: string; // role: "admin" | "user"
}
