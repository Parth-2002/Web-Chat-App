import React from "react";
import { Routes, Route } from "react-router-dom";
import App from "../App.jsx";
import ChatPage from "../components/ChatPage.jsx";
import PageNotFound from "../components/PageNotFound.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default AppRoutes;
