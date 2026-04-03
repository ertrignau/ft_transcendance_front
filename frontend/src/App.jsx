/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   App.jsx                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: eric <eric@student.42.fr>                  +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/12 15:59:56 by eric              #+#    #+#             */
/*   Updated: 2026/04/03 17:42:24 by eric             ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { MessagesProvider } from "./context/MessagesContext";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Register42 from './pages/Register/Register42';
import Callback from "./pages/Callback";
import Feed from "./pages/Feed/Feed";
import Messages from "./pages/Messages/Messages";
import Profile from "./pages/Profile/Profile";
import PublicProfile from "./pages/Profile/PublicProfile";
import Settings from "./pages/Settings/Settings";
import TermsOfService from "./pages/Terms/TermsOfService";
import PrivacyPolicy from "./pages/Privacy/PrivacyPolicy";
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
              <Route path="/register42" element={<Register42 />} />
              <Route path="/callback" element={<Callback />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />

              {/*ROUTE AVEC NAVBAR*/}
              <Route path="/feed" element={<Layout><Feed /></Layout>} />
              <Route path="/messages" element={<Layout><Messages /></Layout>}  />
              <Route path="/notifications" element={<Layout><Notifications /></Layout>}  />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
              <Route path="/profile/:userId" element={<Layout><PublicProfile /></Layout> } />
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
