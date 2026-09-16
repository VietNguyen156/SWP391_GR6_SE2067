import {Navigate,Route,Routes} from 'react-router-dom';
import React from "react";
import Layout from './layouts/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Page from './pages/Page';

export default function App(){
 return <Routes>
  <Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/>
  <Route path="/" element={<Layout/>}>
   <Route index element={<Navigate to="/user/dashboard" replace/>}/>
   <Route path=":role/:page" element={<Page/>}/>
  </Route>
  <Route path="*" element={<Navigate to="/user/dashboard" replace/>}/>
 </Routes>
}
