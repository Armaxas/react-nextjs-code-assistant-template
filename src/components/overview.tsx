import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const Overview = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.refresh();
    }

    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, [router, session, status]);

  // Removed loading state check to show Overview immediately
  // The Overview component will now display regardless of session loading state

  return (
    // <motion.div
    //   key="overview"
    //   className="w-full max-w-3xl mx-auto flex flex-col justify-center items-center"
    //   initial={{ opacity: 0, scale: 0.98 }}
    //   animate={{ opacity: 1, scale: 1 }}
    //   exit={{ opacity: 0, scale: 0.98 }}
    //   transition={{ duration: 0.4 }}
    // >
    //   <div className="relative p-8 bg-background w-full">
    //     {/* Enhanced background glow */}
    //     <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 blur-2xl rounded-full opacity-60" />

    //     <div className="relative flex flex-col items-center justify-center space-y-6 text-center py-8">
    //       <div className="relative">
    //         <div className="absolute -inset-4 bg-blue-500/30 blur-lg rounded-full animate-pulse" />
    //         <Sparkles className="relative w-16 h-16 text-blue-500" />
    //       </div>

    //       <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500">
    //         {greeting},{" "}
    //         {status === "loading"
    //           ? ""
    //           : session?.user?.name?.split(" ")[0] || "there"}
    //         !
    //       </h1>

    //       {/* <p className="text-xl text-muted-foreground max-w-md">
    //         How can I help you today?
    //       </p> */}
    //     </div>
    //   </div>
    // </motion.div>

    <motion.div
      key="overview"
      className="w-full max-w-3xl mx-auto flex flex-col justify-center items-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="relative flex flex-col items-center justify-center space-y-6 text-center"
        style={{ paddingTop: "10rem", paddingBottom: "0" }}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue-500/30 blur-lg rounded-full animate-pulse" />
            <Sparkles className="relative w-16 h-16 text-blue-500" />
          </div>

          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500">
            {greeting},{" "}
            {status === "loading"
              ? ""
              : session?.user?.name?.split(" ")[0] || "there"}
            !
          </h1>
        </div>

        {/* <p className="text-xl text-muted-foreground max-w-md">
      How can I help you today?
        </p> */}
      </div>
    </motion.div>
  );
};

export default Overview;
