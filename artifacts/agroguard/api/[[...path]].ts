import app from "../../api-server/src/app.ts";

export const config = {
  maxDuration: 60,
};

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}