import { testDatabaseConnection } from "@/actions/queries";

export async function GET() {
  const isConnected = testDatabaseConnection();

  return Response.json(
    {
      status: "ok",
      mongodb: (await isConnected) ? "Connected" : "Not Connected",
    },
    { status: 200 }
  );
}
