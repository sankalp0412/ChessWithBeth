import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Logo from "@/../public/BETH_Logo_1.png";

const Auth: React.FC = () => {
  return (
    <div className="flex flex-col justify-center relative">
      <img src={Logo}></img>
      <div className="fixed inset-0 flex items-center justify-center ">
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
          }}
          className="w-full max-w-md bg-gray-900/70 rounded-xl shadow-lg p-8"
        >
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight flex justify-center">
              Chess with{" "}
              <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                BETH
              </span>
            </h1>
            <p className="mt-2 text-gray-300 text-base flex justify-center">
              Create your account
            </p>
          </div>
          {/* Login button on top left */}
          <div className="absolute top-5 right-5">
            <Button>Log in</Button>
          </div>

          {/* form */}
          <div className="flex flex-col gap-2 ">
            <input></input>
            <input></input>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
