/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   App.jsx                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/12 15:59:56 by eric              #+#    #+#             */
/*   Updated: 2026/03/12 17:07:33 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { MessagesProvider } from "./context/MessagesContext";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Callback from "./pages/Callback";
import Feed from "./pages/Feed/Feed";
import Messages from "./pages/Messages/Messages";
import Profile from "./pages/Profile/Profile";
import PublicProfile from "./pages/Profile/PublicProfile";
import Settings from "./pages/Settings/Settings";
import Layout from "./components/Layout";
import AuthLoader from "./components/AuthLoader";
import Followers from "./pages/Followers/Followers";
import Notifications from "./pages/Notifications/Notifications";

function App() 
{
  return (
    <AppProvider>
      <MessagesProvider>
        <BrowserRouter>
          <AuthLoader>
            <Routes>
              {/*ROUTE SANS NAVBAR */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/callback" element={<Callback />} />

              {/*ROUTE AVEC NAVBAR*/}
              <Route path="/feed" element={<Layout><Feed /></Layout>} />
              <Route path="/messages" element={<Layout><Messages /></Layout>}  />
              <Route path="/notifications" element={<Layout><Notifications /></Layout>}  />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/profile/:username" element={<Layout><PublicProfile /></Layout> } />
              <Route path="/settings" element={<Layout><Settings /></Layout>} />
              <Route path="/followers" element={<Layout><Followers /></Layout>} />

              {/*REDIRECTION PAR DEFAUT*/}
              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </AuthLoader>
        </BrowserRouter>
      </MessagesProvider>
    </AppProvider>
  );
}

export default App;
