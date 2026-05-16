import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      companyId: string;
      email: string;
      name?: string | null;
    };
  }

  interface User {
    role: Role;
    companyId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    companyId?: string;
  }
}
