import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import "@fontsource/fusion-pixel-12px-proportional-sc";

const PageNotFound = () => {
  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-[80vw] max-w-[300px] h-[80vw] max-h-[300px] sm:w-[250px] sm:h-[250px] md:w-[30%] md:h-[30%]">
        <DotLottieReact
          src="https://lottie.host/a85356c2-a8de-4974-a766-a6b807e5e337/nx1vC6XpLC.lottie"
          loop
          autoplay
        />
      </div>
      <h1
        className="text-slate-400 font-bold mt-4 text-2xl sm:text-3xl md:text-4xl"
        style={{ fontFamily: "'Fusion Pixel 12px Proportional SC', monospace" }}
      >
        Sorry Page Not Found...!
      </h1>
      <p className="text-slate-300 text-sm sm:text-base m-4 text-center">
        Please check the URL.
      </p>
    </div>
  );
};

export default PageNotFound;
