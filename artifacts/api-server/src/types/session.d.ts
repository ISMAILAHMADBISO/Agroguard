import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: number;
    /** super_admin | admin | agronomist | staff | farmer */
    userRole: string;
    /** staff = platform staff member; farmer = farmer account */
    userType: "staff" | "farmer";
    userName: string;
    userEmail: string;
    mustChangePassword: boolean;
  }
}
